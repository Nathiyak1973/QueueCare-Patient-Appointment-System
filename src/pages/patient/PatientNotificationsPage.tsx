import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  CalendarCheck,
  Loader2,
} from 'lucide-react';

export const PatientNotificationsPage: React.FC = () => {
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>Notification Center</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Important clinical alerts, queue calling chimes, and booking confirmations.
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">Inbox is Clear</h3>
            <p className="text-xs text-slate-500 mt-1">You have no unread or recent notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const iconMap = {
                alert: <Bell className="w-5 h-5 text-amber-500" />,
                success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                warning: <AlertTriangle className="w-5 h-5 text-rose-500" />,
                info: <Info className="w-5 h-5 text-blue-500" />,
              };

              return (
                <div
                  key={notif._id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    notif.read
                      ? 'bg-white border-slate-200/80'
                      : 'bg-blue-50/60 border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs shrink-0 mt-0.5">
                      {iconMap[notif.type as keyof typeof iconMap] || iconMap.info}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      onClick={() => markSingleRead(notif._id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100/50 rounded-lg shrink-0 transition"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
