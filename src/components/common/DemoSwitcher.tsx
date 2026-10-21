import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Shield, Stethoscope, User, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoSwitcher: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (role: 'patient' | 'doctor' | 'admin') => {
    await demoLogin(role);
    if (role === 'patient') navigate('/patient/dashboard');
    else if (role === 'doctor') navigate('/doctor/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  return (
    <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner z-50">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
          Test Account Switcher:
        </span>
        {user ? (
          <span className="bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 border border-slate-700">
            Active: <strong className="text-white capitalize">{user.role}</strong> ({user.name.split(',')[0]})
          </span>
        ) : (
          <span className="text-slate-400">Visitor Mode</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleSwitch('patient')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
            user?.role === 'patient'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <User className="w-3 h-3 text-sky-300" />
          Patient (Sarah)
        </button>

        <button
          onClick={() => handleSwitch('doctor')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
            user?.role === 'doctor'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Stethoscope className="w-3 h-3 text-emerald-300" />
          Doctor (Dr. Vance)
        </button>

        <button
          onClick={() => handleSwitch('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
            user?.role === 'admin'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Shield className="w-3 h-3 text-indigo-300" />
          Admin (Evans)
        </button>
      </div>
    </div>
  );
};
