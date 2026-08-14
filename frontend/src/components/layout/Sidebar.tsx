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
    { to: '/student/reports', label: 'My Reports', icon: FileText },
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
    <div className="flex flex-col gap-1 mt-4 px-2">
      <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
        {user?.role || 'Portal'} Navigation
      </div>
      {links.map(link => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/hod' || link.to === '/staff' || link.to === '/student'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-sm'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
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
