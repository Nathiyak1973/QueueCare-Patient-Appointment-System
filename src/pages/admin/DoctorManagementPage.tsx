import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  DoorOpen,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';

export const DoctorManagementPage: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Doctor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    departmentId: '',
    qualification: '',
    experienceYears: 5,
    roomNumber: '',
    avgConsultationMinutes: 15,
    consultationFee: 100,
    bio: '',
  });

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/admin/departments'),
      ]);

      if (docRes.data.success) {
        setDoctors(docRes.data.doctors || []);
      }
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments || []);
        if (deptRes.data.departments?.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: deptRes.data.departments[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch(`/admin/doctors/${id}/toggle-status`);
      if (res.data.success) {
        setActionSuccess(res.data.message);
        fetchData();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    try {
      setSaving(true);
      const res = await api.post('/admin/doctors', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          specialty: '',
          departmentId: departments[0]?._id || '',
          qualification: '',
          experienceYears: 5,
          roomNumber: '',
          avgConsultationMinutes: 15,
          consultationFee: 100,
          bio: '',
        });
        setActionSuccess('Doctor account provisioned successfully.');
        fetchData();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to create doctor.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = doctors.filter((doc) => {
    const q = search.toLowerCase();
    return (
      !search ||
      doc.name.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q) ||
      doc.doctorDetails?.specialty.toLowerCase().includes(q) ||
      doc.department?.name.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <span>Hospital Doctor Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Add medical specialists, configure consultation rooms, and activate or deactivate accounts.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search doctor, specialty, department..."
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
              <p className="text-xs text-slate-500">Loading doctor roster...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No doctors found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3.5">Doctor Name</th>
                    <th className="px-5 py-3.5">Department &amp; Specialty</th>
                    <th className="px-5 py-3.5">Suite &amp; Fee</th>
                    <th className="px-5 py-3.5">Avg Consult</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                            {doc.name.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{doc.name}</p>
                            <p className="text-[11px] text-slate-400">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{doc.department?.name || 'General'}</p>
                        <p className="text-[11px] text-slate-500">{doc.doctorDetails?.specialty}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 font-semibold">{doc.doctorDetails?.roomNumber}</p>
                        <p className="text-[11px] text-emerald-600 font-bold">${doc.doctorDetails?.consultationFee}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {doc.doctorDetails?.avgConsultationMinutes} mins
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(doc._id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            doc.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {doc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Doctor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-black text-slate-900">Provision New Doctor Account</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Alan Turing, MD"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="alan@hospital.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Specialty *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pediatric Cardiology"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Suite / Room</label>
                    <input
                      type="text"
                      required
                      placeholder="Room 204"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Fee ($ USD)</label>
                    <input
                      type="number"
                      required
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Avg Duration</label>
                    <select
                      value={formData.avgConsultationMinutes}
                      onChange={(e) => setFormData({ ...formData, avgConsultationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="MD, Johns Hopkins Medicine"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Creating Account...' : 'Create Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
