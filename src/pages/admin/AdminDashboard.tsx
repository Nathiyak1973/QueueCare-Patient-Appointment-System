import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Activity,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { lastUpdated } = useQueue();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [lastUpdated]);

  const stats = data?.stats;
  const deptData = data?.departmentBreakdown || [];
  const hourlyData = data?.hourlyTrends || [];
  const statusData = data?.statusDistribution || [];
  const recentAudits = data?.recentAudits || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Hospital Administration Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Clinical Operations &amp; Queue Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of hospital OPD queues, specialist workload, and patient throughput.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients ?? 0}
            icon={Users}
            color="blue"
            subtitle="Registered health accounts"
          />
          <StatCard
            title="Active Physicians"
            value={stats?.totalDoctors ?? 0}
            icon={Stethoscope}
            color="emerald"
            subtitle="Clinical specialists"
          />
          <StatCard
            title="Today's OPD Volume"
            value={stats?.todayTotal ?? 0}
            icon={CalendarCheck}
            color="indigo"
            subtitle={`${stats?.todayCompleted ?? 0} completed visits`}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats?.completionRate ?? 0}%`}
            icon={CheckCircle2}
            color="amber"
            subtitle={`${stats?.todayWaiting ?? 0} currently in queue`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Volume Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>OPD Consultations by Department</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Patient volume distribution across wings</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalAppointments" name="All-Time Visits" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="todayAppointments" name="Today's Bookings" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Volume Trends */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Hourly Queue Load Trends</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Peak hours and arrival patterns throughout the day</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    name="Appointments"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ fill: '#0284c7', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Second Row: Status Distribution & Recent Audits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Donut (1 col) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Today's Appointment Statuses</h3>
              <p className="text-xs text-slate-500 mb-2">Breakdown of current queue states</p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
              {statusData.map((s: any) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                  <span className="text-slate-600 truncate">{s.name}:</span>
                  <strong className="text-slate-900">{s.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Logs (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Real-Time Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500">Security and administrative activity logs</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentAudits.slice(0, 5).map((log: any) => (
                <div key={log._id} className="p-3.5 hover:bg-slate-50/50 transition flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono capitalize">
                        {log.userRole}
                      </span>
                      <span className="font-semibold text-blue-600">{log.action}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
