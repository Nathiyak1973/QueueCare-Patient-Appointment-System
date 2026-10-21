import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  FileSpreadsheet,
  Search,
  Filter,
  XCircle,
  Calendar,
  Loader2,
  CheckCircle2,
  DoorOpen,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const AppointmentManagementPage: React.FC = () => {
  const { lastUpdated, triggerQueueRefresh } = useQueue();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = '/appointments?limit=100';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (paymentFilter !== 'all') url += `&paymentStatus=${paymentFilter}`;
      if (dateFilter) url += `&date=${dateFilter}`;

      const res = await api.get(url);
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
    fetchAppointments();
  }, [statusFilter, paymentFilter, dateFilter, lastUpdated]);

  const handleAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    try {
      setCancelling(true);
      const res = await api.patch(`/appointments/${cancelTarget._id}/cancel`, {
        reason: cancelReason || 'Administrative cancellation',
      });
      if (res.data.success) {
        setCancelTarget(null);
        setCancelReason('');
        setActionSuccess(`Appointment ${res.data.appointment?.appointmentNumber} cancelled.`);
        triggerQueueRefresh();
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleMarkAsPaid = async (aptId: string) => {
    try {
      setUpdatingPaymentId(aptId);
      const res = await api.patch(`/appointments/${aptId}/payment-status`, {
        paymentStatus: 'paid',
      });
      if (res.data.success) {
        setActionSuccess(`Payment for token ${res.data.appointment?.tokenDisplay} marked as Paid.`);
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const filtered = appointments.filter((apt) => {
    const q = search.toLowerCase();
    return (
      !search ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q) ||
      apt.tokenDisplay.toLowerCase().includes(q) ||
      apt.appointmentNumber.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Master Hospital Appointments Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global view of all scheduled visits, patient tokens, counter payment collection, and clinic queues.
          </p>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search patient, doctor, token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear Date
              </button>
            )}

            {/* Payment Filter */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Payment:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'paid', label: 'Paid' },
                { id: 'assisted_waived', label: 'Assisted' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaymentFilter(p.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
                    paymentFilter === p.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto border-l border-slate-200 pl-2">
              {['all', 'In Consultation', 'Waiting', 'Confirmed', 'Completed', 'Cancelled'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Retrieving master records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No appointments found matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3.5">Token</th>
                    <th className="px-4 py-3.5">Patient Info</th>
                    <th className="px-4 py-3.5">Physician &amp; Wing</th>
                    <th className="px-4 py-3.5">Date &amp; Slot</th>
                    <th className="px-4 py-3.5">Queue Status</th>
                    <th className="px-4 py-3.5">Fee &amp; Payment</th>
                    <th className="px-4 py-3.5 text-right">Staff Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((apt) => {
                    const canCancel = ['Confirmed', 'Waiting', 'Pending'].includes(apt.status);
                    const isPending = (apt.paymentStatus || 'pending') === 'pending';
                    const isUpdating = updatingPaymentId === apt._id;

                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5">
                          <span className="font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60 font-mono">
                            {apt.tokenDisplay}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{apt.patientName}</p>
                          <p className="text-[11px] text-slate-400">{apt.patientPhone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{apt.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{apt.departmentName}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{apt.appointmentDate}</p>
                          <p className="text-[11px] text-slate-500">{apt.timeSlot}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={apt.status} size="sm" />
                        </td>
                        <td className="px-4 py-3.5">
                          {apt.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid (₹{apt.consultationFee})</span>
                            </span>
                          ) : apt.paymentStatus === 'assisted_waived' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                              <ShieldCheck className="w-3 h-3 text-sky-600" />
                              <span>Assisted (₹0)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending ₹{apt.consultationFee || 500}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          {isPending && apt.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleMarkAsPaid(apt._id)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Mark Paid</span>
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => {
                                setCancelTarget(apt);
                                setCancelReason('');
                              }}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Cancellation Dialog */}
        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
              <h3 className="text-lg font-black text-slate-900">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are cancelling appointment <strong>{cancelTarget.appointmentNumber}</strong> (Token:{' '}
                <strong>{cancelTarget.tokenDisplay}</strong>) for patient <strong>{cancelTarget.patientName}</strong>.
              </p>

              <form onSubmit={handleAdminCancel} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Cancellation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Patient requested schedule shift, doctor emergency leave..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Keep Slot
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    <span>Confirm Cancellation</span>
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
