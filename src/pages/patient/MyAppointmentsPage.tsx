import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.ts';
import { useQueue } from '../../context/QueueContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  CalendarDays,
  CalendarCheck,
  Search,
  Activity,
  XCircle,
  FileText,
  AlertCircle,
  Loader2,
  Clock,
  DoorOpen,
  Receipt,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PaymentReceiptModal } from '../../components/payment/PaymentReceiptModal.tsx';

export const MyAppointmentsPage: React.FC = () => {
  const { lastUpdated, triggerQueueRefresh } = useQueue();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Cancel Modal state
  const [cancelModalApt, setCancelModalApt] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // Prescription modal state
  const [viewPrescriptionApt, setViewPrescriptionApt] = useState<any | null>(null);

  // Payment receipt modal state
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState<string | null>(null);

  const fetchAppointments = async () => {
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
    fetchAppointments();
  }, [lastUpdated]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalApt) return;

    try {
      setCancelling(true);
      setActionError('');
      const res = await api.patch(`/appointments/${cancelModalApt._id}/cancel`, {
        reason: cancelReason || 'Cancelled by patient',
      });
      if (res.data.success) {
        setCancelModalApt(null);
        setCancelReason('');
        triggerQueueRefresh();
        fetchAppointments();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = appointments.filter((apt) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? ['Confirmed', 'Waiting', 'In Consultation', 'Pending'].includes(apt.status)
        : apt.status.toLowerCase() === filterStatus.toLowerCase();

    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      apt.doctorName.toLowerCase().includes(q) ||
      apt.tokenDisplay.toLowerCase().includes(q) ||
      apt.departmentName.toLowerCase().includes(q) ||
      apt.appointmentNumber.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-600" />
              <span>My Appointments &amp; History</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track queue tokens, view past medical summaries, and manage scheduled clinic visits.
            </p>
          </div>

          <Link
            to="/patient/book"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Book Another Slot</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search token, doctor, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'active', label: 'Active & Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Retrieving appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No appointments found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {filterStatus !== 'all' ? 'Try changing your status filter.' : 'You have not booked any appointments yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((apt) => {
              const isToday = apt.appointmentDate === todayStr;
              const canCancel = ['Confirmed', 'Waiting', 'Pending'].includes(apt.status);

              return (
                <div
                  key={apt._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Token Number
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-2xl font-black text-blue-950">{apt.tokenDisplay}</span>
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 block">{apt.appointmentDate}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {apt.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5 my-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Physician:</span>
                        <strong className="text-slate-900">{apt.doctorName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span>{apt.departmentName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Appointment ID:</span>
                        <span className="font-mono text-[11px] text-slate-600">{apt.appointmentNumber}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">Payment Status:</span>
                        {apt.paymentStatus === 'paid' ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid (₹{apt.consultationFee || 600})</span>
                          </span>
                        ) : apt.paymentStatus === 'assisted_waived' ? (
                          <span className="font-bold text-sky-700 flex items-center gap-1 text-[11px] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            <ShieldCheck className="w-3 h-3 text-sky-600" />
                            <span>Assisted Waiver</span>
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Pending at Counter
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60 mb-3">
                      <strong>Reason:</strong> {apt.reason}
                    </p>

                    {apt.cancellationReason && (
                      <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-100 mb-3">
                        <strong>Cancellation Note:</strong> {apt.cancellationReason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {apt.paymentId && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptPaymentId(apt.paymentId)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>Hospital Slip</span>
                        </button>
                      )}

                      {apt.status === 'Completed' ? (
                        <button
                          onClick={() => setViewPrescriptionApt(apt)}
                          className="py-1.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Doctor Notes &amp; Rx</span>
                        </button>
                      ) : (
                        <>
                          {isToday && ['Waiting', 'In Consultation', 'Confirmed'].includes(apt.status) && (
                            <Link
                              to="/patient/live-queue"
                              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-xs"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Live Queue Tracker</span>
                            </Link>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => {
                                setCancelModalApt(apt);
                                setCancelReason('');
                                setActionError('');
                              }}
                              className="py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModalApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
              <h3 className="text-lg font-black text-slate-900">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel Token{' '}
                <strong className="text-slate-900">{cancelModalApt.tokenDisplay}</strong> with{' '}
                {cancelModalApt.doctorName} on {cancelModalApt.appointmentDate}?
              </p>

              {actionError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCancelSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Cancellation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule conflict, feeling better..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalApt(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Keep Appointment
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription & Clinical Summary Modal */}
        {viewPrescriptionApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-fade-in">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Clinical Summary</span>
                  <h3 className="text-lg font-black text-slate-900">
                    Consultation Record ({viewPrescriptionApt.tokenDisplay})
                  </h3>
                </div>
                <button
                  onClick={() => setViewPrescriptionApt(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">Attending Doctor:</span>
                    <strong className="text-slate-900">{viewPrescriptionApt.doctorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date of Consult:</span>
                    <strong className="text-slate-900">{viewPrescriptionApt.appointmentDate}</strong>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Doctor's Clinical Notes:</label>
                  <p className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-slate-700 leading-relaxed">
                    {viewPrescriptionApt.doctorNotes || 'No specific clinical notes entered.'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Prescription &amp; Dosage:</label>
                  <p className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-slate-800 font-mono leading-relaxed">
                    {viewPrescriptionApt.prescription || 'No medications prescribed.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setViewPrescriptionApt(null)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Receipt / Hospital Slip Modal */}
        {selectedReceiptPaymentId && (
          <PaymentReceiptModal
            paymentId={selectedReceiptPaymentId}
            isOpen={!!selectedReceiptPaymentId}
            onClose={() => setSelectedReceiptPaymentId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
