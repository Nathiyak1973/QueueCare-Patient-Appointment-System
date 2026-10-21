import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  HeartPulse,
  Bell,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  Activity,
  User,
  LayoutDashboard,
  Clock,
  Stethoscope,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'doctor') return '/doctor/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/patient/dashboard';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:bg-blue-700 transition shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1">
                Care<span className="text-blue-600">Queue</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">
                Hospital Queue System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg transition ${
                isActive('/') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/doctors"
              className={`px-3 py-2 rounded-lg transition ${
                isActive('/doctors') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Doctors &amp; Slots
            </Link>
            <Link
              to="/queue-monitor"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                isActive('/queue-monitor') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Hospital Board
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-lg transition ${
                isActive('/about') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              System Guide
            </Link>
          </nav>

          {/* Right Side: Auth / Dashboard / Notifs */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={user.role === 'patient' ? '/patient/notifications' : getDashboardPath()}
                  className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-900 border border-blue-200/60 rounded-xl text-sm font-semibold transition shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">
                    {user.role === 'patient'
                      ? 'My Dashboard'
                      : user.role === 'doctor'
                      ? 'Doctor Console'
                      : 'Admin Portal'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/doctor/register"
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  title="Doctor Registration"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Doctor Registration</span>
                  <span className="sm:hidden">Doctor</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Appointment</span>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Doctors &amp; Availability
          </Link>
          <Link
            to="/queue-monitor"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-emerald-700 rounded-lg hover:bg-emerald-50"
          >
            Live Hospital Board
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
          >
            System Guide &amp; Architecture
          </Link>
          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Dashboard Portal
            </Link>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-blue-700 rounded-lg bg-blue-50"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Patient Registration</span>
              </Link>
              <Link
                to="/doctor/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-emerald-700 rounded-lg bg-emerald-50"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Registration</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
