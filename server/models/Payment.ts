import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDocument extends Document {
  paymentNumber: string;
  appointmentId?: mongoose.Types.ObjectId | string;
  appointmentNumber?: string;
  patientId: mongoose.Types.ObjectId | string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: mongoose.Types.ObjectId | string;
  doctorName: string;
  departmentName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'assisted_waived';
  method: 'pay_at_hospital' | 'assisted_scheme' | 'cash_counter';
  receiptNumber?: string;
  financialAssistanceType?: string;
  financialAssistanceId?: string;
  failureReason?: string;
  notes?: string;
  paidAt?: Date;
  markedPaidBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    paymentNumber: { type: String, required: true, unique: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    appointmentNumber: { type: String },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    departmentName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'assisted_waived'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['pay_at_hospital', 'assisted_scheme', 'cash_counter'],
      default: 'pay_at_hospital',
    },
    receiptNumber: { type: String, index: true },
    financialAssistanceType: { type: String },
    financialAssistanceId: { type: String },
    failureReason: { type: String },
    notes: { type: String },
    paidAt: { type: Date },
    markedPaidBy: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ patientId: 1, createdAt: -1 });
PaymentSchema.index({ doctorId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
