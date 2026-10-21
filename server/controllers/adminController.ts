import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateId } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IUser, IDepartment } from '../types.ts';
import { sanitizeUser } from './authController.ts';

// --- DOCTOR MANAGEMENT ---
export const createDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialty,
      departmentId,
      qualification,
      experienceYears,
      roomNumber,
      avgConsultationMinutes = 15,
      consultationFee = 100,
      bio,
    } = req.body;

    if (!name || !email || !password || !phone || !departmentId || !specialty) {
      res.status(400).json({
        success: false,
        message: 'Name, email, password, phone, department, and specialty are required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const newDoctor: IUser = {
      _id: generateId('user_doc'),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'doctor',
      phone: phone.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty,
        departmentId,
        qualification: qualification || 'MD, General Medicine',
        experienceYears: Number(experienceYears) || 5,
        roomNumber: roomNumber || 'Consultation Suite',
        avgConsultationMinutes: Number(avgConsultationMinutes) || 15,
        consultationFee: Number(consultationFee) || 100,
        bio: bio || '',
      },
    };

    db.users.push(newDoctor);

    db.logAudit(
      req.user?._id || 'admin',
      req.user?.name || 'Admin',
      'admin',
      'DOCTOR_CREATED',
      'Doctor',
      newDoctor._id,
      `Admin created doctor account for ${newDoctor.name} (${newDoctor.email})`,
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully.',
      doctor: sanitizeUser(newDoctor),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create doctor.', error: (error as Error).message });
  }
};

export const toggleDoctorStatus = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const doc = db.users.find((u) => u._id === id && u.role === 'doctor');
  if (!doc) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  doc.isActive = !doc.isActive;
  doc.updatedAt = new Date().toISOString();

  db.logAudit(
    req.user?._id || 'admin',
    req.user?.name || 'Admin',
    'admin',
    'DOCTOR_STATUS_TOGGLED',
    'Doctor',
    doc._id,
    `Admin ${doc.isActive ? 'activated' : 'deactivated'} doctor ${doc.name}`,
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `Doctor status updated to ${doc.isActive ? 'Active' : 'Inactive'}.`,
    doctor: sanitizeUser(doc),
  });
};

// --- PATIENT MANAGEMENT ---
export const listPatients = (req: AuthRequest, res: Response): void => {
  const { search, page = '1', limit = '10' } = req.query;

  let patients = db.users.filter((u) => u.role === 'patient');

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const totalCount = patients.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = patients.slice(startIndex, startIndex + limitNum).map(sanitizeUser);

  // Attach total appointments count to each patient
  const enriched = paginated.map((p) => {
    const aptCount = db.appointments.filter((a) => a.patientId === p._id).length;
    return {
      ...p,
      appointmentsCount: aptCount,
    };
  });

  res.json({
    success: true,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
    patients: enriched,
  });
};

// --- DEPARTMENT MANAGEMENT ---
export const listDepartments = (_req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    departments: db.departments,
  });
};

export const createDepartment = (req: AuthRequest, res: Response): void => {
  const { name, code, description, icon, headOfDepartment } = req.body;
  if (!name || !code) {
    res.status(400).json({ success: false, message: 'Department name and code are required.' });
    return;
  }

  const upperCode = code.toUpperCase().trim();
  if (db.departments.some((d) => d.code === upperCode)) {
    res.status(409).json({ success: false, message: 'Department code already exists.' });
    return;
  }

  const newDept: IDepartment = {
    _id: generateId('dept'),
    name: name.trim(),
    code: upperCode,
    description: description || '',
    icon: icon || 'Activity',
    headOfDepartment: headOfDepartment || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.departments.push(newDept);

  db.logAudit(
    req.user?._id || 'admin',
    req.user?.name || 'Admin',
    'admin',
    'DEPARTMENT_CREATED',
    'Department',
    newDept._id,
    `Created department ${newDept.name} (${newDept.code})`,
    req.ip || '127.0.0.1'
  );

  res.status(201).json({
    success: true,
    message: 'Department created successfully.',
    department: newDept,
  });
};

// --- AUDIT LOGS ---
export const getAuditLogs = (req: AuthRequest, res: Response): void => {
  const { search, entityType, limit = '50' } = req.query;

  let logs = [...db.auditLogs];

  if (entityType && typeof entityType === 'string') {
    logs = logs.filter((l) => l.entityType.toLowerCase() === entityType.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }

  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
  res.json({
    success: true,
    totalLogs: logs.length,
    logs: logs.slice(0, limitNum),
  });
};
