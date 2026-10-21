import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  Users,
  Search,
  Phone,
  Mail,
  Heart,
  CalendarCheck,
  MapPin,
  Loader2,
} from 'lucide-react';

export const PatientManagementPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/patients?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setPatients(res.data.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Hospital Patient Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered patient accounts, blood groups, emergency contacts, and consultation history counts.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search patient by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading patient accounts...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No patients registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Patient Name</th>
                    <th className="px-5 py-3.5">Contact &amp; Email</th>
                    <th className="px-5 py-3.5">Age &amp; Blood Group</th>
                    <th className="px-5 py-3.5">Emergency Contact</th>
                    <th className="px-5 py-3.5">Address</th>
                    <th className="px-5 py-3.5 text-right">Total Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {patients.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 font-semibold">{p.phone}</p>
                        <p className="text-[11px] text-slate-400">{p.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-800">{p.patientDetails?.age ? `${p.patientDetails.age} yrs` : '—'}</span>
                        {p.patientDetails?.bloodGroup && (
                          <span className="ml-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 font-black rounded-md border border-rose-100 text-[10px]">
                            {p.patientDetails.bloodGroup}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.patientDetails?.emergencyContact || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                        {p.patientDetails?.address || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="bg-blue-50 text-blue-700 font-black px-2.5 py-1 rounded-lg border border-blue-100">
                          {p.appointmentsCount} visits
                        </span>
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
