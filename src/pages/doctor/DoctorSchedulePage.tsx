import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  Clock,
  DoorOpen,
  DollarSign,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export const DoctorSchedulePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { triggerQueueRefresh } = useQueue();

  const [formData, setFormData] = useState({
    specialty: user?.doctorDetails?.specialty || '',
    roomNumber: user?.doctorDetails?.roomNumber || '',
    avgConsultationMinutes: user?.doctorDetails?.avgConsultationMinutes || 15,
    consultationFee: user?.doctorDetails?.consultationFee || 100,
    phone: user?.phone || '',
    bio: user?.doctorDetails?.bio || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setSaving(true);
      const res = await api.put(`/doctors/${user?._id}`, formData);
      if (res.data.success) {
        updateUser(res.data.doctor);
        triggerQueueRefresh();
        setSuccessMsg('Schedule parameters and room configuration updated successfully.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span>Consultation Schedule &amp; Timings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your average examination duration, consultation suite number, and clinic fee.
          </p>
        </div>

        {/* Algorithm highlight box */}
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Intelligent Wait Time Integration:</strong>
            <p className="mt-0.5 text-blue-800 leading-relaxed">
              When you adjust your <strong>Average Consultation Duration</strong> below, the system automatically recalibrates the estimated waiting times on every patient's digital ticket in real time!
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Average Consultation Duration
                </label>
                <select
                  name="avgConsultationMinutes"
                  value={formData.avgConsultationMinutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value={10}>10 Minutes / Patient</option>
                  <option value={15}>15 Minutes / Patient (Standard OPD)</option>
                  <option value={20}>20 Minutes / Patient (Specialist Exam)</option>
                  <option value={30}>30 Minutes / Patient (In-depth Evaluation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Consultation Suite / Room
                </label>
                <div className="relative">
                  <DoorOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Suite 302"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Consultation Fee ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Direct Clinic Extension / Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Sub-Specialty Focus
              </label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                placeholder="e.g. Interventional Cardiology, Pediatric Neurology"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Professional Bio &amp; Clinical Focus
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief summary of clinical background..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Schedule Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
