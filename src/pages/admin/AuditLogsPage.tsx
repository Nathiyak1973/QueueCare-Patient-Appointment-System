import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  ShieldCheck,
  Search,
  Filter,
  Loader2,
  Calendar,
  Lock,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/admin/audit-logs?limit=100';
      if (entityFilter !== 'all') url += `&entityType=${entityFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, entityFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Security &amp; Administrative Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit records tracking appointment bookings, cancellations, doctor provisioning, and queue state alterations.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search actor, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'Appointment', 'Queue', 'Doctor', 'Department', 'User', 'Auth'].map((et) => (
              <button
                key={et}
                onClick={() => setEntityFilter(et)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  entityFilter === et
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {et === 'all' ? 'All Entities' : et}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Querying security audit store...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No audit logs matching query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Action Code</th>
                    <th className="px-5 py-3.5">Target Entity</th>
                    <th className="px-5 py-3.5">Activity Details</th>
                    <th className="px-5 py-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        <span className="font-mono text-[11px] block text-slate-800">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{log.userName}</p>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 max-w-sm">
                        {log.details}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
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
