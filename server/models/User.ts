import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'admin';
  phone: string;
  avatar?: string;
  isActive: boolean;
  patientDetails?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: string;
    address?: string;
    emergencyContact?: string;
  };
  doctorDetails?: {
    specialty: string;
    departmentId: mongoose.Types.ObjectId | string;
    qualification: string;
    experienceYears: number;
    roomNumber: string;
    avgConsultationMinutes: number;
    consultationFee: number;
    bio: string;
    registrationNumber?: string;
    hospitalName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', required: true },
    phone: { type: String, required: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    patientDetails: {
      age: Number,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      bloodGroup: String,
      address: String,
      emergencyContact: String,
    },
    doctorDetails: {
      specialty: String,
      departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
      qualification: String,
      experienceYears: Number,
      roomNumber: String,
      avgConsultationMinutes: { type: Number, default: 15 },
      consultationFee: { type: Number, default: 100 },
      bio: String,
      registrationNumber: String,
      hospitalName: String,
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
