export type UserRole = 'patient' | 'doctor' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patientDetails?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: string;
    address?: string;
    emergencyContact?: string;
  };
  doctorDetails?: {
    specialty: string;
    departmentId: string;
    qualification: string;
    experienceYears: number;
    roomNumber: string;
    avgConsultationMinutes: number;
    consultationFee: number;
    bio: string;
    registrationNumber?: string;
    hospitalName?: string;
  };
}

export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  headOfDepartment?: string;
  isActive: boolean;
  createdAt: string;
}

export interface IDoctorSchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number; // e.g. 15
  isAvailable: boolean;
  breakStart?: string; // "13:00"
  breakEnd?: string;   // "14:00"
}

export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Waiting'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'assisted_waived';

export type PaymentMethod =
  | 'pay_at_hospital'
  | 'assisted_scheme'
  | 'cash_counter';

export interface IAppointment {
  _id: string;
  appointmentNumber: string; // e.g. "APT-20261017-001"
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // "09:30 - 09:45"
  tokenNumber: number; // 1, 2, 3...
  tokenDisplay: string; // e.g. "CARD-001"
  status: AppointmentStatus;
  reason: string;
  doctorNotes?: string;
  prescription?: string;
  checkInTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  cancellationReason?: string;
  consultationFee?: number;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  markedPaidBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  paymentNumber: string; // e.g. "PAY-20261019-001"
  appointmentId?: string;
  appointmentNumber?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  amount: number; // In INR (e.g. 500)
  currency: string; // 'INR'
  status: PaymentStatus;
  method: PaymentMethod;
  receiptNumber?: string;
  financialAssistanceType?: string;
  financialAssistanceId?: string;
  failureReason?: string;
  notes?: string;
  paidAt?: string;
  markedPaidBy?: string;
  collectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IQueueEntry {
  _id: string;
  appointmentId: string;
  doctorId: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  tokenNumber: number;
  tokenDisplay: string;
  status: AppointmentStatus;
  position: number; // 1, 2, 3...
  patientName: string;
  timeSlot: string;
  estimatedWaitMinutes: number;
  calledAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  relatedAppointmentId?: string;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'Appointment' | 'Queue' | 'Doctor' | 'Department' | 'User' | 'Auth';
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
