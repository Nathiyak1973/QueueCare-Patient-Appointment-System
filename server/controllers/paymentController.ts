import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { db, generateId, getTodayDateString } from '../services/dbStore.ts';
import { IPayment, IAppointment, PaymentStatus, PaymentMethod } from '../types.ts';
import { getIO } from '../services/socketService.ts';

// 1. Get Payment Gateway Config
export const getPaymentConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      currency: 'INR',
      mode: 'pay_at_hospital',
      notes: 'Pay at Hospital Counter (Cash, UPI, or Card during check-in). Online payment gateway is disabled.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load payment config', error: error.message });
  }
};

// 2. Create Payment / Appointment Booking (Pay at Hospital or Assisted Scheme)
export const createPaymentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const {
      doctorId,
      appointmentDate,
      timeSlot,
      reason,
      paymentMethod = 'pay_at_hospital',
      financialAssistanceType,
      financialAssistanceId,
    } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      res.status(400).json({
        success: false,
        message: 'Doctor, appointment date, time slot, and consultation reason are required.',
      });
      return;
    }

    // Date validation
    const today = getTodayDateString();
    if (appointmentDate < today) {
      res.status(400).json({ success: false, message: 'Cannot book appointments for past dates.' });
      return;
    }

    // Verify Doctor and retrieve Authoritative Consultation Fee from DB
    const doctor = db.users.find((u) => u._id === doctorId && u.role === 'doctor' && u.isActive);
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Selected doctor is not available.' });
      return;
    }

    const department = db.departments.find((d) => d._id === doctor.doctorDetails?.departmentId);
    const deptName = department?.name || 'General';
    const deptCode = department?.code || 'GEN';

    // Authoritative consultation fee in INR (Never rely on client-sent amount!)
    const verifiedFee = Number(doctor.doctorDetails?.consultationFee) || 500;
    const isScheme = paymentMethod === 'assisted_scheme';
    const fee = isScheme ? 0 : verifiedFee;
    const paymentStatus: PaymentStatus = isScheme ? 'assisted_waived' : 'pending';

    // Concurrency / Duplicate check 1: Slot already occupied?
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
        message: `The selected time slot (${timeSlot}) with ${doctor.name} is already booked. Please choose another slot.`,
      });
      return;
    }

    // Concurrency / Duplicate check 2: Patient already has booking with same doctor on same day?
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

    const now = new Date().toISOString();
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
        ? `Consultation fee waived under ${financialAssistanceType || 'healthcare concession scheme'}. ID: ${financialAssistanceId}`
        : 'Consultation fee payable at the hospital counter during patient check-in.',
      createdAt: now,
      updatedAt: now,
    };

    newAppointment.paymentId = newPayment._id;

    db.appointments.push(newAppointment);
    db.payments.push(newPayment);
    db.rebuildQueueForDoctorDate(doctorId, appointmentDate);

    // Audit and notifications
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

    db.createNotification(
      user._id,
      'Appointment Confirmed',
      isScheme
        ? `Your appointment with ${doctor.name} is confirmed under ${financialAssistanceType || 'healthcare assistance'}. Token: ${tokenDisplay}.`
        : `Your appointment with ${doctor.name} is confirmed for ${appointmentDate} (${timeSlot}). Token: ${tokenDisplay}. Please pay ₹${fee} consultation fee at the hospital desk.`,
      'success',
      newAppointment._id
    );

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
  } catch (error: any) {
    console.error('[Create Payment / Booking Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating appointment.',
    });
  }
};

