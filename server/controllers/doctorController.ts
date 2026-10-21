import { Request, Response } from 'express';
import { db } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { sanitizeUser } from './authController.ts';

// Standard working hours slots generator
export const generateTimeSlots = (
  startHour = 9,
  endHour = 17,
  durationMinutes = 15,
  breakStart = 13,
  breakEnd = 14
) => {
  const slots: string[] = [];
  let currentMinutes = startHour * 60;
  const finishMinutes = endHour * 60;
  const breakStartMin = breakStart * 60;
  const breakEndMin = breakEnd * 60;

  while (currentMinutes + durationMinutes <= finishMinutes) {
    // Skip lunch break
    if (currentMinutes >= breakStartMin && currentMinutes < breakEndMin) {
      currentMinutes = breakEndMin;
      continue;
    }

    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endTotal = currentMinutes + durationMinutes;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const slotString = `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;
    slots.push(slotString);

    currentMinutes += durationMinutes;
  }

  return slots;
};

export const listDoctors = (req: Request, res: Response): void => {
  const { departmentId, search } = req.query;

  let doctors = db.users.filter((u) => u.role === 'doctor' && u.isActive);

  if (departmentId) {
    doctors = doctors.filter((d) => d.doctorDetails?.departmentId === departmentId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.doctorDetails?.specialty.toLowerCase().includes(q)
    );
  }

  const enriched = doctors.map((doc) => {
    const dept = db.departments.find((d) => d._id === doc.doctorDetails?.departmentId);
    return {
      ...sanitizeUser(doc),
      department: dept || null,
    };
  });

  res.json({
    success: true,
    count: enriched.length,
    doctors: enriched,
  });
};

export const getDoctorById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const doc = db.users.find((u) => u._id === id && u.role === 'doctor');

  if (!doc) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  const dept = db.departments.find((d) => d._id === doc.doctorDetails?.departmentId);

  res.json({
    success: true,
    doctor: {
      ...sanitizeUser(doc),
      department: dept || null,
    },
  });
};

export const getDoctorSlots = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD).' });
    return;
  }

  const doctor = db.users.find((u) => u._id === id && u.role === 'doctor');
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  const duration = doctor.doctorDetails?.avgConsultationMinutes || 15;
  const allSlots = generateTimeSlots(9, 17, duration, 13, 14);

  // Find booked appointments for this doctor on that date (excluding Cancelled/No-show)
  const bookedApts = db.appointments.filter(
    (a) =>
      a.doctorId === id &&
      a.appointmentDate === date &&
      !['Cancelled', 'No-show'].includes(a.status)
  );

  const bookedSlotStrings = new Set(bookedApts.map((a) => a.timeSlot));

  const slotsWithStatus = allSlots.map((slot) => {
    const isBooked = bookedSlotStrings.has(slot);
    return {
      slot,
      isAvailable: !isBooked,
    };
  });

  res.json({
    success: true,
    date,
    doctorId: id,
    doctorName: doctor.name,
    slotDurationMinutes: duration,
    totalSlots: slotsWithStatus.length,
    availableSlotsCount: slotsWithStatus.filter((s) => s.isAvailable).length,
    slots: slotsWithStatus,
  });
};

export const updateDoctorProfile = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { specialty, roomNumber, avgConsultationMinutes, consultationFee, bio, phone } = req.body;

  // Only the doctor themselves or an admin can update
  if (req.user?.role !== 'admin' && req.user?._id !== id) {
    res.status(403).json({ success: false, message: 'Forbidden. You cannot update another doctor profile.' });
    return;
  }

  const doctor = db.users.find((u) => u._id === id && u.role === 'doctor');
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  if (phone) doctor.phone = phone;
  if (doctor.doctorDetails) {
    if (specialty) doctor.doctorDetails.specialty = specialty;
    if (roomNumber) doctor.doctorDetails.roomNumber = roomNumber;
    if (avgConsultationMinutes) doctor.doctorDetails.avgConsultationMinutes = Number(avgConsultationMinutes);
    if (consultationFee) doctor.doctorDetails.consultationFee = Number(consultationFee);
    if (bio !== undefined) doctor.doctorDetails.bio = bio;
  }

  doctor.updatedAt = new Date().toISOString();

  // Rebuild today's queue if avg duration changed
  const today = new Date().toISOString().split('T')[0];
  db.rebuildQueueForDoctorDate(doctor._id, today);

  db.logAudit(
    req.user._id,
    req.user.name,
    req.user.role,
    'DOCTOR_PROFILE_UPDATED',
    'Doctor',
    doctor._id,
    `Doctor ${doctor.name} schedule/profile updated`,
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Doctor profile updated successfully.',
    doctor: sanitizeUser(doctor),
  });
};
