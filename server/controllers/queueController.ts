import { Request, Response } from 'express';
import { db, getTodayDateString } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { getIO } from '../services/socketService.ts';

export const getLiveQueue = (req: Request, res: Response): void => {
  const { doctorId, date = getTodayDateString() } = req.query;

  if (!doctorId || typeof doctorId !== 'string') {
    res.status(400).json({ success: false, message: 'doctorId query parameter is required.' });
    return;
  }

  const queryDate = typeof date === 'string' ? date : getTodayDateString();
  const doctor = db.users.find((u) => u._id === doctorId && u.role === 'doctor');
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  // Ensure queue is built
  db.rebuildQueueForDoctorDate(doctorId, queryDate);

  const dept = db.departments.find((d) => d._id === doctor.doctorDetails?.departmentId);
  const avgMinutes = doctor.doctorDetails?.avgConsultationMinutes || 15;

  const allAptsForDay = db.appointments
    .filter((a) => a.doctorId === doctorId && a.appointmentDate === queryDate)
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const currentServing = allAptsForDay.find((a) => a.status === 'In Consultation') || null;
  const waitingApts = allAptsForDay.filter((a) => a.status === 'Waiting' || a.status === 'Confirmed');
  const completedApts = allAptsForDay.filter((a) => a.status === 'Completed');
  const noShowApts = allAptsForDay.filter((a) => a.status === 'No-show');

  // Enrich waiting list with calculated position and estimated wait
  const waitingQueue = waitingApts.map((apt, index) => {
    const peopleAhead = currentServing ? index + 1 : index;
    const estWait = peopleAhead * avgMinutes;
    return {
      _id: apt._id,
      tokenNumber: apt.tokenNumber,
      tokenDisplay: apt.tokenDisplay,
      patientName: apt.patientName,
      timeSlot: apt.timeSlot,
      status: apt.status,
      position: index + 1,
      peopleAhead,
      estimatedWaitMinutes: estWait,
      reason: apt.reason,
      paymentStatus: apt.paymentStatus || 'pending',
      consultationFee: apt.consultationFee,
    };
  });

  const nextUp = waitingQueue[0] || null;

  res.json({
    success: true,
    date: queryDate,
    doctor: {
      _id: doctor._id,
      name: doctor.name,
      specialty: doctor.doctorDetails?.specialty,
      roomNumber: doctor.doctorDetails?.roomNumber,
      avgConsultationMinutes: avgMinutes,
      departmentName: dept?.name || 'Medical Department',
    },
    currentServing: currentServing
      ? {
          _id: currentServing._id,
          tokenNumber: currentServing.tokenNumber,
          tokenDisplay: currentServing.tokenDisplay,
          patientName: currentServing.patientName,
          timeSlot: currentServing.timeSlot,
          status: currentServing.status,
          consultationStartTime: currentServing.consultationStartTime,
          reason: currentServing.reason,
          paymentStatus: currentServing.paymentStatus || 'pending',
          consultationFee: currentServing.consultationFee,
        }
      : null,
    nextUp,
    waitingCount: waitingQueue.length,
    waitingQueue,
    completedCount: completedApts.length,
    noShowCount: noShowApts.length,
    totalBookingsToday: allAptsForDay.length,
    notice: 'Estimated waiting times are calculated dynamically based on average consultation durations and patients ahead in queue.',
  });
};

