import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { PaymentReceiptModal } from '../../components/payment/PaymentReceiptModal.tsx';
import {
  CreditCard,
  Search,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  User,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  IndianRupee,
  Building,
} from 'lucide-react';
import { Payment } from '../../types/index.ts';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kpis, setKpis] = useState<{
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    assistedCount: number;
    cancelledCount: number;
    totalTransactions: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/payments/admin/all', { params });
      if (res.data.success) {
        setPayments(res.data.payments || []);
        setKpis(res.data.kpis || null);
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      setUpdatingId(paymentId);
      setErrorMsg('');
      const res = await api.patch(`/payments/admin/${paymentId}/mark-paid`, {
        status: 'paid',
        notes: 'Consultation fee collected at hospital counter by Administrator',
      });

      if (res.data.success) {
        setSuccessMsg(`Payment marked as Paid successfully.`);
        fetchPayments();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.data.message || 'Failed to update payment status.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Server error updating payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case 'assisted_waived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Assisted Waiver</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pending at Hospital</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <span>Hospital Payments &amp; Revenue Ledger</span>
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Hospital counter collections, pending patient fees, and healthcare subsidy analytics.
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="self-start sm:self-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Collected Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              ₹{kpis ? kpis.totalRevenue.toLocaleString('en-IN') : 0}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Verified Counter Receipts</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Paid Consultations</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{kpis?.paidCount || 0}</p>
            <p className="text-[11px] text-slate-400">Payment received</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Pending at Counter</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-600">{kpis?.pendingCount || 0}</p>
            <p className="text-[11px] text-amber-700">To be collected upon check-in</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Assisted Waivers</span>
              <ShieldCheck className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{kpis?.assistedCount || 0}</p>
            <p className="text-[11px] text-sky-600">Ayushman / Govt schemes</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Payment ID, Patient, Doctor, or Slip Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['all', 'pending', 'paid', 'assisted_waived'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all'
                  ? 'All Payments'
                  : st === 'pending'
                  ? 'Pending Counter'
                  : st === 'paid'
                  ? 'Paid'
                  : 'Assisted Waivers'}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Loading hospital payment transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No payment records found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hospital payment transactions match the selected filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Receipt / Slip ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Doctor &amp; Department</th>
                    <th className="py-3.5 px-4">Fee Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Date &amp; Details</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => {
                    const isPending = p.status === 'pending';
                    const isUpdating = updatingId === p._id;

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-slate-900">{p.paymentNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.receiptNumber || 'N/A'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{p.patientName}</p>
                          <p className="text-[11px] text-slate-500">{p.patientPhone || p.patientEmail}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{p.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{p.departmentName}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-black text-slate-900 text-sm">
                            {p.status === 'assisted_waived' ? (
                              <span className="text-sky-700 font-bold">Waived (₹0)</span>
                            ) : (
                              `₹${p.amount}`
                            )}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span>{p.method === 'assisted_scheme' ? 'Assisted Waiver' : 'Pay at Hospital'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <p>
                            {new Date(p.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          {p.paidAt && p.markedPaidBy && (
                            <p className="text-[10px] text-emerald-600 font-medium">
                              Collected by {p.markedPaidBy}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          {isPending && (
                            <button
                              onClick={() => handleMarkAsPaid(p._id)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Mark as Paid</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReceiptId(p._id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receipt / Hospital Slip Modal */}
        {selectedReceiptId && (
          <PaymentReceiptModal
            paymentId={selectedReceiptId}
            isOpen={!!selectedReceiptId}
            onClose={() => setSelectedReceiptId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
