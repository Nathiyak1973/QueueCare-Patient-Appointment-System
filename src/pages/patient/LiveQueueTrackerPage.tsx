import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Activity,
  BellRing,
  Clock,
  DoorOpen,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Volume2,
  ShieldCheck,
} from 'lucide-react';

export const LiveQueueTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { lastUpdated } = useQueue();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [queueData, setQueueData] = useState<any | null>(null);
  const [myTokenInfo, setMyTokenInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  // Load patient's today appointment or doctors list
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [aptRes, docRes] = await Promise.all([
          api.get('/appointments?date=' + todayStr),
          api.get('/doctors'),
        ]);

        if (docRes.data.success) {
          setDoctors(docRes.data.doctors || []);
        }

        if (aptRes.data.success && aptRes.data.appointments?.length > 0) {
          const userTodayApt = aptRes.data.appointments[0];
          setSelectedDoctorId(userTodayApt.doctorId);
        } else if (docRes.data.doctors?.length > 0) {
          setSelectedDoctorId(docRes.data.doctors[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Fetch live queue for selected doctor
  useEffect(() => {
    if (!selectedDoctorId) return;

    const fetchQueue = async () => {
      try {
        const res = await api.get(`/queue/live?doctorId=${selectedDoctorId}&date=${todayStr}`);
        if (res.data.success) {
          setQueueData(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchQueue();
  }, [selectedDoctorId, lastUpdated]);

  // Check if patient has a token in this queue
  useEffect(() => {
    if (!queueData || !user) return;

    // Check if patient is current serving
    if (queueData.currentServing && queueData.currentServing.patientName.includes(user.name)) {
      setMyTokenInfo({
        isServing: true,
        tokenDisplay: queueData.currentServing.tokenDisplay,
        status: 'In Consultation',
        peopleAhead: 0,
        estimatedWait: 0,
        paymentStatus: queueData.currentServing.paymentStatus,
        consultationFee: queueData.currentServing.consultationFee,
      });
      return;
    }

    // Check if in waiting queue
    const match = queueData.waitingQueue.find((q: any) => q.patientName.includes(user.name));
    if (match) {
      setMyTokenInfo({
        isServing: false,
        tokenDisplay: match.tokenDisplay,
        status: match.status,
        peopleAhead: match.peopleAhead,
        estimatedWait: match.estimatedWaitMinutes,
        paymentStatus: match.paymentStatus,
        consultationFee: match.consultationFee,
      });
    } else {
      setMyTokenInfo(null);
    }
  }, [queueData, user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Live Real-Time Hospital Feed
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">OPD Live Queue Board</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation tracking synchronized with the attending physician's desk.
            </p>
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 shrink-0">Clinic Suite:</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.doctorDetails?.specialty || d.department?.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Big Queue Status Cards */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Connecting to clinical queue stream...</p>
          </div>
        ) : !queueData ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No active queue data found for this clinic suite today.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Display: Current Serving vs Your Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NOW SERVING CARD */}
              <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-blue-800/50 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Currently In Consultation
                  </span>
                  <span className="text-xs text-slate-400">
                    Room: <strong>{queueData.doctor?.roomNumber}</strong>
                  </span>
                </div>

                {queueData.currentServing ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold">Active Token</p>
                    <p className="text-6xl font-black text-emerald-400 my-2 tracking-tight">
                      {queueData.currentServing.tokenDisplay}
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      Patient: {queueData.currentServing.patientName}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-400/30">
                      Inside Consultation Suite
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DoorOpen className="w-12 h-12 text-blue-300/40 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-200">Physician is Ready</p>
                    <p className="text-xs text-slate-400 mt-1">Waiting to call the next patient in queue.</p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Attending: <strong>{queueData.doctor?.name}</strong></span>
                  <span>{queueData.doctor?.specialty}</span>
                </div>
              </div>

              {/* YOUR QUEUE STATUS CARD */}
              <div
                className={`rounded-3xl p-6 shadow-md border-2 transition ${
                  myTokenInfo?.isServing
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 animate-pulse'
                    : myTokenInfo
                    ? 'bg-blue-50/70 border-blue-400 text-blue-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Your Queue Status
                  </span>
                  {myTokenInfo && <StatusBadge status={myTokenInfo.status} size="sm" />}
                </div>

                {myTokenInfo ? (
                  <div className="text-center py-3 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Your Assigned Token</span>
                      <p className="text-5xl font-black text-blue-900 my-1">{myTokenInfo.tokenDisplay}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Ahead of You</span>
                        <p className="text-2xl font-black text-amber-600 mt-0.5">
                          {myTokenInfo.peopleAhead}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Wait</span>
                        <p className="text-2xl font-black text-indigo-600 mt-0.5">
                          ~{myTokenInfo.estimatedWait}m
                        </p>
                      </div>
                    </div>

                    {/* Consultation Payment Status */}
                    <div className="pt-1 flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Payment:</span>
                      {myTokenInfo.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid (₹{myTokenInfo.consultationFee || 500})</span>
                        </span>
                      ) : myTokenInfo.paymentStatus === 'assisted_waived' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                          <span>Assisted Waiver (₹0)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending at Hospital (₹{myTokenInfo.consultationFee || 500})</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 italic max-w-sm mx-auto">
                      {myTokenInfo.isServing
                        ? 'Your token is now called! Please step inside the doctor suite.'
                        : 'Please stay in the patient waiting lobby. Your device will chime when called.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Active Token in This Suite</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      You do not have a booking with this doctor today, or you are observing the public hospital board.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* UPCOMING QUEUE LIST */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Patients Waiting in OPD Line ({queueData.waitingCount})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Order is prioritized chronologically by confirmed booking tokens.
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <span>Completed Today: <strong className="text-emerald-600">{queueData.completedCount}</strong></span>
                </div>
              </div>

              {queueData.waitingQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No other patients currently waiting in this clinic queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {queueData.waitingQueue.map((item: any) => {
                    const isCurrentUser = user && item.patientName.includes(user.name);
                    return (
                      <div
                        key={item._id}
                        className={`p-4 flex items-center justify-between transition ${
                          isCurrentUser ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                            #{item.position}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{item.tokenDisplay}</span>
                              {isCurrentUser && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                              <StatusBadge status={item.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.patientName} &bull; Scheduled: {item.timeSlot}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-indigo-700 block">
                            ~{item.estimatedWaitMinutes} mins
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.peopleAhead} ahead
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note notice */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Algorithmic Queue Notice:</strong> {queueData.notice}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
