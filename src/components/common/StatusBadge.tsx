import React from 'react';
import { AppointmentStatus } from '../../types/index.ts';

interface StatusBadgeProps {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'In Consultation':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'Waiting':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'No-show':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'Pending':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${getStyles()} ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};
