import { Response } from 'express';
import { db } from '../services/dbStore.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getMyNotifications = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const userNotifs = db.notifications
    .filter((n) => n.userId === req.user?._id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  res.json({
    success: true,
    unreadCount,
    totalCount: userNotifs.length,
    notifications: userNotifs,
  });
};

export const markAsRead = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const notif = db.notifications.find((n) => n._id === id && n.userId === req.user?._id);

  if (!notif) {
    res.status(404).json({ success: false, message: 'Notification not found.' });
    return;
  }

  notif.read = true;
  res.json({ success: true, message: 'Notification marked as read.', notification: notif });
};

export const markAllAsRead = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  db.notifications.forEach((n) => {
    if (n.userId === req.user?._id) {
      n.read = true;
    }
  });

  res.json({ success: true, message: 'All notifications marked as read.' });
};
