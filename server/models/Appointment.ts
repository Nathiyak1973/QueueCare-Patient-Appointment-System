import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointmentDocument extends Document {
  appointmentNumber: string;
  patientId: mongoose.Types.ObjectId | string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: mongoose.Types.ObjectId | string;
  doctorName: string;
  departmentId: mongoose.Types.ObjectId | string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 - 09:45"
  tokenNumber: number;
  tokenDisplay: string;
  status: 'Pending' | 'Confirmed' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No-show';
  reason: string;
  doctorNotes?: string;
  prescription?: string;
  checkInTime?: Date;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  cancellationReason?: string;
  consultationFee?: number;
  paymentStatus?: 'pending' | 'paid' | 'cancelled' | 'assisted_waived';
  paymentId?: string;
  paymentMethod?: 'pay_at_hospital' | 'assisted_scheme' | 'cash_counter';
  paidAt?: Date;
  markedPaidBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    appointmentNumber: { type: String, required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientEmail: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    departmentName: { type: String, required: true },
    appointmentDate: { type: String, required: true }, // Format: YYYY-MM-DD
    timeSlot: { type: String, required: true },
    tokenNumber: { type: Number, required: true },
    tokenDisplay: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Waiting', 'In Consultation', 'Completed', 'Cancelled', 'No-show'],
      default: 'Confirmed',
    },
    reason: { type: String, required: true },
    doctorNotes: { type: String },
    prescription: { type: String },
    checkInTime: { type: Date },
    consultationStartTime: { type: Date },
    consultationEndTime: { type: Date },
    cancellationReason: { type: String },
    consultationFee: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'assisted_waived'],
      default: 'pending',
    },
    paymentId: { type: String },
    paymentMethod: {
      type: String,
      enum: ['pay_at_hospital', 'assisted_scheme', 'cash_counter'],
      default: 'pay_at_hospital',
    },
    paidAt: { type: Date },
    markedPaidBy: { type: String },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness: A doctor cannot have two active appointments at the same date and slot!
AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['Cancelled', 'No-show'] } },
  }
);
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, tokenNumber: 1 });

export const AppointmentModel =
  mongoose.models.Appointment || mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);
