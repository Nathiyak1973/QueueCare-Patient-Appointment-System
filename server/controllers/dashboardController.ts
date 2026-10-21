import { Response } from 'express';
import { db, getTodayDateString } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getPatientDashboard = (req: AuthRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const today = getTodayDateString();
  const allUserApts = db.appointments
    .filter((a) => a.patientId === user._id)
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  const todayApt = allUserApts.find(
    (a) => a.appointmentDate === today && !['Completed', 'Cancelled', 'No-show'].includes(a.status)
  );

  let activeTokenInfo = null;
  if (todayApt) {
    const doctor = db.users.find((u) => u._id === todayApt.doctorId);
    const avgMinutes = doctor?.doctorDetails?.avgConsultationMinutes || 15;
    const sameDocApts = db.appointments
      .filter((a) => a.doctorId === todayApt.doctorId && a.appointmentDate === today)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    const current = sameDocApts.find((a) => a.status === 'In Consultation');
    const waitingApts = sameDocApts.filter((a) => a.status === 'Waiting' || a.status === 'Confirmed');
    const myWaitIndex = waitingApts.findIndex((a) => a._id === todayApt._id);

    const peopleAhead = todayApt.status === 'In Consultation' ? 0 : current ? myWaitIndex + 1 : Math.max(0, myWaitIndex);
    const estWait = peopleAhead * avgMinutes;

    activeTokenInfo = {
      appointmentId: todayApt._id,
      tokenDisplay: todayApt.tokenDisplay,
      tokenNumber: todayApt.tokenNumber,
      status: todayApt.status,
      doctorName: todayApt.doctorName,
      departmentName: todayApt.departmentName,
      roomNumber: doctor?.doctorDetails?.roomNumber || 'Room 101',
      timeSlot: todayApt.timeSlot,
      peopleAhead,
      estimatedWaitMinutes: estWait,
      nowServingToken: current ? current.tokenDisplay : 'None',
      paymentStatus: todayApt.paymentStatus || 'pending',
      consultationFee: todayApt.consultationFee,
    };
  }

  const upcomingApts = allUserApts.filter(
    (a) => a.appointmentDate >= today && !['Completed', 'Cancelled'].includes(a.status)
  );
  const completedApts = allUserApts.filter((a) => a.status === 'Completed');
  const recentNotifications = db.notifications
    .filter((n) => n.userId === user._id)
    .slice(0, 5);

  res.json({
    success: true,
    stats: {
      totalBookings: allUserApts.length,
      upcomingCount: upcomingApts.length,
      completedCount: completedApts.length,
    },
    activeToken: activeTokenInfo,
    upcomingAppointments: upcomingApts.slice(0, 5),
    recentAppointments: allUserApts.slice(0, 5),
    recentNotifications,
  });
};

export const getDoctorDashboard = (req: AuthRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const today = getTodayDateString();
  const todayApts = db.appointments
    .filter((a) => a.doctorId === user._id && a.appointmentDate === today)
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const currentServing = todayApts.find((a) => a.status === 'In Consultation') || null;
  const waitingApts = todayApts.filter((a) => a.status === 'Waiting' || a.status === 'Confirmed');
  const completedApts = todayApts.filter((a) => a.status === 'Completed');
  const noShowApts = todayApts.filter((a) => a.status === 'No-show');

  const avgMinutes = user.doctorDetails?.avgConsultationMinutes || 15;
  const estimatedRemainingMinutes = waitingApts.length * avgMinutes;

  res.json({
    success: true,
    date: today,
    stats: {
      totalToday: todayApts.length,
      waitingCount: waitingApts.length,
      completedCount: completedApts.length,
      noShowCount: noShowApts.length,
      estimatedRemainingMinutes,
    },
    currentServing,
    nextPatient: waitingApts[0] || null,
    todayAppointments: todayApts,
  });
};

export const getAdminDashboard = (_req: AuthRequest, res: Response): void => {
  const today = getTodayDateString();

  const totalPatients = db.users.filter((u) => u.role === 'patient').length;
  const totalDoctors = db.users.filter((u) => u.role === 'doctor' && u.isActive).length;
  const totalDepartments = db.departments.filter((d) => d.isActive).length;

  const todayApts = db.appointments.filter((a) => a.appointmentDate === today);
  const totalAppointmentsAllTime = db.appointments.length;

  const todayCompleted = todayApts.filter((a) => a.status === 'Completed').length;
  const todayInConsultation = todayApts.filter((a) => a.status === 'In Consultation').length;
  const todayWaiting = todayApts.filter((a) => a.status === 'Waiting' || a.status === 'Confirmed').length;
  const todayCancelled = todayApts.filter((a) => a.status === 'Cancelled').length;
  const todayNoShow = todayApts.filter((a) => a.status === 'No-show').length;

  // Department analytics
  const departmentBreakdown = db.departments.map((dept) => {
    const count = db.appointments.filter((a) => a.departmentId === dept._id).length;
    const todayCount = todayApts.filter((a) => a.departmentId === dept._id).length;
    return {
      departmentId: dept._id,
      name: dept.name,
      code: dept.code,
      totalAppointments: count,
      todayAppointments: todayCount,
    };
  });

  // Hourly volume simulation based on appointment time slots
  const hoursMap: Record<string, number> = {
    '09:00': 0,
    '10:00': 0,
    '11:00': 0,
    '12:00': 0,
    '14:00': 0,
    '15:00': 0,
    '16:00': 0,
  };

  db.appointments.forEach((apt) => {
    const hourPrefix = apt.timeSlot.substring(0, 2) + ':00';
    if (hoursMap[hourPrefix] !== undefined) {
      hoursMap[hourPrefix]++;
    }
  });

  const hourlyTrends = Object.entries(hoursMap).map(([hour, count]) => ({
    hour,
    appointments: count,
  }));

  const statusDistribution = [
    { name: 'Completed', value: todayCompleted, color: '#10b981' },
    { name: 'In Consultation', value: todayInConsultation, color: '#3b82f6' },
    { name: 'Waiting', value: todayWaiting, color: '#f59e0b' },
    { name: 'Cancelled', value: todayCancelled, color: '#ef4444' },
    { name: 'No-show', value: todayNoShow, color: '#6b7280' },
  ];

  const recentAudits = db.auditLogs.slice(0, 8);

  res.json({
    success: true,
    stats: {
      totalPatients,
      totalDoctors,
      totalDepartments,
      totalAppointmentsAllTime,
      todayTotal: todayApts.length,
      todayCompleted,
      todayInConsultation,
      todayWaiting,
      todayCancelled,
      todayNoShow,
      completionRate: todayApts.length > 0 ? Math.round((todayCompleted / todayApts.length) * 100) : 0,
    },
    departmentBreakdown,
    hourlyTrends,
    statusDistribution,
    recentAudits,
  });
};
