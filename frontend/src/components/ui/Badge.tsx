import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const styles = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    default: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  };

  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[variant])}>
      {children}
    </span>
  );
};