export const getMyTokenStatus = (req: AuthRequest, res: Response): void => {
  const { appointmentId } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const apt = db.appointments.find((a) => a._id === appointmentId);
  if (!apt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  if (user.role === 'patient' && apt.patientId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden. Cannot view token of another patient.' });
    return;
  }

  const doctor = db.users.find((u) => u._id === apt.doctorId);
  const avgMinutes = doctor?.doctorDetails?.avgConsultationMinutes || 15;

  db.rebuildQueueForDoctorDate(apt.doctorId, apt.appointmentDate);

  const allDoctorApts = db.appointments
    .filter((a) => a.doctorId === apt.doctorId && a.appointmentDate === apt.appointmentDate)
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const currentServing = allDoctorApts.find((a) => a.status === 'In Consultation');

  let position = 0;
  let peopleAhead = 0;
  let estimatedWaitMinutes = 0;

  if (apt.status === 'In Consultation') {
    position = 0;
    peopleAhead = 0;
    estimatedWaitMinutes = 0;
  } else if (apt.status === 'Waiting' || apt.status === 'Confirmed') {
    const activeWaiting = allDoctorApts.filter(
      (a) => (a.status === 'Waiting' || a.status === 'Confirmed') && a.tokenNumber <= apt.tokenNumber
    );
    position = activeWaiting.length;
    peopleAhead = currentServing ? position : Math.max(0, position - 1);
    estimatedWaitMinutes = peopleAhead * avgMinutes;
  }

  res.json({
    success: true,
    token: {
      appointmentId: apt._id,
      tokenNumber: apt.tokenNumber,
      tokenDisplay: apt.tokenDisplay,
      status: apt.status,
      appointmentDate: apt.appointmentDate,
      timeSlot: apt.timeSlot,
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      departmentName: apt.departmentName,
      roomNumber: doctor?.doctorDetails?.roomNumber || 'General OPD',
      position,
      peopleAhead,
      estimatedWaitMinutes,
      isCurrentlyServing: apt.status === 'In Consultation',
      currentServingToken: currentServing?.tokenDisplay || 'None',
      paymentStatus: apt.paymentStatus || 'pending',
      consultationFee: apt.consultationFee,
    },
  });
};

export const callNextPatient = (req: AuthRequest, res: Response): void => {
  const { doctorId } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  // Doctor can only call for themselves; admin can call on behalf
  const targetDocId = doctorId || user._id;
  if (user.role === 'doctor' && targetDocId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden. Cannot call queue for another doctor.' });
    return;
  }

  const today = getTodayDateString();
  const doctor = db.users.find((u) => u._id === targetDocId && u.role === 'doctor');
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  // Complete any currently serving patient if doctor clicks next
  const currentServing = db.appointments.find(
    (a) => a.doctorId === targetDocId && a.appointmentDate === today && a.status === 'In Consultation'
  );
  if (currentServing) {
    currentServing.status = 'Completed';
    currentServing.consultationEndTime = new Date().toISOString();
    currentServing.updatedAt = new Date().toISOString();
  }

  // Find next eligible patient waiting
  const nextPatient = db.appointments
    .filter(
      (a) =>
        a.doctorId === targetDocId &&
        a.appointmentDate === today &&
        (a.status === 'Waiting' || a.status === 'Confirmed')
    )
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  if (!nextPatient) {
    db.rebuildQueueForDoctorDate(targetDocId, today);
    res.json({
      success: true,
      message: 'No more waiting patients in queue for today.',
      calledPatient: null,
    });
    return;
  }

  const now = new Date().toISOString();
  nextPatient.status = 'In Consultation';
  nextPatient.consultationStartTime = now;
  nextPatient.updatedAt = now;

  // Rebuild queue
  db.rebuildQueueForDoctorDate(targetDocId, today);

  // Notify patient
  db.createNotification(
    nextPatient.patientId,
    `NOW SERVING: Token ${nextPatient.tokenDisplay}`,
    `Please proceed immediately to ${doctor.doctorDetails?.roomNumber || 'Consultation Room'}. Dr. ${doctor.name} is ready for you.`,
    'alert',
    nextPatient._id
  );

  // Log audit
  db.logAudit(
    user._id,
    user.name,
    user.role,
    'QUEUE_CALL_NEXT',
    'Queue',
    nextPatient._id,
    `Doctor ${doctor.name} called Token ${nextPatient.tokenDisplay} (${nextPatient.patientName})`,
    req.ip || '127.0.0.1'
  );

  // Real-time broadcast
  const io = getIO();
  if (io) {
    io.emit('patient_called', {
      doctorId: targetDocId,
      appointmentId: nextPatient._id,
      tokenDisplay: nextPatient.tokenDisplay,
      patientName: nextPatient.patientName,
      roomNumber: doctor.doctorDetails?.roomNumber || 'Suite 101',
      doctorName: doctor.name,
    });
    io.emit('queue_updated', { doctorId: targetDocId, date: today });
  }

  res.json({
    success: true,
    message: `Called Token ${nextPatient.tokenDisplay} (${nextPatient.patientName}).`,
    calledPatient: nextPatient,
  });
};

export const completeConsultation = (req: AuthRequest, res: Response): void => {
  const { appointmentId } = req.params;
  const { doctorNotes, prescription } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const apt = db.appointments.find((a) => a._id === appointmentId);
  if (!apt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  if (user.role === 'doctor' && apt.doctorId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden. You are not the assigned doctor.' });
    return;
  }

  const now = new Date().toISOString();
  apt.status = 'Completed';
  apt.consultationEndTime = now;
  if (doctorNotes) apt.doctorNotes = doctorNotes;
  if (prescription) apt.prescription = prescription;
  apt.updatedAt = now;

  db.rebuildQueueForDoctorDate(apt.doctorId, apt.appointmentDate);

  // Patient notification
  db.createNotification(
    apt.patientId,
    'Consultation Completed',
    `Your consultation with ${apt.doctorName} is complete. Your summary and prescription are now available in your records.`,
    'success',
    apt._id
  );

  db.logAudit(
    user._id,
    user.name,
    user.role,
    'CONSULTATION_COMPLETED',
    'Appointment',
    apt._id,
    `Completed consultation for Token ${apt.tokenDisplay} (${apt.patientName})`,
    req.ip || '127.0.0.1'
  );

  const io = getIO();
  if (io) {
    io.emit('queue_updated', { doctorId: apt.doctorId, date: apt.appointmentDate });
  }

  res.json({
    success: true,
    message: 'Consultation marked as completed.',
    appointment: apt,
  });
};

export const markNoShow = (req: AuthRequest, res: Response): void => {
  const { appointmentId } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const apt = db.appointments.find((a) => a._id === appointmentId);
  if (!apt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  if (user.role === 'doctor' && apt.doctorId !== user._id) {
    res.status(403).json({ success: false, message: 'Forbidden. You are not the assigned doctor.' });
    return;
  }

  apt.status = 'No-show';
  apt.updatedAt = new Date().toISOString();

  db.rebuildQueueForDoctorDate(apt.doctorId, apt.appointmentDate);

  db.createNotification(
    apt.patientId,
    'Appointment Marked No-show',
    `You were marked absent for appointment ${apt.tokenDisplay}. Please contact reception if you need to reschedule.`,
    'warning',
    apt._id
  );

  db.logAudit(
    user._id,
    user.name,
    user.role,
    'PATIENT_NO_SHOW',
    'Queue',
    apt._id,
    `Patient ${apt.patientName} (Token: ${apt.tokenDisplay}) marked as absent/no-show`,
    req.ip || '127.0.0.1'
  );

  const io = getIO();
  if (io) {
    io.emit('queue_updated', { doctorId: apt.doctorId, date: apt.appointmentDate });
  }

  res.json({
    success: true,
    message: 'Patient marked as absent/no-show.',
    appointment: apt,
  });
};

export const getHospitalQueueSummary = (_req: Request, res: Response): void => {
  const today = getTodayDateString();
  const doctors = db.users.filter((u) => u.role === 'doctor' && u.isActive);

  const summaries = doctors.map((doc) => {
    const dept = db.departments.find((d) => d._id === doc.doctorDetails?.departmentId);
    const docApts = db.appointments.filter(
      (a) => a.doctorId === doc._id && a.appointmentDate === today
    );

    const current = docApts.find((a) => a.status === 'In Consultation');
    const waiting = docApts.filter((a) => a.status === 'Waiting' || a.status === 'Confirmed');
    const completed = docApts.filter((a) => a.status === 'Completed');

    return {
      doctorId: doc._id,
      doctorName: doc.name,
      specialty: doc.doctorDetails?.specialty || '',
      roomNumber: doc.doctorDetails?.roomNumber || 'Room 101',
      departmentId: dept?._id,
      departmentName: dept?.name || 'General',
      currentServingToken: current ? current.tokenDisplay : 'None',
      currentServingPatient: current ? current.patientName : 'None',
      waitingCount: waiting.length,
      completedCount: completed.length,
      avgConsultationMinutes: doc.doctorDetails?.avgConsultationMinutes || 15,
      nextUpToken: waiting[0]?.tokenDisplay || 'None',
    };
  });

  res.json({
    success: true,
    date: today,
    totalDoctorsActive: doctors.length,
    departments: db.departments.filter((d) => d.isActive),
    queues: summaries,
  });
};
