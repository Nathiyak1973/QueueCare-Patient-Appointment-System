export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
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

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  headOfDepartment?: string;
  isActive: boolean;
  createdAt: string;
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

export interface Appointment {
  _id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string;
  timeSlot: string;
  tokenNumber: number;
  tokenDisplay: string;
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

export interface Payment {
  _id: string;
  paymentNumber: string;
  appointmentId?: string;
  appointmentNumber?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  amount: number;
  currency: string;
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

export interface LiveQueueData {
  success: boolean;
  date: string;
  doctor: {
    _id: string;
    name: string;
    specialty: string;
    roomNumber: string;
    avgConsultationMinutes: number;
    departmentName: string;
  };
  currentServing: {
    _id: string;
    tokenNumber: number;
    tokenDisplay: string;
    patientName: string;
    timeSlot: string;
    status: AppointmentStatus;
    consultationStartTime?: string;
    reason: string;
  } | null;
  nextUp: {
    _id: string;
    tokenNumber: number;
    tokenDisplay: string;
    patientName: string;
    timeSlot: string;
    position: number;
    peopleAhead: number;
    estimatedWaitMinutes: number;
  } | null;
  waitingCount: number;
  waitingQueue: Array<{
    _id: string;
    tokenNumber: number;
    tokenDisplay: string;
    patientName: string;
    timeSlot: string;
    status: AppointmentStatus;
    position: number;
    peopleAhead: number;
    estimatedWaitMinutes: number;
    reason: string;
  }>;
  completedCount: number;
  noShowCount: number;
  totalBookingsToday: number;
  notice: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  relatedAppointmentId?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
