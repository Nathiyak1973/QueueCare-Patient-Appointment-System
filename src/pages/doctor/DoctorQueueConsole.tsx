import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Activity,
  BellRing,
  CheckCircle2,
  XCircle,
  Clock,
  DoorOpen,
  User,
  FileText,
  Pill,
  Users,
  AlertCircle,
  Loader2,
  Timer,
} from 'lucide-react';

export const DoctorQueueConsole: React.FC = () => {
  const { user } = useAuth();
  const { lastUpdated, triggerQueueRefresh } = useQueue();

  const [queueData, setQueueData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApt, setActiveApt] = useState<any | null>(null);

  // Clinical inputs for active consultation
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  // Consultation elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchLiveQueue = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/queue/live?doctorId=${user._id}&date=${todayStr}`);
      if (res.data.success) {
        setQueueData(res.data);
        if (res.data.currentServing) {
          setActiveApt(res.data.currentServing);
        } else {
          setActiveApt(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveQueue();
  }, [user, lastUpdated]);

  // Elapsed timer tick
  useEffect(() => {
    if (!activeApt) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeApt]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCallNext = async () => {
    try {
      setSubmitting(true);
      setNotice('');
      const res = await api.post('/queue/call-next', { doctorId: user?._id });
      if (res.data.success) {
        setNotice(res.data.message);
        setDoctorNotes('');
        setPrescription('');
        setElapsedSeconds(0);
        triggerQueueRefresh();
        fetchLiveQueue();
      }
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'Failed to call patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!activeApt) return;

    try {
      setSubmitting(true);
      setNotice('');
      const res = await api.post(`/queue/${activeApt._id}/complete`, {
        doctorNotes: doctorNotes.trim() || 'Consultation completed normally.',
        prescription: prescription.trim() || 'No specific medication prescribed.',
      });

      if (res.data.success) {
        setNotice(`Consultation for ${activeApt.tokenDisplay} completed successfully.`);
        setActiveApt(null);
        setDoctorNotes('');
        setPrescription('');
        setElapsedSeconds(0);
        triggerQueueRefresh();
        fetchLiveQueue();
      }
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'Failed to complete consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!activeApt) return;

    try {
      setSubmitting(true);
      setNotice('');
      const res = await api.post(`/queue/${activeApt._id}/no-show`, {});
      if (res.data.success) {
        setNotice(`Patient ${activeApt.patientName} (${activeApt.tokenDisplay}) marked as absent / no-show.`);
        setActiveApt(null);
        setDoctorNotes('');
        setPrescription('');
        triggerQueueRefresh();
        fetchLiveQueue();
      }
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'Failed to mark no-show.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Console Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Clinical OPD Calling Console
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-0.5">
                Suite {user?.doctorDetails?.roomNumber} &bull; {user?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {activeApt && (
              <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
                <Timer className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Elapsed: <strong className="font-mono text-emerald-400 text-sm">{formatTimer(elapsedSeconds)}</strong></span>
              </div>
            )}

            <button
              onClick={handleCallNext}
              disabled={submitting}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 disabled:opacity-40"
            >
              <BellRing className="w-4 h-4" />
              <span>Call Next in Line</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{notice}</span>
          </div>
        )}

        {/* Central Consultation Area & Side Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Consultation Desk (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border-2 border-blue-500 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  Active In-Suite Consultation
                </span>
                {activeApt && <StatusBadge status={activeApt.status} size="sm" />}
              </div>

              {activeApt ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50/70 p-4 rounded-2xl border border-blue-100 gap-3">
                    <div>
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                        Patient Token
                      </span>
                      <p className="text-4xl font-black text-blue-950 mt-0.5">{activeApt.tokenDisplay}</p>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{activeApt.patientName}</h3>
                    </div>

                    <div className="text-left sm:text-right text-xs text-slate-600 space-y-1">
                      <p>Scheduled Slot: <strong>{activeApt.timeSlot}</strong></p>
                      <p>Date: <strong>{todayStr}</strong></p>
                    </div>
                  </div>

                  {/* Complaint */}
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 text-xs text-amber-900">
                    <strong className="block font-bold mb-0.5">Chief Complaint / Symptoms:</strong>
                    <p className="text-slate-800">{activeApt.reason}</p>
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Physician Examination &amp; Clinical Notes</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter clinical examination observations, diagnosis, vitals, test results..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    ></textarea>
                  </div>

                  {/* Prescription */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Prescription, Medications &amp; Follow-up Advice</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Tab Metformin 500mg (1-0-1) after food x 30 days. Advised lipid panel in 2 weeks..."
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    ></textarea>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleMarkNoShow}
                      disabled={submitting}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Mark Absent / No-Show</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteConsultation}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save &amp; Complete Consultation</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No Patient in Room</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                    Click 'Call Next Patient in Line' to invite the next ticket into Suite {user?.doctorDetails?.roomNumber}.
                  </p>
                  <button
                    onClick={handleCallNext}
                    disabled={submitting || (queueData?.waitingQueue?.length || 0) === 0}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md inline-flex items-center gap-2 disabled:opacity-40"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>Call Next Patient</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Side Waiting Queue List (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Waiting Line ({queueData?.waitingCount || 0})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Order by Token</span>
              </div>

              {!queueData?.waitingQueue?.length ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5 opacity-60" />
                  <span>Queue is currently empty.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {queueData.waitingQueue.map((q: any) => (
                    <div
                      key={q._id}
                      className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-100 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-blue-950">{q.tokenDisplay}</span>
                          <span className="text-[10px] text-slate-500">#{q.position}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[140px]">
                          {q.patientName}
                        </p>
                        <p className="text-[10px] text-slate-500">{q.timeSlot}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-700 block">
                          ~{q.estimatedWaitMinutes}m
                        </span>
                        <span className="text-[10px] text-slate-400">{q.peopleAhead} ahead</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
