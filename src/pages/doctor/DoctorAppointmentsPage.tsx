import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  CalendarDays,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Loader2,
} from 'lucide-react';

export const DoctorAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDoctorApts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorApts();
  }, [user]);

  const filtered = appointments.filter((apt) => {
    const matchesStatus =
      statusFilter === 'all' || apt.status.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.tokenDisplay.toLowerCase().includes(q) ||
      apt.appointmentNumber.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>Assigned Patient Appointments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete consultation logs, upcoming scheduled slots, and medical complaint records.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search patient name, token, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'In Consultation', 'Waiting', 'Confirmed', 'Completed', 'Cancelled', 'No-show'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              )
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading appointments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No appointments found matching filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Token</th>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-5 py-3.5">Date &amp; Slot</th>
                    <th className="px-5 py-3.5">Chief Complaint</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Clinical Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((apt) => (
                    <tr key={apt._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60">
                          {apt.tokenDisplay}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-400">{apt.patientPhone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{apt.appointmentDate}</p>
                        <p className="text-[11px] text-slate-500">{apt.timeSlot}</p>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">
                        {apt.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={apt.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-500">
                        {apt.doctorNotes || '—'}
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
