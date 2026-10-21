import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueEntryDocument extends Document {
  appointmentId: mongoose.Types.ObjectId | string;
  doctorId: mongoose.Types.ObjectId | string;
  departmentId: mongoose.Types.ObjectId | string;
  date: string;
  tokenNumber: number;
  tokenDisplay: string;
  status: string;
  position: number;
  patientName: string;
  timeSlot: string;
  estimatedWaitMinutes: number;
  calledAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const QueueEntrySchema = new Schema<IQueueEntryDocument>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: String, required: true },
    tokenNumber: { type: Number, required: true },
    tokenDisplay: { type: String, required: true },
    status: { type: String, required: true },
    position: { type: Number, required: true },
    patientName: { type: String, required: true },
    timeSlot: { type: String, required: true },
    estimatedWaitMinutes: { type: Number, default: 0 },
    calledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

QueueEntrySchema.index({ doctorId: 1, date: 1, position: 1 });

export const QueueEntryModel =
  mongoose.models.QueueEntry || mongoose.model<IQueueEntryDocument>('QueueEntry', QueueEntrySchema);

// Notifications Schema
export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  relatedAppointmentId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'alert'], default: 'info' },
    read: { type: Boolean, default: false },
    relatedAppointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema);

// AuditLog Schema
export interface IAuditLogDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

AuditLogSchema.index({ timestamp: -1 });

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
