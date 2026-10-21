import { Response } from 'express';
import { db, generateId, getTodayDateString } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IAppointment, IPayment, PaymentStatus, PaymentMethod } from '../types.ts';
import { getIO } from '../services/socketService.ts';

// 1. Create Appointment (Pay at Hospital or Assisted Scheme)
export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      doctorId,
      appointmentDate,
      timeSlot,
      reason,
      paymentMethod = 'pay_at_hospital',
      financialAssistanceType,
      financialAssistanceId,
    } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      res.status(400).json({
        success: false,
        message: 'Doctor, appointment date, time slot, and consultation reason are required.',
      });
      return;
    }

    // Verify date is not in the past
    const today = getTodayDateString();
    if (appointmentDate < today) {
      res.status(400).json({ success: false, message: 'Cannot book appointments for past dates.' });
      return;
    }

    const doctor = db.users.find((u) => u._id === doctorId && u.role === 'doctor' && u.isActive);
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Selected doctor is not found or is currently inactive.' });
      return;
    }

    const department = db.departments.find((d) => d._id === doctor.doctorDetails?.departmentId);
    const deptName = department?.name || 'General';
    const deptCode = department?.code || 'GEN';

    // Authoritative consultation fee from DB
    const verifiedFee = Number(doctor.doctorDetails?.consultationFee) || 500;
    const isScheme = paymentMethod === 'assisted_scheme';
    const fee = isScheme ? 0 : verifiedFee;
    const paymentStatus: PaymentStatus = isScheme ? 'assisted_waived' : 'pending';

    // Concurrency / Duplicate check: Check if slot is already occupied
    const existingSlot = db.appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.appointmentDate === appointmentDate &&
        a.timeSlot === timeSlot &&
        !['Cancelled', 'No-show'].includes(a.status)
    );

    if (existingSlot) {
      res.status(409).json({
        success: false,
        message: `The selected time slot (${timeSlot}) is already booked with ${doctor.name}. Please choose another available slot.`,
      });
      return;
    }

    // Patient cannot have duplicate active booking with same doctor on same day
    const patientExisting = db.appointments.find(
      (a) =>
        a.patientId === user._id &&
        a.doctorId === doctorId &&
        a.appointmentDate === appointmentDate &&
        !['Cancelled', 'No-show'].includes(a.status)
    );

    if (patientExisting) {
      res.status(409).json({
        success: false,
        message: `You already have an active appointment (Token ${patientExisting.tokenDisplay}) with ${doctor.name} on ${appointmentDate}.`,
      });
      return;
    }

    // Calculate next token number for this doctor and date
    const sameDayDoctorApts = db.appointments.filter(
      (a) => a.doctorId === doctorId && a.appointmentDate === appointmentDate
    );
    const nextTokenNumber =
      sameDayDoctorApts.length > 0 ? Math.max(...sameDayDoctorApts.map((a) => a.tokenNumber)) + 1 : 1;

    const tokenDisplay = `${deptCode}-${nextTokenNumber.toString().padStart(3, '0')}`;
    const cleanDate = appointmentDate.replace(/-/g, '');
    const appointmentNumber = `APT-${cleanDate}-${nextTokenNumber.toString().padStart(3, '0')}`;
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const receiptNumber = `RCP-${cleanDate}-${nextTokenNumber.toString().padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newAppointment: IAppointment = {
      _id: generateId('apt'),
      appointmentNumber,
      patientId: user._id,
      patientName: user.name,
      patientPhone: user.phone,
      patientEmail: user.email,
      doctorId: doctor._id,
      doctorName: doctor.name,
      departmentId: department?._id || '',
      departmentName: deptName,
      appointmentDate,
      timeSlot,
      tokenNumber: nextTokenNumber,
      tokenDisplay,
      status: appointmentDate === today ? 'Waiting' : 'Confirmed',
      reason: reason.trim(),
      consultationFee: fee,
      paymentStatus,
      paymentMethod: paymentMethod as PaymentMethod,
      createdAt: now,
      updatedAt: now,
    };

    const newPayment: IPayment = {
      _id: generateId('pay'),
      paymentNumber,
      appointmentId: newAppointment._id,
      appointmentNumber: newAppointment.appointmentNumber,
      patientId: user._id,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
      doctorId: doctor._id,
      doctorName: doctor.name,
      departmentName: deptName,
      amount: fee,
      currency: 'INR',
      status: paymentStatus,
      method: paymentMethod as PaymentMethod,
      receiptNumber,
      financialAssistanceType: isScheme ? (financialAssistanceType || 'Govt Healthcare Subsidy') : undefined,
      financialAssistanceId: isScheme ? (financialAssistanceId || 'ASSIST-CARD') : undefined,
      notes: isScheme
        ? `Consultation fee waived under ${financialAssistanceType || 'healthcare scheme'}. ID: ${financialAssistanceId}`
        : 'Consultation fee payable at hospital counter during check-in.',
      createdAt: now,
      updatedAt: now,
    };

    newAppointment.paymentId = newPayment._id;

    db.appointments.push(newAppointment);
    db.payments.push(newPayment);

    // Rebuild queue for this doctor on this date
    db.rebuildQueueForDoctorDate(doctorId, appointmentDate);

    // Audit log
    db.logAudit(
      user._id,
      user.name,
      user.role,
      isScheme ? 'APPOINTMENT_ASSISTED_BOOKED' : 'APPOINTMENT_BOOKED_PAY_AT_HOSPITAL',
      'Appointment',
      newAppointment._id,
      `Booked appointment with ${doctor.name} on ${appointmentDate} at ${timeSlot}. Token: ${tokenDisplay}. Fee: ₹${fee} (${isScheme ? 'Assisted Waiver' : 'Pay at Hospital'}).`,
      req.ip || '127.0.0.1'
    );

    // Notifications
    const patientMsg = isScheme
      ? `Your appointment with ${doctor.name} is confirmed under ${financialAssistanceType || 'healthcare assistance'}. Token: ${tokenDisplay}.`
      : `Your appointment with ${doctor.name} is booked for ${appointmentDate} (${timeSlot}). Token: ${tokenDisplay}. Please pay ₹${fee} consultation fee at the hospital desk.`;

    db.createNotification(
      user._id,
      'Appointment Booked Successfully',
      patientMsg,
      'success',
      newAppointment._id
    );

    db.createNotification(
      doctor._id,
      'New Patient Scheduled',
      `${user.name} scheduled an appointment for ${appointmentDate} at ${timeSlot}. Token: ${tokenDisplay}.`,
      'info',
      newAppointment._id
    );

    // Socket real-time broadcast
    const io = getIO();
    if (io) {
      io.emit('queue_updated', {
        doctorId,
        date: appointmentDate,
        appointmentId: newAppointment._id,
        action: 'booked',
      });
    }

    res.status(201).json({
      success: true,
      message: isScheme
        ? 'Appointment confirmed with healthcare assistance waiver.'
        : 'Appointment booked successfully. Please pay the consultation fee at the hospital.',
      appointment: newAppointment,
      payment: newPayment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error booking appointment.', error: (error as Error).message });
  }
};

// 2. List Appointments with Filters
export const listAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { status, paymentStatus, date, doctorId, search, page = '1', limit = '10' } = req.query;

    let apts: IAppointment[] = [];

    if (user.role === 'patient') {
      apts = db.appointments.filter((a) => a.patientId === user._id);
    } else if (user.role === 'doctor') {
      apts = db.appointments.filter((a) => a.doctorId === user._id);
    } else if (user.role === 'admin') {
      apts = [...db.appointments];
    }

    if (status && typeof status === 'string' && status !== 'all') {
      apts = apts.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }

    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
      apts = apts.filter((a) => (a.paymentStatus || 'pending').toLowerCase() === paymentStatus.toLowerCase());
    }

    if (date && typeof date === 'string') {
      apts = apts.filter((a) => a.appointmentDate === date);
    }

    if (doctorId && typeof doctorId === 'string') {
      apts = apts.filter((a) => a.doctorId === doctorId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      apts = apts.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.tokenDisplay.toLowerCase().includes(q) ||
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.departmentName.toLowerCase().includes(q)
      );
    }

    // Sort by date desc, then token asc
    apts.sort((a, b) => {
      if (a.appointmentDate === b.appointmentDate) {
        return a.tokenNumber - b.tokenNumber;
      }
      return b.appointmentDate.localeCompare(a.appointmentDate);
    });

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const totalCount = apts.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = apts.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      appointments: paginated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error listing appointments.' });
  }
};

// 3. Get Appointment By ID
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

  const apt = db.appointments.find((a) => a._id === id || a.appointmentNumber === id);
  if (!apt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  // Authorize: patient can view own, doctor can view assigned, admin can view all
  if (user?.role === 'patient' && apt.patientId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden access to this appointment record.' });
    return;
  }
  if (user?.role === 'doctor' && apt.doctorId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden access to this appointment record.' });
    return;
  }

  res.json({ success: true, appointment: apt });
};

// 4. Update Appointment Payment Status (Admin / Hospital Staff Only)
export const updateAppointmentPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only authorized hospital administrators can update payment status.' });
      return;
    }

    if (!paymentStatus || !['pending', 'paid', 'assisted_waived'].includes(paymentStatus.toLowerCase())) {
      res.status(400).json({ success: false, message: "Invalid payment status. Allowed values: 'pending', 'paid', 'assisted_waived'." });
      return;
    }

    const apt = db.appointments.find((a) => a._id === id || a.appointmentNumber === id);
    if (!apt) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    const normalizedStatus = paymentStatus.toLowerCase() as PaymentStatus;
    const now = new Date().toISOString();

    apt.paymentStatus = normalizedStatus;
    apt.updatedAt = now;

    if (normalizedStatus === 'paid') {
      apt.paidAt = now;
      apt.markedPaidBy = user.name;
    }

    // Also update corresponding payment record
    const payment = db.payments.find((p) => p.appointmentId === apt._id || p._id === apt.paymentId);
    if (payment) {
      payment.status = normalizedStatus;
      payment.updatedAt = now;
      if (normalizedStatus === 'paid') {
        payment.paidAt = now;
        payment.markedPaidBy = user.name;
        payment.notes = `Payment of ₹${payment.amount} collected at hospital counter by ${user.name}.`;
      }
    }

    // Audit log
    db.logAudit(
      user._id,
      user.name,
      user.role,
      'PAYMENT_STATUS_UPDATED',
      'Appointment',
      apt._id,
      `Payment status updated to '${normalizedStatus}' for ${apt.patientName} (Token ${apt.tokenDisplay}). Fee: ₹${apt.consultationFee}.`,
      req.ip || '127.0.0.1'
    );

    // Notify patient
    db.createNotification(
      apt.patientId,
      'Payment Status Updated',
      normalizedStatus === 'paid'
        ? `Payment of ₹${apt.consultationFee} for appointment Token ${apt.tokenDisplay} has been confirmed as Paid at the hospital counter.`
        : `Payment status for appointment Token ${apt.tokenDisplay} is currently marked as ${normalizedStatus}.`,
      normalizedStatus === 'paid' ? 'success' : 'info',
      apt._id
    );

    res.json({
      success: true,
      message: `Payment status updated to '${normalizedStatus}' successfully.`,
      appointment: apt,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error updating payment status.', error: error.message });
  }
};

// 5. Cancel Appointment
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason = 'Cancelled by patient' } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const apt = db.appointments.find((a) => a._id === id || a.appointmentNumber === id);
  if (!apt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  // Authorization check
  if (user.role === 'patient' && apt.patientId !== user._id) {
    res.status(403).json({ success: false, message: 'You cannot cancel an appointment for another patient.' });
    return;
  }
  if (user.role === 'doctor' && apt.doctorId !== user._id) {
    res.status(403).json({ success: false, message: 'You cannot cancel an appointment for another doctor.' });
    return;
  }

  if (['Completed', 'Cancelled'].includes(apt.status)) {
    res.status(400).json({ success: false, message: `Cannot cancel an appointment that is already ${apt.status}.` });
    return;
  }

  const now = new Date().toISOString();
  apt.status = 'Cancelled';
  apt.cancellationReason = reason;
  apt.updatedAt = now;

  // If payment was pending, mark as cancelled
  const payment = db.payments.find((p) => p.appointmentId === apt._id || p._id === apt.paymentId);
  if (payment && payment.status === 'pending') {
    payment.status = 'cancelled';
    payment.failureReason = 'Appointment cancelled by user';
    payment.updatedAt = now;
  }

  // Rebuild Queue
  db.rebuildQueueForDoctorDate(apt.doctorId, apt.appointmentDate);

  // Notifications
  db.createNotification(
    apt.patientId,
    'Appointment Cancelled',
    `Your appointment ${apt.appointmentNumber} (Token: ${apt.tokenDisplay}) has been cancelled.`,
    'warning',
    apt._id
  );

  db.createNotification(
    apt.doctorId,
    'Patient Cancelled Slot',
    `Patient ${apt.patientName} cancelled their slot on ${apt.appointmentDate} (${apt.timeSlot}). Queue has been updated.`,
    'info',
    apt._id
  );

  db.logAudit(
    user._id,
    user.name,
    user.role,
    'APPOINTMENT_CANCELLED',
    'Appointment',
    apt._id,
    `Appointment ${apt.appointmentNumber} cancelled: ${reason}`,
    req.ip || '127.0.0.1'
  );

  const io = getIO();
  if (io) {
    io.emit('queue_updated', {
      doctorId: apt.doctorId,
      date: apt.appointmentDate,
      appointmentId: apt._id,
      action: 'cancelled',
    });
  }

  res.json({
    success: true,
    message: 'Appointment cancelled successfully. Queue positions have been adjusted.',
    appointment: apt,
  });
};
