import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api.ts';
import { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadCount: number;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
  registerDoctor: (data: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (user: User, newToken?: string) => void;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carequeue_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('carequeue_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('carequeue_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('carequeue_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing local state.');
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user && token) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('carequeue_token', newToken);
        localStorage.setItem('carequeue_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (data: Record<string, any>) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('carequeue_token', newToken);
        localStorage.setItem('carequeue_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check form data.',
      };
    }
  };

  const registerDoctor = async (data: Record<string, any>) => {
    try {
      const res = await api.post('/auth/register-doctor', data);
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Doctor registration failed. Please check your details.',
      };
    }
  };

  const demoLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      patient: { email: 'patient@hospital.com', pass: 'patient123' },
      doctor: { email: 'doctor@hospital.com', pass: 'doctor123' },
      admin: { email: 'admin@hospital.com', pass: 'admin123' },
    };
    const c = creds[role];
    await login(c.email, c.pass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUnreadCount(0);
    localStorage.removeItem('carequeue_token');
    localStorage.removeItem('carequeue_user');
  };

  const updateUser = (updatedUser: User, newToken?: string) => {
    setUser(updatedUser);
    localStorage.setItem('carequeue_user', JSON.stringify(updatedUser));
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('carequeue_token', newToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        unreadCount,
        login,
        register,
        registerDoctor,
        demoLogin,
        logout,
        updateUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
