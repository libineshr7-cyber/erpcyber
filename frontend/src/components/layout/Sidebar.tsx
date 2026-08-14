import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const links = user?.role === 'HOD' ? [
    { to: '/hod', label: 'Dashboard' },
    { to: '/hod/students', label: 'Students' },
    { to: '/hod/staff', label: 'Staff' },
    { to: '/hod/marks', label: 'Mark Approvals' },
  ] : user?.role === 'STAFF' ? [
    { to: '/staff', label: 'Dashboard' },
    { to: '/staff/marks', label: 'Mark Entry' },
    { to: '/staff/whatsapp', label: 'WhatsApp' },
  ] : [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/marks', label: 'My Marks' },
  ];

  return (
    <div className="flex flex-col gap-2 mt-4">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
          )}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
};
