import React, { Suspense } from 'react';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import { AppShell } from '../components/layout/AppShell';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { MFAPage } from '../pages/auth/MFAPage';

// HOD pages
import { HODDashboard } from '../pages/hod/HODDashboard';
import { StudentsPage } from '../pages/hod/StudentsPage';
import { StaffPage } from '../pages/hod/StaffPage';
import { SubjectsPage } from '../pages/hod/SubjectsPage';
import { ExamsPage } from '../pages/hod/ExamsPage';
import { AcademicYearsPage } from '../pages/hod/AcademicYearsPage';
import { MarkApprovalPage } from '../pages/hod/MarkApprovalPage';
import { WhatsAppParentsPage } from '../pages/hod/WhatsAppParentsPage';
import { SecurityCenterPage } from '../pages/hod/SecurityCenterPage';
import { AuditLogsPage } from '../pages/hod/AuditLogsPage';
import { EventsManagePage } from '../pages/hod/EventsManagePage';
import { AnnouncementsPage as HodAnnouncementsPage } from '../pages/hod/AnnouncementsPage';

// Staff pages
import { StaffDashboard } from '../pages/staff/StaffDashboard';
import { MarkEntryPage } from '../pages/staff/MarkEntryPage';
import { AttendancePage } from '../pages/staff/AttendancePage';
import { ReportsPage } from '../pages/staff/ReportsPage';
import { WhatsAppPage } from '../pages/staff/WhatsAppPage';
import { MyClassesPage } from '../pages/staff/MyClassesPage';

// Student pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { MyMarksPage } from '../pages/student/MyMarksPage';
import { MyAttendancePage } from '../pages/student/MyAttendancePage';
import { EventsPage } from '../pages/student/EventsPage';
import { ProfilePage } from '../pages/student/ProfilePage';
import { AnnouncementsPage as StudentAnnouncementsPage } from '../pages/student/AnnouncementsPage';

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingFallback />;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'HOD') return <Navigate to="/hod" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based home redirect
const HomeRedirect: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HOD' || user.role === 'SUPER_ADMIN') return <Navigate to="/hod" replace />;
  if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
};

const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/mfa',
    element: <MFAPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><HomeRedirect /></ProtectedRoute>,
  },

  // ── HOD Routes ──────────────────────────────────────────────────────────────
  {
    path: '/hod',
    element: <ProtectedRoute allowedRoles={['HOD', 'SUPER_ADMIN']}><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <HODDashboard /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'subjects', element: <SubjectsPage /> },
      { path: 'exams', element: <ExamsPage /> },
      { path: 'academic-years', element: <AcademicYearsPage /> },
      { path: 'mark-approval', element: <MarkApprovalPage /> },
      { path: 'whatsapp-parents', element: <WhatsAppParentsPage /> },
      { path: 'events', element: <EventsManagePage /> },
      { path: 'announcements', element: <HodAnnouncementsPage /> },
      { path: 'security', element: <SecurityCenterPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },

  // ── Staff Routes ─────────────────────────────────────────────────────────────
  {
    path: '/staff',
    element: <ProtectedRoute allowedRoles={['STAFF']}><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: 'mark-entry', element: <MarkEntryPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'whatsapp', element: <WhatsAppPage /> },
      { path: 'my-classes', element: <MyClassesPage /> },
    ],
  },

  // ── Student Routes ───────────────────────────────────────────────────────────
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['STUDENT']}><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'marks', element: <MyMarksPage /> },
      { path: 'attendance', element: <MyAttendancePage /> },
      { path: 'reports', element: <Navigate to="/student/marks" replace /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'announcements', element: <StudentAnnouncementsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);

export const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <RouterProvider router={router} />
  </Suspense>
);
