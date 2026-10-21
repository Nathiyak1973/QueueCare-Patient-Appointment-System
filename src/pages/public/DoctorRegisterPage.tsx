import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  Stethoscope,
  Award,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';

export const DoctorRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    specialty: '',
    qualification: '',
    experienceYears: '',
    hospitalName: '',
    email: '',
    phone: '',
    consultationFee: '100',
    departmentId: '',
    roomNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  // Auto redirect to doctor login after successful registration
  useEffect(() => {
    let timer: any;
    if (registeredSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login?role=doctor');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [registeredSuccess, navigate]);

  // Load existing departments for the selection dropdown
  useEffect(() => {
    api.get('/admin/departments')
      .then((res) => {
        if (res.data.success && res.data.departments?.length > 0) {
          setDepartments(res.data.departments);
          setFormData((prev) => ({
            ...prev,
            departmentId: prev.departmentId || res.data.departments[0]._id,
            specialty: prev.specialty || res.data.departments[0].name,
          }));
        }
      })
      .catch((err) => console.warn('Could not fetch departments:', err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If department selected, prefill specialty if empty
      if (name === 'departmentId') {
        const foundDept = departments.find((d) => d._id === value);
        if (foundDept && !prev.specialty) {
          updated.specialty = foundDept.name;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!formData.name.trim()) {
      setError('Please provide your full doctor name.');
      return;
    }

    if (!formData.registrationNumber.trim() || formData.registrationNumber.trim().length < 3) {
      setError('Please provide a valid Medical Registration Number (minimum 3 characters).');
      return;
    }

    if (!formData.specialty.trim()) {
      setError('Please specify your medical specialization.');
      return;
    }

    if (!formData.qualification.trim()) {
      setError('Please provide your medical qualifications (e.g. MBBS, MD, MS).');
      return;
    }

    if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
      setError('Please enter valid years of medical experience.');
      return;
    }

    if (!formData.hospitalName.trim()) {
      setError('Please provide your Hospital or Clinic name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setError('Please provide a valid mobile number.');
      return;
    }

    if (formData.consultationFee === '' || Number(formData.consultationFee) < 0) {
      setError('Please provide a valid consultation fee.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await registerDoctor({
        name: formData.name.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        specialty: formData.specialty.trim(),
        qualification: formData.qualification.trim(),
        experienceYears: Number(formData.experienceYears),
        hospitalName: formData.hospitalName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        consultationFee: Number(formData.consultationFee),
        departmentId: formData.departmentId,
        roomNumber: formData.roomNumber.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (res.success) {
        setRegisteredSuccess(true);
        setSuccessMessage(
          res.message ||
            'Doctor registration completed successfully! Your profile has been created in the hospital directory.'
        );
      } else {
        setError(res.message || 'Doctor registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during doctor registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Doctor Registration Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Join the QueueCare clinical roster. Register your medical practice, set up consultation hours, and manage patient queues.
            </p>

            {/* Quick role toggle banner */}
            <div className="mt-4 inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
              <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg shadow-xs">
                Doctor Registration
              </span>
              <Link
                to="/register"
                className="px-3 py-1 text-slate-600 hover:text-blue-600 font-semibold rounded-lg transition"
              >
                Patient Registration &rarr;
              </Link>
            </div>
          </div>

          {/* Success State */}
          {registeredSuccess ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-8 text-center animate-fade-in space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Registration Confirmed!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {successMessage}
              </p>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200/60 max-w-sm mx-auto text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor Name:</span>
                  <strong className="text-slate-900">{formData.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Medical Reg No:</span>
                  <strong className="font-mono text-emerald-700">{formData.registrationNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specialization:</span>
                  <span className="text-slate-800 font-medium">{formData.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Login Email:</span>
                  <span className="text-slate-800 font-medium">{formData.email}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login?role=doctor')}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Doctor Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 font-medium">
                Auto-redirecting to Doctor Sign In in <span className="font-bold underline">{countdown}s</span>...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Professional Identification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 pb-1 border-b border-slate-100">
                  <Award className="w-4 h-4" />
                  <span>1. Medical Credentials &amp; Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name (e.g. Dr. Jane Smith) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Dr. John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Medical Registration Number *
                    </label>
                    <div className="relative">
                      <FileCheck2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="registrationNumber"
                        required
                        placeholder="e.g. MED-REG-84729"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Medical Specialization *
                    </label>
                    <div className="relative">
                      <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="specialty"
                        required
                        placeholder="e.g. Interventional Cardiology, Pediatrician"
                        value={formData.specialty}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Clinical Department
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Qualification *
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      required
                      placeholder="e.g. MBBS, MD (Cardiology), FACC"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      max="60"
                      required
                      placeholder="e.g. 12"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Practice & Contact */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 pb-1 border-b border-slate-100">
                  <Building2 className="w-4 h-4" />
                  <span>2. Hospital Practice &amp; Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hospital or Clinic Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="hospitalName"
                        required
                        placeholder="e.g. City General Hospital, Mayo Clinic"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Consultation Fee ($ USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        name="consultationFee"
                        min="0"
                        required
                        placeholder="100"
                        value={formData.consultationFee}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (Login Username) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="doctor@hospital.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+1 (555) 012-4433"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Room / Suite Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    placeholder="e.g. Suite 302, OPD Wing B"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 3: Account Security */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 pb-1 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Account Security</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials &amp; Registering...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Doctor Registration</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              Already have a doctor account?{' '}
              <Link to="/login?role=doctor" className="font-bold text-emerald-600 hover:underline">
                Doctor Sign In
              </Link>
            </div>
            <div>
              Are you a patient?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">
                Patient Registration
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
