import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink,
  CalendarPlus,
  IndianRupee,
} from 'lucide-react';
import { Payment } from '../../types/index.ts';

export const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/my-payments');
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'failed'
        ? ['failed', 'cancelled'].includes(payment.status)
        : payment.status.toLowerCase() === filterStatus.toLowerCase();

    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      payment.paymentNumber.toLowerCase().includes(q) ||
      payment.doctorName.toLowerCase().includes(q) ||
      payment.departmentName.toLowerCase().includes(q) ||
      (payment.receiptNumber && payment.receiptNumber.toLowerCase().includes(q)) ||
      (payment.appointmentNumber && payment.appointmentNumber.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const assistedCount = payments.filter((p) => p.status === 'assisted_waived').length;

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
            <span>Pending</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <span>Payment &amp; Transaction History</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View official hospital billing receipts, counter transaction numbers, and healthcare assistance waivers.
            </p>
          </div>

          <Link
            to="/patient/book"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Total Consultation Paid
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {paidCount} Completed Consultations
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Healthcare Scheme Concessions
            </span>
            <p className="text-3xl font-black text-blue-950 mt-1">{assistedCount}</p>
            <p className="text-[11px] text-sky-600 font-semibold mt-1">
              Ayushman Bharat &amp; Govt Health Relief
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Official Tax Receipts
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">{paidCount + assistedCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ready for Print / PDF Download</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search transaction ID, doctor, receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'paid', label: 'Successful Paid' },
              { id: 'assisted_waived', label: 'Assisted Scheme' },
              { id: 'pending', label: 'Pending' },
              { id: 'failed', label: 'Failed / Cancelled' },
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

        {/* Payment Records Table / Cards */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Retrieving payment ledger...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No payment records found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {filterStatus !== 'all'
                ? 'Try changing your status filter or search criteria.'
                : 'You have not made any appointment payments yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const isPaid = payment.status === 'paid';
              const isAssisted = payment.status === 'assisted_waived';

              return (
                <div
                  key={payment._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-700'
                          : isAssisted
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {payment.receiptNumber || payment.paymentNumber}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Consultation with {payment.doctorName}{' '}
                        <span className="text-slate-400 font-normal">({payment.departmentName})</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {payment.method === 'assisted_scheme' ? 'Assisted Scheme Waiver' : 'Pay at Hospital Desk'}
                        </span>
                        {payment.appointmentNumber && (
                          <>
                            <span>&bull;</span>
                            <span className="text-blue-600 font-semibold">
                              Apt: {payment.appointmentNumber}
                            </span>
                          </>
                        )}
                      </div>

                      {payment.failureReason && (
                        <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg mt-2 border border-red-100">
                          Note: {payment.failureReason}
                        </p>
                      )}

                      {payment.financialAssistanceType && (
                        <p className="text-[11px] text-sky-700 bg-sky-50 p-2 rounded-lg mt-2 border border-sky-100">
                          Scheme: {payment.financialAssistanceType} (ID: {payment.financialAssistanceId})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-lg font-black text-slate-900">
                        {isAssisted ? 'Waived (₹0)' : `₹${payment.amount}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {payment.method === 'assisted_scheme'
                          ? 'Scheme Concession'
                          : 'Pay at Hospital'}
                      </span>
                    </div>

                    {(isPaid || isAssisted) && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptId(payment._id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Receipt Modal */}
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
