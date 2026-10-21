import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Activity,
  User,
  Bell,
  Stethoscope,
  Users,
  Building2,
  ListOrdered,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  CreditCard,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
    { to: '/patient/appointments', label: 'My Appointments', icon: CalendarDays },
    { to: '/patient/payments', label: 'Payment History', icon: CreditCard },
    { to: '/patient/live-queue', label: 'Live Queue Tracker', icon: Activity },
    { to: '/patient/notifications', label: 'Notifications', icon: Bell },
    { to: '/patient/profile', label: 'My Health Profile', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/doctor/queue', label: 'Queue Calling Console', icon: Activity },
    { to: '/doctor/appointments', label: "Today's Patients", icon: CalendarDays },
    { to: '/doctor/schedule', label: 'Schedule & Timings', icon: Clock },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Analytics & KPIs', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Doctor Management', icon: Stethoscope },
    { to: '/admin/patients', label: 'Patient Directory', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/appointments', label: 'All Appointments', icon: FileSpreadsheet },
    { to: '/admin/payments', label: 'Payments & Revenue', icon: CreditCard },
    { to: '/admin/queue-monitor', label: 'Queue Live Monitor', icon: ListOrdered },
    { to: '/admin/audit-logs', label: 'System Audit Logs', icon: ShieldCheck },
  ];

  const links =
    user.role === 'patient'
      ? patientLinks
      : user.role === 'doctor'
      ? doctorLinks
      : adminLinks;

  const roleLabels = {
    patient: { title: 'Patient Portal', color: 'text-sky-600', bg: 'bg-sky-50' },
    doctor: { title: 'Doctor Console', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    admin: { title: 'Administration', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  };

  const roleInfo = roleLabels[user.role];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden lg:flex flex-col min-h-[calc(100vh-6.5rem)]">
      {/* Role Header */}
      <div className="p-4 border-b border-slate-100">
        <div className={`px-3 py-2 rounded-xl ${roleInfo.bg} border border-slate-200/50`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Workspace</p>
          <p className={`text-sm font-black ${roleInfo.color}`}>{roleInfo.title}</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
