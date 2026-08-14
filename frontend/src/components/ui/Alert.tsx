import React from 'react';
import clsx from 'clsx';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info' }) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
  };

  return (
    <div className={clsx('p-4 rounded-lg border', styles[variant])}>
      {children}
    </div>
  );
};
