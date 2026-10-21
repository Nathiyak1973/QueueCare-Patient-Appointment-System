import bcrypt from 'bcryptjs';
import {
  IUser,
  IDepartment,
  IAppointment,
  IQueueEntry,
  INotification,
  IAuditLog,
  AppointmentStatus,
  IPayment,
  PaymentStatus,
  PaymentMethod,
} from '../types.ts';

// Helper to generate IDs
export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

class InMemoryDatabase {
  users: IUser[] = [];
  departments: IDepartment[] = [];
  appointments: IAppointment[] = [];
  queueEntries: IQueueEntry[] = [];
  notifications: INotification[] = [];
  auditLogs: IAuditLog[] = [];
  payments: IPayment[] = [];
  private initialized = false;

  constructor() {
    this.seedInitialData();
  }

  public async seedInitialData() {
    if (this.initialized) return;
    this.initialized = true;

    const salt = bcrypt.genSaltSync(10);
    const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@hospital.com';
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const passwordHashAdmin = envAdminPassword
      ? bcrypt.hashSync(envAdminPassword, salt)
      : bcrypt.hashSync('admin123', salt);
    const passwordHashDoctor = bcrypt.hashSync('doctor123', salt);
    const passwordHashPatient = bcrypt.hashSync('patient123', salt);

    const now = new Date().toISOString();
    const today = getTodayDateString();

    // 1. Departments
    const depCardio: IDepartment = {
      _id: 'dept_cardio_01',
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive heart and cardiovascular care, ECG, echocardiography, and vascular disease treatment.',
      icon: 'HeartPulse',
      headOfDepartment: 'Dr. Robert Vance',
      isActive: true,
      createdAt: now,
    };

    const depNeuro: IDepartment = {
      _id: 'dept_neuro_02',
      name: 'Neurology',
      code: 'NEUR',
      description: 'Specialized diagnosis and treatment of brain, spinal cord, nerve, and muscular disorders.',
      icon: 'Brain',
      headOfDepartment: 'Dr. Elena Rostova',
      isActive: true,
      createdAt: now,
    };

    const depPed: IDepartment = {
      _id: 'dept_ped_03',
      name: 'Pediatrics',
      code: 'PEDI',
      description: 'Compassionate medical care for infants, children, and adolescents, including immunizations and growth tracking.',
      icon: 'Baby',
      headOfDepartment: 'Dr. Marcus Chen',
      isActive: true,
      createdAt: now,
    };

    const depOrtho: IDepartment = {
      _id: 'dept_ortho_04',
      name: 'Orthopedics',
      code: 'ORTH',
      description: 'Treatment of bones, joints, ligaments, sports injuries, spine health, and arthroscopic procedures.',
      icon: 'Bone',
      headOfDepartment: 'Dr. Priya Sharma',
      isActive: true,
      createdAt: now,
    };

    const depGenMed: IDepartment = {
      _id: 'dept_genmed_05',
      name: 'General Medicine',
      code: 'GMED',
      description: 'Primary healthcare, preventive medicine, chronic disease management, and general wellness consultations.',
      icon: 'Stethoscope',
      headOfDepartment: 'Dr. David Kim',
      isActive: true,
      createdAt: now,
    };

    const depDerma: IDepartment = {
      _id: 'dept_derma_06',
      name: 'Dermatology',
      code: 'DERM',
      description: 'Skin health, clinical dermatology, allergy testing, and cosmetic care.',
      icon: 'Activity',
      headOfDepartment: 'Dr. Sarah Al-Mansoor',
      isActive: true,
      createdAt: now,
    };

    this.departments = [depCardio, depNeuro, depPed, depOrtho, depGenMed, depDerma];

    // 2. Users
    // Admin
    const adminUser: IUser = {
      _id: 'user_admin_01',
      name: process.env.ADMIN_NAME?.trim() || 'Chief Admin Evans',
      email: envAdminEmail,
      password: passwordHashAdmin,
      role: 'admin',
      phone: '+1 (555) 019-2831',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Doctors
    const doctorCardio: IUser = {
      _id: 'user_doc_01',
      name: 'Dr. Robert Vance, MD',
      email: 'doctor@hospital.com',
      password: passwordHashDoctor,
      role: 'doctor',
      phone: '+1 (555) 012-4433',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: 'Interventional Cardiology',
        departmentId: depCardio._id,
        qualification: 'MD, FACC, Harvard Medical School',
        experienceYears: 14,
        roomNumber: 'Suite 302',
        avgConsultationMinutes: 15,
        consultationFee: 600,
        bio: 'Senior cardiologist focusing on preventative cardiology, coronary artery disease, and hypertension control.',
      },
    };

    const doctorNeuro: IUser = {
      _id: 'user_doc_02',
      name: 'Dr. Elena Rostova, PhD',
      email: 'elena@hospital.com',
      password: passwordHashDoctor,
      role: 'doctor',
      phone: '+1 (555) 012-4434',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: 'Clinical Neurology',
        departmentId: depNeuro._id,
        qualification: 'MD, PhD, Johns Hopkins Medicine',
        experienceYears: 11,
        roomNumber: 'Suite 405',
        avgConsultationMinutes: 20,
        consultationFee: 800,
        bio: 'Expert in migraine management, neuropathy, memory disorders, and electroencephalography.',
      },
    };

