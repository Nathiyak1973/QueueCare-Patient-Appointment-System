import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { db, generateId } from '../services/dbStore.ts';
import { AuthRequest, JWT_SECRET } from '../middleware/auth.ts';
import { IUser } from '../types.ts';
import { UserModel } from '../models/User.ts';

// Helper to sanitize user object
export const sanitizeUser = (user: IUser) => {
  const { password, ...rest } = user;
  return rest;
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, age, gender, bloodGroup, address, emergencyContact } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400).json({ success: false, message: 'Please provide all required fields: name, email, password, and phone.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const newUser: IUser = {
      _id: generateId('user_pat'),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'patient',
      phone: phone.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      patientDetails: {
        age: age ? Number(age) : undefined,
        gender,
        bloodGroup,
        address,
        emergencyContact,
      },
    };

    db.users.push(newUser);

    // Audit log
    db.logAudit(
      newUser._id,
      newUser.name,
      newUser.role,
      'USER_REGISTERED',
      'User',
      newUser._id,
      `New patient registered: ${newUser.name} (${newUser.email})`,
      req.ip || '127.0.0.1'
    );

    // Welcome notification
    db.createNotification(
      newUser._id,
      'Welcome to CareQueue!',
      'Your patient account was successfully created. You can now book appointments with our specialists and track live queues.',
      'success'
    );

    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration.', error: (error as Error).message });
  }
};

