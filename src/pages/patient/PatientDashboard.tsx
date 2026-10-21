import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useQueue } from '../../context/QueueContext.tsx';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import {
  CalendarCheck,
  Clock,
  Activity,
  CalendarPlus,
  DoorOpen,
  ArrowRight,
  Bell,
  User,
  HeartPulse,
  AlertCircle,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lastUpdated } = useQueue();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/patient');
        if (res.data.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [lastUpdated]);

  const activeToken = dashboardData?.activeToken;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/10 text-blue-200 text-xs font-semibold rounded-full border border-white/10">
              Patient Health Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">Welcome back, {user?.name}!</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Track your appointments, view live consultation queue positions, and manage personal medical records.
            </p>
          </div>

          <Link
            to="/patient/book"
            className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 text-sm shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>

        {/* ACTIVE LIVE QUEUE TOKEN HIGHLIGHT (If user has appointment today) */}
        {activeToken ? (
          <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-md p-6 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Today's Live Queue Token
                    </span>
                    <StatusBadge status={activeToken.status} size="sm" />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        activeToken.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : activeToken.paymentStatus === 'assisted_waived'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      Payment:{' '}
                      {activeToken.paymentStatus === 'paid'
                        ? 'Paid'
                        : activeToken.paymentStatus === 'assisted_waived'
                        ? 'Assisted Waiver'
                        : 'Pending at Hospital'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {activeToken.doctorName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeToken.departmentName} &bull; Room: {activeToken.roomNumber}
                  </p>
                </div>
              </div>

              <Link
                to="/patient/live-queue"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Open Live Queue Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Your Token</span>
                <p className="text-3xl font-black text-blue-900 mt-1">{activeToken.tokenDisplay}</p>
                <span className="text-[10px] text-slate-500">{activeToken.timeSlot}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Now Serving</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">{activeToken.nowServingToken}</p>
                <span className="text-[10px] text-slate-500">In Doctor's Suite</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Ahead of You</span>
                <p className="text-3xl font-black text-amber-600 mt-1">
                  {activeToken.peopleAhead} <span className="text-sm font-semibold">patient{activeToken.peopleAhead === 1 ? '' : 's'}</span>
                </p>
                <span className="text-[10px] text-slate-500">Waiting in line</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Est. Wait Time</span>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  ~{activeToken.estimatedWaitMinutes} <span className="text-sm font-semibold">min</span>
                </p>
                <span className="text-[10px] text-slate-500">Dynamic algorithmic calculation</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 text-center sm:text-left flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Please ensure you are near Suite {activeToken.roomNumber}. Your device will chime when called.
              </span>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">No active consultation queue today</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You do not have any pending appointments for today's OPD session.
                </p>
              </div>
            </div>
            <Link
              to="/patient/book"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-xs"
            >
              Book an Appointment
            </Link>
          </div>
        )}

        {/* Quick KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Total Bookings"
            value={dashboardData?.stats?.totalBookings ?? 0}
            icon={CalendarCheck}
            color="blue"
            subtitle="All-time consultations"
          />
          <StatCard
            title="Upcoming Visits"
            value={dashboardData?.stats?.upcomingCount ?? 0}
            icon={Clock}
            color="amber"
            subtitle="Scheduled specialists"
          />
          <StatCard
            title="Completed Visits"
            value={dashboardData?.stats?.completedCount ?? 0}
            icon={HeartPulse}
            color="emerald"
            subtitle="Past medical records"
          />
        </div>

        {/* Upcoming Appointments Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Upcoming &amp; Active Appointments</span>
            </h3>
            <Link
              to="/patient/appointments"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading appointments...</div>
          ) : !dashboardData?.upcomingAppointments?.length ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No upcoming appointments. Click 'Book New Appointment' to schedule a consultation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Token</th>
                    <th className="px-5 py-3.5">Doctor &amp; Department</th>
                    <th className="px-5 py-3.5">Date &amp; Slot</th>
                    <th className="px-5 py-3.5">Queue Status</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboardData.upcomingAppointments.map((apt: any) => (
                    <tr key={apt._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                          {apt.tokenDisplay}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{apt.doctorName}</p>
                        <p className="text-[11px] text-slate-500">{apt.departmentName}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{apt.appointmentDate}</p>
                        <p className="text-[11px] text-slate-500">{apt.timeSlot}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={apt.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        {apt.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            Paid (₹{apt.consultationFee})
                          </span>
                        ) : apt.paymentStatus === 'assisted_waived' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                            Assisted (₹0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            Pending ₹{apt.consultationFee || 500}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/patient/appointments"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
