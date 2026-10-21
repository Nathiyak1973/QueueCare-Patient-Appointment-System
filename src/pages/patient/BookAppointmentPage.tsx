import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { PaymentReceiptModal } from '../../components/payment/PaymentReceiptModal.tsx';
import {
  CalendarPlus,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DoorOpen,
  Activity,
  CreditCard,
  ShieldCheck,
  Receipt,
  FileCheck2,
  Sparkles,
  Building,
  Info,
} from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(searchParams.get('deptId') || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(searchParams.get('doctorId') || '');

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [slotsData, setSlotsData] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Payment Options: Pay at Hospital (Default) or Assisted Scheme
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_hospital' | 'assisted_scheme'>('pay_at_hospital');
  const [assistanceType, setAssistanceType] = useState<string>('Ayushman Bharat (PM-JAY)');
  const [assistanceId, setAssistanceId] = useState<string>('');

  // UI & Loading States
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Booking & Payment Results
  const [bookedResult, setBookedResult] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Load departments and doctors
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoadingDepts(true);
        const [deptRes, docRes] = await Promise.allSettled([
          api.get('/admin/departments'),
          api.get('/doctors'),
        ]);

        if (deptRes.status === 'fulfilled' && deptRes.value.data.success) {
          const depts = deptRes.value.data.departments || [];
          setDepartments(depts);
          if (!selectedDeptId && depts.length > 0) {
            setSelectedDeptId(depts[0]._id);
          }
        }

        if (docRes.status === 'fulfilled' && docRes.value.data.success) {
          setDoctors(docRes.value.data.doctors || []);
        }
      } catch (err) {
        console.error('Initial load error:', err);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchInitial();
  }, []);

  // Update selected doctor when department changes
  useEffect(() => {
    const filtered = doctors.filter(
      (d) => !selectedDeptId || d.doctorDetails?.departmentId === selectedDeptId
    );
    if (filtered.length > 0) {
      if (!filtered.some((d) => d._id === selectedDoctorId)) {
        setSelectedDoctorId(filtered[0]._id);
      }
    } else {
      setSelectedDoctorId('');
    }
  }, [selectedDeptId, doctors]);

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlotsData(null);
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot('');
        setError('');
        const res = await api.get(`/doctors/${selectedDoctorId}/slots?date=${selectedDate}`);
        if (res.data.success) {
          setSlotsData(res.data);
        }
      } catch (err: any) {
        console.error(err);
        setError('Could not load doctor slots.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === selectedDoctorId);
  const consultationFee = Number(selectedDoctorObj?.doctorDetails?.consultationFee) || 500;

  // Main Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDoctorId) {
      setError('Please select a doctor.');
      return;
    }
    if (!selectedDate) {
      setError('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setError('Please choose an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter the reason for consultation.');
      return;
    }

    if (paymentMethod === 'assisted_scheme' && !assistanceId.trim()) {
      setError('Please enter your Scheme Beneficiary / Card Number.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        reason: reason.trim(),
        paymentMethod,
      };

      if (paymentMethod === 'assisted_scheme') {
        payload.financialAssistanceType = assistanceType;
        payload.financialAssistanceId = assistanceId.trim();
      }

      const res = await api.post('/appointments', payload);

      if (res.data.success) {
        setBookedResult(res.data.appointment);
        setPaymentResult(res.data.payment);
      } else {
        setError(res.data.message || 'Failed to complete appointment booking.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to book appointment. The slot may have just been reserved.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-blue-600" />
            <span>Book Doctor Appointment</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Schedule an OPD consultation, select Pay at Hospital or Healthcare Assistance, and receive your real-time queue token immediately.
          </p>
        </div>

        {/* Success Card after Booking */}
        {bookedResult ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Appointment Confirmed
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  bookedResult.paymentStatus === 'assisted_waived'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  Payment: {bookedResult.paymentStatus === 'assisted_waived' ? 'Waived (Assisted)' : 'Pending'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Appointment Successfully Booked!
              </h2>
              <p className="text-sm font-semibold text-blue-700 bg-blue-50 py-2.5 px-4 rounded-2xl max-w-lg mx-auto border border-blue-100">
                {bookedResult.paymentStatus === 'assisted_waived'
                  ? 'Your appointment has been booked under the healthcare assistance scheme.'
                  : 'Appointment booked successfully. Please pay the consultation fee at the hospital during your visit.'}
              </p>
            </div>

            {/* Token Badge */}
            <div className="max-w-md mx-auto bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                Your Queue Token
              </p>
              <p className="text-4xl font-black tracking-wider text-emerald-400">
                {bookedResult.tokenDisplay}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 text-left text-xs gap-3">
                <div>
                  <span className="text-slate-400 block">Doctor:</span>
                  <span className="font-bold">{bookedResult.doctorName}</span>
                  <span className="text-[11px] text-slate-400 block">
                    {selectedDoctorObj?.doctorDetails?.specialty || bookedResult.departmentName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date &amp; Time Slot:</span>
                  <span className="font-bold">
                    {bookedResult.appointmentDate}
                  </span>
                  <span className="text-[11px] text-emerald-400 block font-mono">
                    {bookedResult.timeSlot}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Room Number:</span>
                  <span className="font-bold">
                    {selectedDoctorObj?.doctorDetails?.roomNumber || 'OPD Desk'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Consultation Fee:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {bookedResult.paymentStatus === 'assisted_waived'
                      ? 'Waived (₹0)'
                      : `₹${bookedResult.consultationFee}`}
                  </span>
                  <span className="text-[10px] text-amber-300 block">
                    {bookedResult.paymentStatus === 'assisted_waived' ? 'Govt Subsidy' : 'Pay at Hospital Desk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {paymentResult && (
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(true)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>View Hospital Booking Slip</span>
                </button>
              )}
              <Link
                to="/patient/live-queue"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Track Live Queue Position</span>
              </Link>
              <Link
                to="/patient/appointments"
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                View My Appointments
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Booking Notice</p>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Step 1: Select Department */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>Select Clinical Department</span>
              </div>

              {loadingDepts ? (
                <div className="py-4 text-xs text-slate-500">Loading departments...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptId === dept._id;
                    return (
                      <button
                        key={dept._id}
                        type="button"
                        onClick={() => setSelectedDeptId(dept._id)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Building2
                          className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                        <div>
                          <p className="font-bold text-xs truncate">{dept.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{dept.code}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Select Doctor */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>Select Specialist Physician</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doctors
                  .filter((d) => !selectedDeptId || d.doctorDetails?.departmentId === selectedDeptId)
                  .map((doc) => {
                    const isSelected = selectedDoctorId === doc._id;
                    const docFee = doc.doctorDetails?.consultationFee || 500;
                    return (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doc._id)}
                        className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 text-blue-950 ring-2 ring-blue-600/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-sm">{doc.name}</h4>
                          <p className="text-xs text-blue-600 font-semibold">{doc.doctorDetails?.specialty}</p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-0.5">
                              <DoorOpen className="w-3.5 h-3.5" />
                              {doc.doctorDetails?.roomNumber}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              {doc.doctorDetails?.avgConsultationMinutes}m avg
                            </span>
                          </div>
                        </div>

                        {/* Consultation Fee in INR */}
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block">
                            ₹{docFee}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Consultation Fee</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Step 3: Date & Slot Selection */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                  3
                </span>
                <span>Select Date &amp; Available Real-Time Slot</span>
              </div>

              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Slot Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Available Slots</span>
                  <span className="text-[11px] text-slate-400">
                    Duration: {slotsData?.slotDurationMinutes || 15} mins / patient
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Checking real-time doctor availability...</span>
                  </div>
                ) : !slotsData || !slotsData.slots ? (
                  <div className="p-4 text-center text-xs text-slate-500">Select a doctor to view slots.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                    {slotsData.slots.map((item: any) => {
                      const isSelected = selectedSlot === item.slot;
                      return (
                        <button
                          key={item.slot}
                          type="button"
                          disabled={!item.isAvailable}
                          onClick={() => setSelectedSlot(item.slot)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                            !item.isAvailable
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {item.slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Reason for Consultation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                  4
                </span>
                <span>Reason for Consultation / Symptoms</span>
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe your current symptoms or purpose of visit (e.g. Chest pain during exertion, periodic hypertension checkup, persistent fever)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            {/* Step 5: Verified Consultation Fee & Pay Later / Pay at Hospital */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                  5
                </span>
                <span>Consultation Fee &amp; Payment Option</span>
              </div>

              {/* Consultation Fee Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200/60">
                  <span>Physician Consultation Fee ({selectedDoctorObj?.name || 'Selected Doctor'}):</span>
                  <span className="font-bold text-slate-900">₹{consultationFee}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-b border-slate-200/60">
                  <span>OPD Registration &amp; Hospital Infrastructure:</span>
                  <span className="text-emerald-600 font-semibold">Included (₹0)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-b border-slate-200/60">
                  <span>Goods &amp; Services Tax (GST):</span>
                  <span>Exempt (0%)</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-sm font-black text-slate-900">Total Consultation Payable:</span>
                  <span className="text-2xl font-black text-blue-600">
                    {paymentMethod === 'assisted_scheme' ? '₹0' : `₹${consultationFee}`}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Payment Option
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Pay at Hospital */}
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      paymentMethod === 'pay_at_hospital'
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pay_at_hospital"
                          checked={paymentMethod === 'pay_at_hospital'}
                          onChange={() => setPaymentMethod('pay_at_hospital')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Pay at Hospital</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                        PAY LATER
                      </span>
                    </div>
                    <p className="text-xs text-blue-900/80 font-medium mt-2 pl-6 leading-relaxed">
                      You can pay the consultation fee at the hospital during your visit.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 pl-6">
                      Accepted at hospital desk: Cash, UPI, Credit / Debit Cards.
                    </p>
                  </label>

                  {/* Option 2: Financial Assistance / Govt Scheme */}
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      paymentMethod === 'assisted_scheme'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="assisted_scheme"
                          checked={paymentMethod === 'assisted_scheme'}
                          onChange={() => setPaymentMethod('assisted_scheme')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Govt Scheme / Healthcare Assistance</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        ASSISTED WAIVER
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 pl-6">
                      Ayushman Bharat (PM-JAY), Senior Citizen concession, EWS healthcare relief card.
                    </p>
                  </label>
                </div>
              </div>

              {/* Informative Pay at Hospital Card */}
              {paymentMethod === 'pay_at_hospital' && (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Pay Later / Hospital Counter Notice</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    You can pay the consultation fee of <strong>₹{consultationFee}</strong> at the hospital billing desk during your appointment check-in. Your queue token will be issued immediately upon confirmation.
                  </p>
                </div>
              )}

              {/* Financial Assistance Input fields when selected */}
              {paymentMethod === 'assisted_scheme' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Beneficiary Scheme Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Assistance Category
                      </label>
                      <select
                        value={assistanceType}
                        onChange={(e) => setAssistanceType(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                      >
                        <option value="Ayushman Bharat (PM-JAY)">Ayushman Bharat (PM-JAY)</option>
                        <option value="Senior Citizen Health Benefit Card">Senior Citizen Health Benefit Card</option>
                        <option value="EWS Healthcare Concession Scheme">EWS Healthcare Concession Scheme</option>
                        <option value="Hospital Staff / Dependent Benefit">Hospital Staff / Dependent Benefit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Scheme ID / Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PMJAY-DEL-9821034"
                        value={assistanceId}
                        onChange={(e) => setAssistanceId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono uppercase"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your appointment token will be issued immediately. Please present your scheme card at the hospital verification counter during OPD check-in.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className={`w-full py-4 text-white font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${
                    paymentMethod === 'assisted_scheme'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Confirming Appointment &amp; Generating Token...</span>
                    </>
                  ) : paymentMethod === 'assisted_scheme' ? (
                    <>
                      <FileCheck2 className="w-5 h-5" />
                      <span>Confirm Assisted Booking (₹0)</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-5 h-5" />
                      <span>Confirm Appointment – Pay at Hospital</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Payment Receipt / Hospital Slip Modal */}
        {paymentResult && (
          <PaymentReceiptModal
            paymentId={paymentResult._id}
            isOpen={receiptModalOpen}
            onClose={() => setReceiptModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
