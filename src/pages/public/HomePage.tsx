import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.ts';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  CalendarCheck,
  Clock,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Bone,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [hospitalSummary, setHospitalSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/queue/hospital-overview')
      .then((res) => {
        if (res.data.success) {
          setHospitalSummary(res.data);
        }
      })
      .catch((err) => console.warn(err));
  }, []);

  const deptIcons: Record<string, any> = {
    Cardiology: HeartPulse,
    Neurology: Brain,
    Pediatrics: Baby,
    Orthopedics: Bone,
    'General Medicine': Stethoscope,
    Dermatology: Activity,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle hospital grid background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Intelligent Real-Time Queue &amp; Appointment Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Streamlined Healthcare, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">
              Zero Crowded Waiting Rooms.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Book appointments with top specialists, receive instant digital queue tokens, and track your waiting time in real time from home or hospital lounge.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/patient/book"
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>Book Appointment Now</span>
            </Link>

            <Link
              to="/doctor/register"
              className="px-6 py-3.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Doctor Registration</span>
            </Link>

            <Link
              to="/queue-monitor"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold transition border border-slate-700 flex items-center gap-2"
            >
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>View Live Hospital Board</span>
            </Link>
          </div>
        </div>

        {/* Live Queue Marquee Ticker */}
        {hospitalSummary && hospitalSummary.queues && (
          <div className="max-w-5xl mx-auto mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Live OPD Consultation Rooms Status Today
              </span>
              <Link to="/queue-monitor" className="text-xs text-sky-300 hover:underline flex items-center gap-1">
                Full Board <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hospitalSummary.queues.slice(0, 3).map((q: any) => (
                <div key={q.doctorId} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{q.departmentName}</p>
                    <p className="text-sm font-bold text-white truncate">{q.doctorName}</p>
                    <p className="text-[11px] text-slate-400">Room: {q.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-400 uppercase font-bold block">Now Serving</span>
                    <span className="text-lg font-black text-emerald-400">
                      {q.currentServingToken !== 'None' ? q.currentServingToken : 'Standby'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3-Step Workflow */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How CareQueue Works</h2>
          <p className="text-sm text-slate-600 mt-2">
            An intelligent algorithmic queue management flow designed to eliminate delays and enhance patient convenience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Book Slot Online</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Select your specialty, choose your preferred physician, and pick an available 15-minute slot. Concurrency controls prevent double bookings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Receive Queue Token</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get an instant digital token with real-time wait estimation (e.g., 3 patients ahead ≈ 45 min). No manual paper slips or physical crowding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Calling &amp; Consult</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When the doctor clicks "Call Next", your dashboard chimes and displays the consultation room. The doctor records notes and prescription.
            </p>
          </div>
        </div>
      </section>

      {/* Clinical Departments */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Medical Departments</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Specialized Hospital Wings</h2>
            </div>
            <Link
              to="/doctors"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Explore all specialists</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitalSummary?.departments?.map((dept: any) => {
              const IconComp = deptIcons[dept.name] || Activity;
              return (
                <div
                  key={dept._id}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Code: {dept.code}</span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {dept.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Lead: {dept.headOfDepartment || 'Chief Medical Officer'}</span>
                    <Link
                      to={`/patient/book?deptId=${dept._id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Book &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quality Guarantees */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="px-3 py-1 bg-white/10 text-blue-300 text-xs font-semibold rounded-full border border-white/10">
              Enterprise Healthcare Reliability
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3">Ready to experience queue-free healthcare?</h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Whether you are a patient seeking consultation, a doctor managing outpatient queues, or an administrator overseeing hospital operations, CareQueue provides instant visibility.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time Socket.IO Sync</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dynamic Wait Time Estimation</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full Audit Trails</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              to="/patient/book"
              className="px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-center transition shadow-md"
            >
              Schedule Consultation
            </Link>
            <Link
              to="/doctor/register"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Registration</span>
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-center transition border border-white/20"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">CareQueue Hospital Management System</span>
          </div>
          <p>&copy; 2026 CareQueue Hospital Systems. All rights reserved. MERN Stack Implementation.</p>
        </div>
      </footer>
    </div>
  );
};
