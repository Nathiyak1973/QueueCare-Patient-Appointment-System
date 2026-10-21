import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useQueue } from '../../context/QueueContext.tsx';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  BellRing,
  ArrowRight,
  Activity,
  DoorOpen,
  CalendarCheck,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lastUpdated, triggerQueueRefresh } = useQueue();

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [callNotice, setCallNotice] = useState<string>('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/doctor');
      if (res.data.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [lastUpdated]);

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      setCallNotice('');
      const res = await api.post('/queue/call-next', {});
      if (res.data.success) {
        setCallNotice(res.data.message);
        triggerQueueRefresh();
        fetchDashboard();
      }
    } catch (err: any) {
      setCallNotice(err.response?.data?.message || 'Failed to call patient.');
    } finally {
      setCallingNext(false);
    }
  };

  const stats = dashboard?.stats;
  const currentServing = dashboard?.currentServing;
  const nextPatient = dashboard?.nextPatient;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
              Physician Consultation Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">{user?.name}</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              {user?.doctorDetails?.specialty} &bull; Room: {user?.doctorDetails?.roomNumber} &bull;{' '}
              Avg Consult: {user?.doctorDetails?.avgConsultationMinutes}m
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/doctor/queue"
              className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 text-xs"
            >
              <Activity className="w-4 h-4" />
              <span>Open Calling Console</span>
            </Link>
          </div>
        </div>

        {callNotice && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <BellRing className="w-4 h-4 text-blue-600" />
            <span>{callNotice}</span>
          </div>
        )}

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Today's Patients"
            value={stats?.totalToday ?? 0}
            icon={Users}
            color="blue"
            subtitle="Booked consultations"
          />
          <StatCard
            title="Waiting in Line"
            value={stats?.waitingCount ?? 0}
            icon={Clock}
            color="amber"
            subtitle="Queue backlog"
          />
          <StatCard
            title="Completed"
            value={stats?.completedCount ?? 0}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Finished consultations"
          />
          <StatCard
            title="Est. Finish Time"
            value={`~${stats?.estimatedRemainingMinutes ?? 0}m`}
            icon={Activity}
            color="indigo"
            subtitle="Remaining clinic time"
          />
        </div>

        {/* ACTIVE CONSULTATION & NEXT IN LINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currently In Consultation */}
          <div className="bg-white rounded-3xl border-2 border-blue-500 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                  Currently In Suite
                </span>
                <span className="text-xs text-slate-500">Suite {user?.doctorDetails?.roomNumber}</span>
              </div>

              {currentServing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Active Token</span>
                      <p className="text-4xl font-black text-blue-950">{currentServing.tokenDisplay}</p>
                    </div>
                    <StatusBadge status={currentServing.status} size="lg" />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                    <p className="text-sm font-bold text-slate-900">{currentServing.patientName}</p>
                    <p className="text-slate-500">Slot: {currentServing.timeSlot}</p>
                    <p className="text-slate-600 pt-1 border-t border-slate-200/60 italic">
                      <strong>Complaint:</strong> {currentServing.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <DoorOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-600">No patient currently in consultation.</p>
                  <p className="text-[11px] mt-0.5">Click 'Call Next Patient' below to ring the waiting room.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
              <Link
                to="/doctor/queue"
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Console &amp; Prescription &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Next Up in Line */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Next Patient Waiting
                </span>
                <span className="text-xs text-slate-400">Position #1</span>
              </div>

              {nextPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Next Token</span>
                      <p className="text-4xl font-black text-amber-700">{nextPatient.tokenDisplay}</p>
                    </div>
                    <StatusBadge status={nextPatient.status} size="sm" />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                    <p className="text-sm font-bold text-slate-900">{nextPatient.patientName}</p>
                    <p className="text-slate-500">Slot: {nextPatient.timeSlot}</p>
                    <p className="text-slate-600 pt-1 border-t border-slate-200/60 italic">
                      <strong>Complaint:</strong> {nextPatient.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-600">No more patients waiting in queue today!</p>
                  <p className="text-[11px] mt-0.5">All scheduled sessions have been attended.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
              <button
                onClick={handleCallNext}
                disabled={callingNext || !nextPatient}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-40"
              >
                <BellRing className="w-4 h-4" />
                <span>{callingNext ? 'Calling...' : 'Call Next Patient Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Today's Full Schedule Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <span>Today's Complete Patient Queue Roster</span>
            </h3>
            <span className="text-xs text-slate-400">Total: {dashboard?.todayAppointments?.length || 0}</span>
          </div>

          {!dashboard?.todayAppointments?.length ? (
            <div className="p-8 text-center text-xs text-slate-400">No appointments scheduled for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Token</th>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-5 py-3.5">Slot Time</th>
                    <th className="px-5 py-3.5">Chief Complaint</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboard.todayAppointments.map((apt: any) => (
                    <tr
                      key={apt._id}
                      className={`hover:bg-slate-50/50 transition ${
                        apt.status === 'In Consultation' ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60">
                          {apt.tokenDisplay}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-400">{apt.patientPhone}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{apt.timeSlot}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{apt.reason}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={apt.status} size="sm" />
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
