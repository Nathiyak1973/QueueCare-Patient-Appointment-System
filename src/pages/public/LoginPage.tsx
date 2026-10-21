import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  Lock,
  Mail,
  HeartPulse,
  ArrowRight,
  AlertCircle,
  User,
  Stethoscope,
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, demoLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleParam === 'doctor') {
      setEmail((prev) => prev || '');
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      // Auth state will update, let's redirect to user dashboard
      const savedUser = JSON.parse(localStorage.getItem('carequeue_user') || '{}');
      if (savedUser.role === 'doctor') navigate('/doctor/dashboard');
      else if (savedUser.role === 'admin') navigate('/admin/dashboard');
      else navigate('/patient/dashboard');
    } else {
      setError(result.message || 'Login failed.');
    }
  };

  const handleQuickFill = (role: 'patient' | 'doctor' | 'admin') => {
    const creds = {
      patient: { e: 'patient@hospital.com', p: 'patient123' },
      doctor: { e: 'doctor@hospital.com', p: 'doctor123' },
      admin: { e: 'admin@hospital.com', p: 'admin123' },
    };
    setEmail(creds[role].e);
    setPassword(creds[role].p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <HeartPulse className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Hospital Portal Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to manage appointments and live queues
            </p>
            {roleParam === 'doctor' && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-1.5 font-medium animate-fade-in">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Doctor Clinical Login &bull; Sign in with your registered email</span>
              </div>
            )}
          </div>

          {/* 1-Click Fast Fill for Demonstration */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-2">
              Quick 1-Click Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('patient')}
                className="py-1.5 px-2 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <User className="w-3 h-3 text-sky-500" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doctor')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Stethoscope className="w-3 h-3 text-emerald-500" />
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-1.5 px-2 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Shield className="w-3 h-3 text-indigo-500" />
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Need a hospital account?</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
              <Link
                to="/register"
                className="w-full sm:w-auto flex-1 text-center font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl border border-blue-200/60 transition flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Patient Registration</span>
              </Link>
              <Link
                to="/doctor/register"
                className="w-full sm:w-auto flex-1 text-center font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-2 rounded-xl border border-emerald-200/60 transition flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doctor Registration</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
