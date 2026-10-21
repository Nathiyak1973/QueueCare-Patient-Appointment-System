import React, { ReactNode } from 'react';
import { DemoSwitcher } from './DemoSwitcher.tsx';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { CallAlertModal } from './CallAlertModal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Activity,
  User,
  Clock,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMobileLinks = () => {
    if (!user) return [];
    if (user.role === 'patient') {
      return [
        { to: '/patient/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/patient/book', label: 'Book', icon: CalendarPlus },
        { to: '/patient/appointments', label: 'History', icon: CalendarDays },
        { to: '/patient/live-queue', label: 'Queue', icon: Activity },
        { to: '/patient/profile', label: 'Profile', icon: User },
      ];
    }
    if (user.role === 'doctor') {
      return [
        { to: '/doctor/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/doctor/queue', label: 'Calling', icon: Activity },
        { to: '/doctor/appointments', label: 'Patients', icon: CalendarDays },
        { to: '/doctor/schedule', label: 'Schedule', icon: Clock },
      ];
    }
    return [
      { to: '/admin/dashboard', label: 'KPIs', icon: LayoutDashboard },
      { to: '/admin/doctors', label: 'Doctors', icon: Users },
      { to: '/admin/queue-monitor', label: 'Queues', icon: Activity },
      { to: '/admin/audit-logs', label: 'Audits', icon: ShieldCheck },
    ];
  };

  const mobileLinks = getMobileLinks();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans pb-16 lg:pb-0">
      <DemoSwitcher />
      <Navbar />
      <CallAlertModal />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
                active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