    const doctorPed: IUser = {
      _id: 'user_doc_03',
      name: 'Dr. Marcus Chen, FAAP',
      email: 'marcus@hospital.com',
      password: passwordHashDoctor,
      role: 'doctor',
      phone: '+1 (555) 012-4435',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: 'General Pediatrics',
        departmentId: depPed._id,
        qualification: 'MD, Stanford University',
        experienceYears: 9,
        roomNumber: 'Room 112',
        avgConsultationMinutes: 15,
        consultationFee: 500,
        bio: 'Dedicated pediatrician with special focus on early childhood development, asthma, and childhood immunizations.',
      },
    };

    const doctorOrtho: IUser = {
      _id: 'user_doc_04',
      name: 'Dr. Priya Sharma, MS',
      email: 'priya@hospital.com',
      password: passwordHashDoctor,
      role: 'doctor',
      phone: '+1 (555) 012-4436',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: 'Orthopedic & Joint Surgery',
        departmentId: depOrtho._id,
        qualification: 'MS Ortho, Mayo Clinic Fellow',
        experienceYears: 16,
        roomNumber: 'Suite 208',
        avgConsultationMinutes: 20,
        consultationFee: 700,
        bio: 'Specialist in joint reconstruction, sports injury rehabilitation, and minimally invasive knee surgery.',
      },
    };

    const doctorGenMed: IUser = {
      _id: 'user_doc_05',
      name: 'Dr. David Kim, MD',
      email: 'david@hospital.com',
      password: passwordHashDoctor,
      role: 'doctor',
      phone: '+1 (555) 012-4437',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      doctorDetails: {
        specialty: 'Internal Medicine',
        departmentId: depGenMed._id,
        qualification: 'MD, Columbia University',
        experienceYears: 8,
        roomNumber: 'Suite 104',
        avgConsultationMinutes: 15,
        consultationFee: 400,
        bio: 'Comprehensive wellness exams, metabolic syndrome, diabetic care, and preventive family health.',
      },
    };

    // Patients
    const patientSarah: IUser = {
      _id: 'user_pat_01',
      name: 'Sarah Jenkins',
      email: 'patient@hospital.com',
      password: passwordHashPatient,
      role: 'patient',
      phone: '+1 (555) 392-8172',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      patientDetails: {
        age: 34,
        gender: 'female',
        bloodGroup: 'O+',
        address: '742 Evergreen Terrace, Springfield',
        emergencyContact: 'Mark Jenkins (+1 555-392-8199)',
      },
    };

    const patientMichael: IUser = {
      _id: 'user_pat_02',
      name: 'Michael Brown',
      email: 'michael@hospital.com',
      password: passwordHashPatient,
      role: 'patient',
      phone: '+1 (555) 837-1290',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      patientDetails: {
        age: 48,
        gender: 'male',
        bloodGroup: 'A+',
        address: '124 Elm Street, Springfield',
        emergencyContact: 'Lisa Brown (+1 555-837-1299)',
      },
    };

    const patientEmily: IUser = {
      _id: 'user_pat_03',
      name: 'Emily Davis',
      email: 'emily@hospital.com',
      password: passwordHashPatient,
      role: 'patient',
      phone: '+1 (555) 234-9081',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      patientDetails: {
        age: 26,
        gender: 'female',
        bloodGroup: 'B+',
        address: '58 Oak Avenue, Springfield',
        emergencyContact: 'John Davis (+1 555-234-9000)',
      },
    };

    this.users = [
      adminUser,
      doctorCardio,
      doctorNeuro,
      doctorPed,
      doctorOrtho,
      doctorGenMed,
      patientSarah,
      patientMichael,
      patientEmily,
    ];

    // 3. Appointments & Queue for Today
    // Patient 1 (Michael) - Completed
    const apt1: IAppointment = {
      _id: 'apt_seed_01',
      appointmentNumber: `APT-${today.replace(/-/g, '')}-001`,
      patientId: patientMichael._id,
      patientName: patientMichael.name,
      patientPhone: patientMichael.phone,
      patientEmail: patientMichael.email,
      doctorId: doctorCardio._id,
      doctorName: doctorCardio.name,
      departmentId: depCardio._id,
      departmentName: depCardio.name,
      appointmentDate: today,
      timeSlot: '09:00 - 09:15',
      tokenNumber: 1,
      tokenDisplay: 'CARD-001',
      status: 'Completed',
      reason: 'Routine ECG review and mild chest tightness during morning walks.',
      doctorNotes: 'ECG normal sinus rhythm. Advised hydration, mild exercise, follow-up in 3 months.',
      prescription: 'Aspirin 81mg daily, multivitamins.',
      checkInTime: `${today}T08:50:00Z`,
      consultationStartTime: `${today}T09:02:00Z`,
      consultationEndTime: `${today}T09:16:00Z`,
      consultationFee: 600,
      paymentStatus: 'paid',
      paymentId: 'pay_seed_01',
      paymentMethod: 'pay_at_hospital',
      paidAt: `${today}T08:52:00Z`,
      markedPaidBy: 'Chief Admin Evans',
      createdAt: now,
      updatedAt: now,
    };

    // Patient 2 (Emily) - Currently In Consultation (Payment Pending at Hospital)
    const apt2: IAppointment = {
      _id: 'apt_seed_02',
      appointmentNumber: `APT-${today.replace(/-/g, '')}-002`,
      patientId: patientEmily._id,
      patientName: patientEmily.name,
      patientPhone: patientEmily.phone,
      patientEmail: patientEmily.email,
      doctorId: doctorCardio._id,
      doctorName: doctorCardio.name,
      departmentId: depCardio._id,
      departmentName: depCardio.name,
      appointmentDate: today,
      timeSlot: '09:15 - 09:30',
      tokenNumber: 2,
      tokenDisplay: 'CARD-002',
      status: 'In Consultation',
      reason: 'Palpitations following caffeine intake and high stress at work.',
      checkInTime: `${today}T09:10:00Z`,
      consultationStartTime: `${today}T09:20:00Z`,
      consultationFee: 600,
      paymentStatus: 'pending',
      paymentId: 'pay_seed_02',
      paymentMethod: 'pay_at_hospital',
      createdAt: now,
      updatedAt: now,
    };

    // Patient 3 (Sarah) - Waiting in Queue (Token CARD-003, Payment Pending)
    const apt3: IAppointment = {
      _id: 'apt_seed_03',
      appointmentNumber: `APT-${today.replace(/-/g, '')}-003`,
      patientId: patientSarah._id,
      patientName: patientSarah.name,
      patientPhone: patientSarah.phone,
      patientEmail: patientSarah.email,
      doctorId: doctorCardio._id,
      doctorName: doctorCardio.name,
      departmentId: depCardio._id,
      departmentName: depCardio.name,
      appointmentDate: today,
      timeSlot: '09:30 - 09:45',
      tokenNumber: 3,
      tokenDisplay: 'CARD-003',
      status: 'Waiting',
      reason: 'High blood pressure readings recorded at home pharmacy kiosk (145/92).',
      checkInTime: `${today}T09:25:00Z`,
      consultationFee: 600,
      paymentStatus: 'pending',
      paymentId: 'pay_seed_03',
      paymentMethod: 'pay_at_hospital',
      createdAt: now,
      updatedAt: now,
    };

    // Another appointment for today in General Medicine for Sarah
    const apt4: IAppointment = {
      _id: 'apt_seed_04',
      appointmentNumber: `APT-${today.replace(/-/g, '')}-004`,
      patientId: patientSarah._id,
      patientName: patientSarah.name,
      patientPhone: patientSarah.phone,
      patientEmail: patientSarah.email,
      doctorId: doctorGenMed._id,
      doctorName: doctorGenMed.name,
      departmentId: depGenMed._id,
      departmentName: depGenMed.name,
      appointmentDate: today,
      timeSlot: '11:00 - 11:15',
      tokenNumber: 1,
      tokenDisplay: 'GMED-001',
      status: 'Confirmed',
      reason: 'Annual blood panel review and general health checkup.',
      consultationFee: 400,
      paymentStatus: 'assisted_waived',
      paymentId: 'pay_seed_04',
      paymentMethod: 'assisted_scheme',
      createdAt: now,
      updatedAt: now,
    };

    this.appointments = [apt1, apt2, apt3, apt4];

    // Seed Payments
    this.payments = [
      {
        _id: 'pay_seed_01',
        paymentNumber: 'PAY-20261019-001',
        appointmentId: apt1._id,
        appointmentNumber: apt1.appointmentNumber,
        patientId: patientMichael._id,
        patientName: patientMichael.name,
        patientEmail: patientMichael.email,
        patientPhone: patientMichael.phone,
        doctorId: doctorCardio._id,
        doctorName: doctorCardio.name,
        departmentName: depCardio.name,
        amount: 600,
        currency: 'INR',
        status: 'paid',
        method: 'pay_at_hospital',
        receiptNumber: 'RCP-20261019-001',
        paidAt: `${today}T08:52:00Z`,
        markedPaidBy: 'Chief Admin Evans',
        notes: 'Paid at hospital billing counter during check-in.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'pay_seed_02',
        paymentNumber: 'PAY-20261019-002',
        appointmentId: apt2._id,
        appointmentNumber: apt2.appointmentNumber,
        patientId: patientEmily._id,
        patientName: patientEmily.name,
        patientEmail: patientEmily.email,
        patientPhone: patientEmily.phone,
        doctorId: doctorCardio._id,
        doctorName: doctorCardio.name,
        departmentName: depCardio.name,
        amount: 600,
        currency: 'INR',
        status: 'pending',
        method: 'pay_at_hospital',
        receiptNumber: 'RCP-20261019-002',
        notes: 'Consultation fee payable at hospital billing counter.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'pay_seed_03',
        paymentNumber: 'PAY-20261019-003',
        appointmentId: apt3._id,
        appointmentNumber: apt3.appointmentNumber,
        patientId: patientSarah._id,
        patientName: patientSarah.name,
        patientEmail: patientSarah.email,
        patientPhone: patientSarah.phone,
        doctorId: doctorCardio._id,
        doctorName: doctorCardio.name,
        departmentName: depCardio.name,
        amount: 600,
        currency: 'INR',
        status: 'pending',
        method: 'pay_at_hospital',
        receiptNumber: 'RCP-20261019-003',
        notes: 'Consultation fee payable at hospital billing counter.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'pay_seed_04',
        paymentNumber: 'PAY-20261019-004',
        appointmentId: apt4._id,
        appointmentNumber: apt4.appointmentNumber,
        patientId: patientSarah._id,
        patientName: patientSarah.name,
        patientEmail: patientSarah.email,
        patientPhone: patientSarah.phone,
        doctorId: doctorGenMed._id,
        doctorName: doctorGenMed.name,
        departmentName: depGenMed.name,
        amount: 400,
        currency: 'INR',
        status: 'assisted_waived',
        method: 'assisted_scheme',
        financialAssistanceType: 'Ayushman Bharat (PM-JAY)',
        financialAssistanceId: 'PMJAY-DEL-894210',
        receiptNumber: 'RCP-ASST-20261019-004',
        notes: 'Fee waived under Ayushman Bharat (PM-JAY). Card verified.',
        paidAt: apt4.createdAt,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'pay_seed_05',
        paymentNumber: 'PAY-20261019-005',
        patientId: patientSarah._id,
        patientName: patientSarah.name,
        patientEmail: patientSarah.email,
        patientPhone: patientSarah.phone,
        doctorId: doctorPed._id,
        doctorName: doctorPed.name,
        departmentName: depPed.name,
        amount: 500,
        currency: 'INR',
        status: 'cancelled',
        method: 'pay_at_hospital',
        failureReason: 'Booking cancelled by patient prior to visit',
        notes: 'Slot cancelled by patient.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // 4. Queue entries for today
    this.rebuildQueueForDoctorDate(doctorCardio._id, today);
    this.rebuildQueueForDoctorDate(doctorGenMed._id, today);

    // 5. Notifications
    this.notifications = [
      {
        _id: 'notif_01',
        userId: patientSarah._id,
        title: 'Appointment Confirmed & Token Generated',
        message: 'Your Cardiology appointment with Dr. Robert Vance is confirmed. Your Token: CARD-003.',
        type: 'success',
        read: false,
        relatedAppointmentId: apt3._id,
        createdAt: now,
      },
      {
        _id: 'notif_02',
        userId: patientSarah._id,
        title: 'Queue Position Update',
        message: 'Dr. Robert Vance is currently examining Token CARD-002. You are 1 patient away!',
        type: 'info',
        read: false,
        relatedAppointmentId: apt3._id,
        createdAt: now,
      },
      {
        _id: 'notif_03',
        userId: doctorCardio._id,
        title: 'Queue Ready for Morning Session',
        message: 'Today you have 3 scheduled patients in Cardiology Suite 302.',
        type: 'info',
        read: true,
        createdAt: now,
      },
    ];

    // 6. Audit Logs
    this.auditLogs = [
      {
        _id: 'audit_01',
        userId: adminUser._id,
        userName: adminUser.name,
        userRole: 'admin',
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'User',
        entityId: adminUser._id,
        details: 'Initial hospital departments and doctor roster provisioned with verified credentials.',
        ipAddress: '127.0.0.1',
        timestamp: now,
      },
      {
        _id: 'audit_02',
        userId: patientSarah._id,
        userName: patientSarah.name,
        userRole: 'patient',
        action: 'APPOINTMENT_BOOKED',
        entityType: 'Appointment',
        entityId: apt3._id,
        details: `Booked Cardiology slot with Dr. Robert Vance for ${today} 09:30. Assigned Token CARD-003.`,
        ipAddress: '127.0.0.1',
        timestamp: now,
      },
    ];
  }

  // --- REBUILD & CALCULATE QUEUE ---
  public rebuildQueueForDoctorDate(doctorId: string, date: string) {
    const doctor = this.users.find((u) => u._id === doctorId);
    const avgMinutes = doctor?.doctorDetails?.avgConsultationMinutes || 15;

    // Remove existing queue entries for this doctor & date
    this.queueEntries = this.queueEntries.filter(
      (q) => !(q.doctorId === doctorId && q.date === date)
    );

    // Get all active appointments for this doctor & date in chronological slot order
    const apts = this.appointments
      .filter((a) => a.doctorId === doctorId && a.appointmentDate === date)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    let waitingCount = 0;
    const nowServing = apts.find((a) => a.status === 'In Consultation');

    for (const apt of apts) {
      if (['Completed', 'Cancelled', 'No-show'].includes(apt.status)) {
        continue;
      }

      let position = 0;
      let estWait = 0;

      if (apt.status === 'In Consultation') {
        position = 0;
        estWait = 0;
      } else if (apt.status === 'Waiting' || apt.status === 'Confirmed' || apt.status === 'Pending') {
        waitingCount++;
        position = waitingCount;
        // Estimated wait: if someone is currently in consultation, count (patientsAhead * avgMinutes)
        const ahead = nowServing ? position : Math.max(0, position - 1);
        estWait = ahead * avgMinutes;
      }

      const qEntry: IQueueEntry = {
        _id: `q_${apt._id}`,
        appointmentId: apt._id,
        doctorId: apt.doctorId,
        departmentId: apt.departmentId,
        date: apt.appointmentDate,
        tokenNumber: apt.tokenNumber,
        tokenDisplay: apt.tokenDisplay,
        status: apt.status,
        position,
        patientName: apt.patientName,
        timeSlot: apt.timeSlot,
        estimatedWaitMinutes: estWait,
        calledAt: apt.consultationStartTime,
        completedAt: apt.consultationEndTime,
        updatedAt: new Date().toISOString(),
      };

      this.queueEntries.push(qEntry);
    }
  }

  // --- AUDIT LOG HELPER ---
  public logAudit(
    userId: string,
    userName: string,
    userRole: 'patient' | 'doctor' | 'admin',
    action: string,
    entityType: 'Appointment' | 'Queue' | 'Doctor' | 'Department' | 'User' | 'Auth',
    entityId: string,
    details: string,
    ipAddress = '127.0.0.1'
  ) {
    const entry: IAuditLog = {
      _id: generateId('audit'),
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    // Keep last 500 audit logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return entry;
  }

  // --- NOTIFICATION HELPER ---
  public createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' = 'info',
    relatedAppointmentId?: string
  ) {
    const notif: INotification = {
      _id: generateId('notif'),
      userId,
      title,
      message,
      type,
      read: false,
      relatedAppointmentId,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  // --- ADMIN CREDENTIALS UPDATE ---
  public updateAdminCredentials(email: string, hashedPassword: string, name?: string): IUser {
    const normalizedEmail = email.toLowerCase().trim();
    let admin = this.users.find((u) => u.role === 'admin' || u.email.toLowerCase() === normalizedEmail);
    if (admin) {
      admin.email = normalizedEmail;
      admin.password = hashedPassword;
      if (name) admin.name = name;
      admin.updatedAt = new Date().toISOString();
      return admin;
    } else {
      const now = new Date().toISOString();
      const newAdmin: IUser = {
        _id: generateId('user_admin'),
        name: name || 'Chief Admin Evans',
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+1 (555) 019-2831',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(newAdmin);
      return newAdmin;
    }
  }

  // --- PAYMENTS MANAGEMENT ---
  public getPaymentById(id: string): IPayment | undefined {
    return this.payments.find((p) => p._id === id || p.paymentNumber === id);
  }

  public getPaymentByOrderId(orderId: string): IPayment | undefined {
    return this.payments.find((p) => p._id === orderId || p.paymentNumber === orderId);
  }

  public getPaymentsByPatientId(patientId: string): IPayment[] {
    return this.payments
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllPayments(filter?: { status?: string; search?: string }): IPayment[] {
    let result = [...this.payments];
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((p) => p.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.patientName.toLowerCase().includes(q) ||
          p.doctorName.toLowerCase().includes(q) ||
          (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
          (p.appointmentNumber && p.appointmentNumber.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createPayment(payment: IPayment): IPayment {
    this.payments.unshift(payment);
    return payment;
  }

  public updatePayment(id: string, updates: Partial<IPayment>): IPayment | undefined {
    const payment = this.payments.find((p) => p._id === id || p.paymentNumber === id);
    if (!payment) return undefined;
    Object.assign(payment, updates, { updatedAt: new Date().toISOString() });
    return payment;
  }
}

export const db = new InMemoryDatabase();
