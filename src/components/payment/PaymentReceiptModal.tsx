import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import {
  X,
  Printer,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Receipt,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PaymentReceiptModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !paymentId) return;

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/payments/receipt/${paymentId}`);
        if (res.data.success) {
          setReceiptData(res.data.receipt);
        } else {
          setError(res.data.message || 'Could not load receipt.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to retrieve payment receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm tracking-wide">Official Hospital Payment Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[80vh] overflow-y-auto print:p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Generating official receipt...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-xs text-red-600 font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          ) : receiptData ? (
            <div id="printable-receipt" className="space-y-6">
              {/* Receipt Top Header */}
              <div className="border-b border-slate-200 pb-4 text-center sm:text-left sm:flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <span className="font-black text-slate-900 text-lg">QueueCare</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {receiptData.hospital?.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {receiptData.hospital?.address}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    GSTIN: {receiptData.hospital?.gstin}
                  </p>
                </div>

                <div className="mt-3 sm:mt-0 text-center sm:text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 mb-1">
                    {receiptData.status === 'paid' ? 'PAID & VERIFIED' : receiptData.status.toUpperCase()}
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900">
                    {receiptData.receiptNumber}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(receiptData.paymentDate).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              {/* Patient and Doctor Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Billed To (Patient)
                  </span>
                  <p className="font-bold text-slate-900">{receiptData.patient?.name}</p>
                  <p className="text-slate-600 text-[11px]">{receiptData.patient?.phone}</p>
                  <p className="text-slate-500 text-[10px]">{receiptData.patient?.email}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Attending Physician
                  </span>
                  <p className="font-bold text-slate-900">{receiptData.doctor?.name}</p>
                  <p className="text-slate-600 text-[11px]">
                    {receiptData.doctor?.specialty} ({receiptData.doctor?.department})
                  </p>
                  <p className="text-slate-500 text-[10px]">{receiptData.doctor?.roomNumber}</p>
                </div>
              </div>

              {/* Appointment Token Information */}
              {receiptData.appointment && (
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                      Queue Appointment Token
                    </span>
                    <span className="text-2xl font-black text-blue-950">
                      {receiptData.appointment.tokenDisplay}
                    </span>
                    <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                      Ref: {receiptData.appointment.appointmentNumber}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-700">
                    <p className="font-bold flex items-center justify-end gap-1 text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {receiptData.appointment.appointmentDate}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {receiptData.appointment.timeSlot}
                    </p>
                  </div>
                </div>
              )}

              {/* Fee Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Department</th>
                      <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">Doctor OPD Consultation Fee</p>
                        <p className="text-[10px] text-slate-400">
                          {receiptData.appointment?.reason || 'Clinical consultation and diagnosis'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {receiptData.doctor?.department}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{receiptData.amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {receiptData.financialAssistanceType && (
                      <tr className="bg-emerald-50/50">
                        <td className="py-2 px-4 text-[11px] text-emerald-800" colSpan={2}>
                          Healthcare Concession Applied ({receiptData.financialAssistanceType})
                          <span className="block text-[10px] text-emerald-600 font-mono">
                            Scheme ID: {receiptData.financialAssistanceId}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right text-emerald-700 font-bold text-xs">
                          Waived / Covered
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 px-4 text-[11px] text-slate-500" colSpan={2}>
                        Hospital OPD Registration &amp; Facility Fee
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500 font-medium">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[11px] text-slate-500" colSpan={2}>
                        Applicable Goods &amp; Services Tax (GST)
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500 font-medium">Exempt (0%)</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold">
                    <tr>
                      <td className="py-3 px-4 text-sm" colSpan={2}>
                        Total Amount Received
                      </td>
                      <td className="py-3 px-4 text-right text-base font-black text-emerald-400">
                        ₹{receiptData.amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Transaction Metadata */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">
                    {receiptData.method === 'assisted_scheme'
                      ? 'Govt Healthcare Assistance / Concession Scheme'
                      : 'Hospital Billing Counter (Pay at Hospital)'}
                  </span>
                </div>
                {receiptData.markedPaidBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collected By Staff:</span>
                    <span className="font-semibold text-emerald-700">{receiptData.markedPaidBy}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Slip Ref:</span>
                  <span className="font-mono text-slate-800">{receiptData.transactionId}</span>
                </div>
              </div>

              {/* Exemption Notice */}
              <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
                <p>{receiptData.hospital?.exemptionNotice}</p>
                <p className="mt-0.5">
                  This is a computer-generated digital receipt and requires no physical signature.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">QueueCare Secure Payments</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!receiptData}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
