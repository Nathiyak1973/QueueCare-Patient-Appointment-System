import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { QueueProvider } from './context/QueueContext.tsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.tsx';

// Public Pages
import { HomePage } from './pages/public/HomePage.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { DoctorDirectoryPage } from './pages/public/DoctorDirectoryPage.tsx';
import { LoginPage } from './pages/public/LoginPage.tsx';
import { RegisterPage } from './pages/public/RegisterPage.tsx';
import { DoctorRegisterPage } from './pages/public/DoctorRegisterPage.tsx';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard.tsx';
import { BookAppointmentPage } from './pages/patient/BookAppointmentPage.tsx';
import { MyAppointmentsPage } from './pages/patient/MyAppointmentsPage.tsx';
import { LiveQueueTrackerPage } from './pages/patient/LiveQueueTrackerPage.tsx';
import { PatientProfilePage } from './pages/patient/PatientProfilePage.tsx';
import { PatientNotificationsPage } from './pages/patient/PatientNotificationsPage.tsx';
import { PaymentHistoryPage } from './pages/patient/PaymentHistoryPage.tsx';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.tsx';
import { DoctorQueueConsole } from './pages/doctor/DoctorQueueConsole.tsx';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage.tsx';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { DoctorManagementPage } from './pages/admin/DoctorManagementPage.tsx';
import { PatientManagementPage } from './pages/admin/PatientManagementPage.tsx';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage.tsx';
import { AppointmentManagementPage } from './pages/admin/AppointmentManagementPage.tsx';
import { QueueMonitorPage } from './pages/admin/QueueMonitorPage.tsx';
import { AuditLogsPage } from './pages/admin/AuditLogsPage.tsx';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage.tsx';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <QueueProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/doctors" element={<DoctorDirectoryPage />} />
            <Route path="/queue-monitor" element={<QueueMonitorPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/doctor/register" element={<DoctorRegisterPage />} />
            <Route path="/register/doctor" element={<DoctorRegisterPage />} />
            <Route path="/doctor-register" element={<DoctorRegisterPage />} />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <MyAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/live-queue"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <LiveQueueTrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/notifications"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientNotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/payments"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PaymentHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorQueueConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorSchedulePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DoctorManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PatientManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DepartmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppointmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue-monitor"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <QueueMonitorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPaymentsPage />
                </ProtectedRoute>
              }
            />

            {/* Wildcard redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QueueProvider>
      </AuthProvider>
    </Router>
  );
}
