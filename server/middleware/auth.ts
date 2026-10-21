import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/dbStore.ts';
import { IUser, UserRole } from '../types.ts';

export const JWT_SECRET = process.env.JWT_SECRET || 'hospital_jwt_super_secret_key_2026_secure';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = db.users.find((u) => u._id === decoded.id && u.isActive);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token: User no longer exists or is inactive.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please log in first.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};
