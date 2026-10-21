import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useQueue } from '../../context/QueueContext.tsx';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  Activity,
  DoorOpen,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Stethoscope,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export const QueueMonitorPage: React.FC = () => {
  const { lastUpdated, triggerQueueRefresh } = useQueue();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');

  const fetchOverview = async () => {
    try {
      const res = await api.get('/queue/hospital-overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [lastUpdated]);

  const queues = data?.queues || [];
  const departments = data?.departments || [];

  const filtered = queues.filter((q: any) => {
    return selectedDept === 'all' || q.departmentId === selectedDept;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header Display */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Hospital OPD Waiting Room Master Display
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Live Department Consultation Queues
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Current tokens, active examination suites, and waiting lines across all hospital wings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerQueueRefresh();
                fetchOverview();
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
              title="Manual refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Display</span>
            </button>
          </div>
        </div>

        {/* Department Filters */}
        <div className="flex items-center gap-2 overflow-x-auto my-6 pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedDept === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Hospital Wings ({queues.length})
          </button>
          {departments.map((dept: any) => (
            <button
              key={dept._id}
              onClick={() => setSelectedDept(dept._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedDept === dept._id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Big Suite Monitor Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Connecting to clinical room telemetry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No active suites matching selected department.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((suite: any) => {
              const isServing = suite.currentServingToken !== 'None';

              return (
                <div
                  key={suite.doctorId}
                  className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 shadow-xl flex flex-col justify-between hover:border-slate-600 transition"
                >
                  <div>
                    {/* Top Room & Specialty */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700 mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                          {suite.departmentName}
                        </span>
                        <h3 className="font-bold text-white text-base mt-0.5">{suite.doctorName}</h3>
                        <p className="text-xs text-slate-400">{suite.specialty}</p>
                      </div>

                      <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Suite</span>
                        <span className="text-xs font-black text-amber-400">{suite.roomNumber}</span>
                      </div>
                    </div>

                    {/* NOW SERVING BIG HIGHLIGHT */}
                    <div className="text-center bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 my-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        Now In Consultation
                      </span>
                      <p
                        className={`text-5xl font-black my-2 font-mono tracking-tight ${
                          isServing ? 'text-emerald-400 animate-pulse' : 'text-slate-600'
                        }`}
                      >
                        {isServing ? suite.currentServingToken : 'STANDBY'}
                      </p>
                      <p className="text-xs text-slate-300 truncate">
                        {isServing ? suite.currentServingPatient : 'Doctor is available'}
                      </p>
                    </div>

                    {/* Queue stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40">
                        <span className="text-[10px] text-slate-400 block">Next Up in Line</span>
                        <span className="font-black text-amber-400 text-sm mt-0.5 block">
                          {suite.nextUpToken !== 'None' ? suite.nextUpToken : '—'}
                        </span>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40">
                        <span className="text-[10px] text-slate-400 block">Waiting Count</span>
                        <span className="font-black text-blue-400 text-sm mt-0.5 block">
                          {suite.waitingCount} patients
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Avg Consult: <strong>{suite.avgConsultationMinutes}m</strong></span>
                    <span>Completed Today: <strong className="text-emerald-400">{suite.completedCount}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