export const registerDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      registrationNumber,
      specialty,
      qualification,
      experienceYears,
      hospitalName,
      email,
      phone,
      consultationFee,
      password,
      confirmPassword,
      departmentId,
      roomNumber,
    } = req.body;

    // Field presence validation
    if (
      !name ||
      !registrationNumber ||
      !specialty ||
      !qualification ||
      !hospitalName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: Full Name, Medical Registration Number, Specialization, Qualification, Hospital/Clinic Name, Email, Phone, Password, and Confirm Password.',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    // Password validation
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
      return;
    }

    // Medical registration number format validation
    const regNumTrimmed = registrationNumber.trim();
    if (regNumTrimmed.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Medical Registration Number must be at least 3 characters.',
      });
      return;
    }

    // Check duplicate email
    const existingEmail = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingEmail) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // Check duplicate medical registration number
    const existingReg = db.users.find(
      (u) =>
        u.role === 'doctor' &&
        u.doctorDetails?.registrationNumber?.toLowerCase() === regNumTrimmed.toLowerCase()
    );
    if (existingReg) {
      res.status(409).json({
        success: false,
        message: 'A doctor account with this Medical Registration Number already exists.',
      });
      return;
    }

    // Determine clinical department
    let targetDeptId = departmentId;
    if (!targetDeptId || !db.departments.some((d) => d._id === targetDeptId)) {
      const matchedDept = db.departments.find(
        (d) =>
          d.name.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(d.name.toLowerCase())
      );
      targetDeptId = matchedDept ? matchedDept._id : db.departments[0]?._id || 'dept_genmed_05';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    // Standardize title format
    const formattedName = name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;
    const expYears = Number(experienceYears) || 0;
    const fee = Number(consultationFee) >= 0 ? Number(consultationFee) : 100;
    const assignedRoom = roomNumber?.trim() || `Suite ${200 + (db.users.filter((u) => u.role === 'doctor').length + 1) * 3}`;

    const newDoctor: IUser = {
      _id: generateId('user_doc'),
      name: formattedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'doctor',
      phone: phone.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: specialty.trim(),
        departmentId: targetDeptId,
        qualification: qualification.trim(),
        experienceYears: expYears,
        roomNumber: assignedRoom,
        avgConsultationMinutes: 15,
        consultationFee: fee,
        bio: `${qualification.trim()} specialist at ${hospitalName.trim()} with ${expYears} years of clinical practice. Medical Registration: ${regNumTrimmed}.`,
        registrationNumber: regNumTrimmed,
        hospitalName: hospitalName.trim(),
      },
    };

    db.users.push(newDoctor);

    // If MongoDB connected, sync document
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        await UserModel.create({
          _id: newDoctor._id,
          name: newDoctor.name,
          email: newDoctor.email,
          password: newDoctor.password,
          role: 'doctor',
          phone: newDoctor.phone,
          isActive: true,
          doctorDetails: newDoctor.doctorDetails,
        });
      }
    } catch (dbErr) {
      console.warn('[registerDoctor] MongoDB sync notice:', (dbErr as Error).message);
    }

    // Log audit trail
    db.logAudit(
      newDoctor._id,
      newDoctor.name,
      'doctor',
      'DOCTOR_REGISTERED',
      'Doctor',
      newDoctor._id,
      `New doctor registered: ${newDoctor.name} (Reg No: ${regNumTrimmed}, Hospital: ${hospitalName.trim()})`,
      req.ip || '127.0.0.1'
    );

    // Welcome notification
    db.createNotification(
      newDoctor._id,
      'Welcome to CareQueue Physician Network!',
      `Dr. ${newDoctor.name}, your account has been registered with Medical Registration No. ${regNumTrimmed}. You can now manage your queue and consultation timings.`,
      'success'
    );

    const token = jwt.sign({ id: newDoctor._id, email: newDoctor.email, role: newDoctor.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registration completed successfully! You can now log in to access your physician dashboard.',
      token,
      user: sanitizeUser(newDoctor),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during doctor registration.',
      error: (error as Error).message,
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    // If MongoDB is connected, synchronize with latest database record
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const mongoUser = await UserModel.findOne({ email: normalizedEmail });
        if (mongoUser) {
          if (!user) {
            user = {
              _id: mongoUser._id.toString(),
              name: mongoUser.name,
              email: mongoUser.email,
              password: mongoUser.password,
              role: mongoUser.role,
              phone: mongoUser.phone,
              isActive: mongoUser.isActive,
              createdAt: mongoUser.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: mongoUser.updatedAt?.toISOString() || new Date().toISOString(),
              patientDetails: mongoUser.patientDetails,
              doctorDetails: mongoUser.doctorDetails as any,
            };
            db.users.push(user);
          } else {
            user.password = mongoUser.password;
            user.role = mongoUser.role;
            user.isActive = mongoUser.isActive;
            user.name = mongoUser.name;
          }
        }
      } catch (dbErr) {
        console.warn('[Login] MongoDB sync lookup notice:', (dbErr as Error).message);
      }
    }

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      return;
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    db.logAudit(
      user._id,
      user.name,
      user.role,
      'USER_LOGIN',
      'Auth',
      user._id,
      `User ${user.name} logged in successfully`,
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login.', error: (error as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const { name, email, phone, age, gender, bloodGroup, address, emergencyContact } = req.body;
  const user = db.users.find((u) => u._id === req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  // Handle email update and validation
  let emailUpdated = false;
  if (email !== undefined) {
    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (trimmedEmail !== user.email.toLowerCase()) {
      // Check whether another account already uses the requested email
      const emailConflict = db.users.some(
        (u) => u._id !== user._id && u.email.toLowerCase() === trimmedEmail
      );
      if (emailConflict) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please choose a different email.',
        });
        return;
      }

      const oldEmail = user.email;
      user.email = trimmedEmail;
      emailUpdated = true;

      // Update patient email in existing appointment records to preserve consistency
      db.appointments.forEach((apt) => {
        if (apt.patientId === user._id) {
          apt.patientEmail = trimmedEmail;
        }
      });

      // Audit log the email change
      db.logAudit(
        user._id,
        user.name,
        user.role,
        'USER_EMAIL_UPDATED',
        'User',
        user._id,
        `User changed email address from ${oldEmail} to ${trimmedEmail}`,
        req.ip || '127.0.0.1'
      );
    }
  }

  if (name && typeof name === 'string') user.name = name.trim();
  if (phone && typeof phone === 'string') user.phone = phone.trim();

  if (user.role === 'patient') {
    user.patientDetails = {
      ...user.patientDetails,
      ...(age !== undefined ? { age: Number(age) } : {}),
      ...(gender ? { gender } : {}),
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(address !== undefined ? { address: String(address).trim() } : {}),
      ...(emergencyContact !== undefined ? { emergencyContact: String(emergencyContact).trim() } : {}),
    };
  }

  user.updatedAt = new Date().toISOString();

  // If MongoDB Mongoose connection is active, update MongoDB document
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndUpdate(user._id, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        patientDetails: user.patientDetails,
        updatedAt: new Date(),
      });
    }
  } catch (dbErr) {
    console.warn('[updateProfile] Mongoose document sync notice:', (dbErr as Error).message);
  }

  // Issue updated JWT token with the new email
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({
    success: true,
    message: emailUpdated
      ? 'Profile and email address updated successfully.'
      : 'Profile updated successfully.',
    user: sanitizeUser(user),
    token,
  });
};
