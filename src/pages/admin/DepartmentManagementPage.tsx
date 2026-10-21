import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  Building2,
  Plus,
  CheckCircle2,
  Loader2,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Bone,
  Stethoscope,
} from 'lucide-react';

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setSaving(true);
      const res = await api.post('/admin/departments', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({ name: '', code: '', description: '', headOfDepartment: '' });
        setSuccessMsg(`Department ${res.data.department?.name} created successfully.`);
        fetchDepartments();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>Hospital Department Setup</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure clinical wings, department codes, and assign clinical heads.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Department Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading clinical departments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black rounded-lg border border-blue-200/60 text-xs tracking-wider">
                      {dept.code}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Active Wing
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>Department Head:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{dept.headOfDepartment || 'Chief Medical Officer'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Department Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-black text-slate-900">Add Clinical Department</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oncology, Ophthalmology"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department Code (3-4 letters) *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. ONCO, OPHT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Head of Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={formData.headOfDepartment}
                    onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description &amp; Services</label>
                  <textarea
                    rows={3}
                    placeholder="Summary of clinical procedures and treatments..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  ></textarea>
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
                    {saving ? 'Creating...' : 'Create Department'}
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
