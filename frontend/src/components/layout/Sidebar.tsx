import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Award,
  Calendar,
  FileCheck,
  Megaphone,
  Shield,
  FileText,
  MessageSquare,
  CheckCircle2,
  ListCheck,
  User,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const hodLinks = [
    { to: '/hod', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hod/students', label: 'Students', icon: Users },
    { to: '/hod/staff', label: 'Staff Roster', icon: UserCheck },
    { to: '/hod/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/hod/exams', label: 'Exams', icon: Award },
    { to: '/hod/academic-years', label: 'Academic Years', icon: Calendar },
    { to: '/hod/mark-approval', label: 'Mark Approval', icon: FileCheck },
    { to: '/hod/whatsapp-parents', label: 'Parent WhatsApp', icon: Smartphone },
    { to: '/hod/events', label: 'Manage Events', icon: Calendar },
    { to: '/hod/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/hod/security', label: 'Security Center', icon: ShieldAlert },
    { to: '/hod/audit-logs', label: 'Audit Logs', icon: Shield },
  ];

  const staffLinks = [
    { to: '/staff', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/mark-entry', label: 'Mark Entry', icon: FileCheck },
    { to: '/staff/attendance', label: 'Attendance', icon: CheckCircle2 },
    { to: '/staff/reports', label: 'PDF Reports', icon: FileText },
    { to: '/staff/whatsapp', label: 'WhatsApp Send', icon: MessageSquare },
    { to: '/staff/my-classes', label: 'My Classes', icon: ListCheck },
  ];

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/marks', label: 'My Marks', icon: Award },
    { to: '/student/attendance', label: 'My Attendance', icon: CheckCircle2 },
    { to: '/student/events', label: 'Events', icon: Calendar },
    { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/student/profile', label: 'My Profile', icon: User },
  ];

  const links = (user?.role === 'HOD' || user?.role === 'SUPER_ADMIN')
    ? hodLinks
    : user?.role === 'STAFF'
    ? staffLinks
    : studentLinks;

  return (
    <div className="flex flex-col gap-1 mt-2 px-3">
      <div className="text-[11px] font-bold tracking-wider text-rose-900 uppercase px-3 mb-2 font-mono">
        {user?.role || 'Portal'} NAVIGATION
      </div>
      {links.map(link => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/hod' || link.to === '/staff' || link.to === '/student'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-rose-900 to-rose-950 text-white shadow-md shadow-rose-900/20'
                : 'text-slate-700 hover:bg-rose-50 hover:text-rose-900'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