// 3. Mark Payment Status (Admin Only)
export const markPaymentAsPaidAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Admin authorization required.' });
      return;
    }

    const { id } = req.params;
    const { status = 'paid', notes } = req.body;

    const payment = db.getPaymentById(id);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    const now = new Date().toISOString();
    payment.status = status;
    payment.updatedAt = now;
    if (status === 'paid') {
      payment.paidAt = now;
      payment.markedPaidBy = user.name;
      payment.notes = notes || `Payment collected at hospital desk by ${user.name}`;
    }

    // Also update appointment if linked
    if (payment.appointmentId) {
      const apt = db.appointments.find((a) => a._id === payment.appointmentId);
      if (apt) {
        apt.paymentStatus = status;
        apt.updatedAt = now;
        if (status === 'paid') {
          apt.paidAt = now;
          apt.markedPaidBy = user.name;
        }
      }
    }

    db.logAudit(
      user._id,
      user.name,
      user.role,
      'PAYMENT_MARKED_PAID',
      'Appointment',
      payment.appointmentId || payment._id,
      `Marked payment ${payment.paymentNumber} as '${status}' for ${payment.patientName}. Amount: ₹${payment.amount}.`,
      req.ip || '127.0.0.1'
    );

    // Notify patient
    db.createNotification(
      payment.patientId,
      'Payment Status Updated',
      status === 'paid'
        ? `Your consultation payment of ₹${payment.amount} has been marked as Paid at the hospital desk.`
        : `Your payment status has been updated to '${status}'.`,
      status === 'paid' ? 'success' : 'info',
      payment.appointmentId
    );

    res.json({
      success: true,
      message: `Payment status updated to '${status}' successfully.`,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error updating payment status.' });
  }
};

// 4. Patient Payment History
export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const myPayments = db.getPaymentsByPatientId(user._id);

    res.json({
      success: true,
      totalCount: myPayments.length,
      payments: myPayments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching payments.' });
  }
};

// 5. Admin All Payments & Analytics
export const getAllPaymentsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access forbidden. Admin role required.' });
      return;
    }

    const { status, search, page = '1', limit = '15' } = req.query;

    const filtered = db.getAllPayments({
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    // Calculate Financial KPIs
    const allRecords = db.payments;
    const totalRevenue = allRecords
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const paidCount = allRecords.filter((p) => p.status === 'paid').length;
    const pendingCount = allRecords.filter((p) => p.status === 'pending').length;
    const assistedCount = allRecords.filter((p) => p.status === 'assisted_waived').length;
    const cancelledCount = allRecords.filter((p) => p.status === 'cancelled').length;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 15);
    const totalCount = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      kpis: {
        totalRevenue,
        paidCount,
        pendingCount,
        assistedCount,
        cancelledCount,
        totalTransactions: allRecords.length,
      },
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      payments: paginated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error fetching admin payments.' });
  }
};

// 6. Get Official Payment Receipt / Hospital Slip
export const getPaymentReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const payment = db.getPaymentById(id);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    // Authorization: User must be admin or the owner patient
    if (user.role !== 'admin' && payment.patientId !== user._id) {
      res.status(403).json({ success: false, message: 'Forbidden. You cannot view another patient’s receipt.' });
      return;
    }

    const appointment = payment.appointmentId
      ? db.appointments.find((a) => a._id === payment.appointmentId)
      : undefined;

    const doctor = db.users.find((u) => u._id === payment.doctorId);

    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber || `RCP-${payment._id.slice(-6)}`,
        transactionId: payment.paymentNumber,
        orderId: 'N/A',
        paymentDate: payment.paidAt || payment.createdAt,
        status: payment.status,
        amount: payment.amount,
        currency: 'INR',
        method: payment.method === 'assisted_scheme' ? 'Assisted Waiver' : 'Pay at Hospital',
        markedPaidBy: payment.markedPaidBy,
        financialAssistanceType: payment.financialAssistanceType,
        financialAssistanceId: payment.financialAssistanceId,
        patient: {
          name: payment.patientName,
          email: payment.patientEmail,
          phone: payment.patientPhone,
        },
        doctor: {
          name: payment.doctorName,
          specialty: doctor?.doctorDetails?.specialty || 'Specialist Physician',
          department: payment.departmentName,
          roomNumber: doctor?.doctorDetails?.roomNumber || 'General OPD',
        },
        appointment: appointment
          ? {
              appointmentNumber: appointment.appointmentNumber,
              tokenDisplay: appointment.tokenDisplay,
              appointmentDate: appointment.appointmentDate,
              timeSlot: appointment.timeSlot,
              reason: appointment.reason,
            }
          : undefined,
        hospital: {
          name: 'QueueCare Multi-Speciality Medical Center',
          address: '42 Healthway Boulevard, Medical Enclave, New Delhi - 110029',
          contact: '+91 (11) 4099-2800 / billing@queuecare.health',
          gstin: '07AAAAQ0000A1Z5',
          exemptionNotice: 'Healthcare clinical consultations are exempt under GST regulations. Fee collected at hospital desk.',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving receipt.' });
  }
};
