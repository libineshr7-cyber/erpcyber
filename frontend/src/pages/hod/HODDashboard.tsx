import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, UserCheck, BookOpen, ShieldAlert, Award, FileCheck, Calendar, Megaphone } from 'lucide-react';
import api from '../../api/client';

// Base Roster Counts for Department of Computer Science & Cybersecurity
const SEEDED_STUDENT_COUNT = 97;

const DEFAULT_STAFF = [
  { staff_id: 'st_1', employee_id: 'ST001' },
  { staff_id: 'st_2', employee_id: 'ST002' },
  { staff_id: 'st_3', employee_id: 'ST003' },
  { staff_id: 'st_4', employee_id: 'ST004' },
  { staff_id: 'st_5', employee_id: 'ST005' },
  { staff_id: 'st_6', employee_id: 'ST006' },
  { staff_id: 'st_7', employee_id: 'ST007' },
];

const DEFAULT_SUBJECTS = [
  { subject_id: 'sub_1', subject_code: 'CS101' },
  { subject_id: 'sub_2', subject_code: 'CS102' },
  { subject_id: 'sub_3', subject_code: 'CS201' },
  { subject_id: 'sub_4', subject_code: 'CS202' },
  { subject_id: 'sub_5', subject_code: 'CS301' },
  { subject_id: 'sub_6', subject_code: 'CS302' },
  { subject_id: 'sub_7', subject_code: 'CS401' },
  { subject_id: 'sub_8', subject_code: 'CS402' },
];

const DEFAULT_EXAMS = [
  { exam_id: 'ex_1', exam_code: 'IAT1' },
  { exam_id: 'ex_2', exam_code: 'IAT2' },
  { exam_id: 'ex_3', exam_code: 'MDL1' },
  { exam_id: 'ex_4', exam_code: 'SEM1' },
];

export const HODDashboard: React.FC = () => {
  const [studentCount, setStudentCount] = useState(97);
  const [staffCount, setStaffCount] = useState(7);
  const [subjectCount, setSubjectCount] = useState(8);
  const [examCount, setExamCount] = useState(4);
  const [eventCount, setEventCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);

  // Real-time counter syncer calculating exact active items
  const syncRealtimeCounts = () => {
    try {
      // 1. Students
      const deletedStudents = new Set(JSON.parse(localStorage.getItem('erp_deleted_students') || '[]'));
      const customStudents = JSON.parse(localStorage.getItem('erp_custom_students') || '[]');
      const activeStudentsCount = Math.max(0, SEEDED_STUDENT_COUNT + customStudents.length - deletedStudents.size);
      setStudentCount(activeStudentsCount);

      // 2. Staff
      const deletedStaff = new Set(JSON.parse(localStorage.getItem('erp_deleted_staff') || '[]'));
      const customStaff = JSON.parse(localStorage.getItem('erp_custom_staff') || '[]');
      const rawStaff = [...DEFAULT_STAFF, ...customStaff];
      const activeStaffList = rawStaff.filter(s => !deletedStaff.has(s.staff_id) && !deletedStaff.has(s.employee_id));
      setStaffCount(activeStaffList.length);

      // 3. Subjects
      const deletedSubjects = new Set(JSON.parse(localStorage.getItem('erp_deleted_subjects') || '[]'));
      const customSubjects = JSON.parse(localStorage.getItem('erp_custom_subjects') || '[]');
      const rawSubjects = [...DEFAULT_SUBJECTS, ...customSubjects];
      const activeSubjectsList = rawSubjects.filter(s => !deletedSubjects.has(s.subject_id) && !deletedSubjects.has(s.subject_code));
      setSubjectCount(activeSubjectsList.length);

      // 4. Exams
      const deletedExams = new Set(JSON.parse(localStorage.getItem('erp_deleted_exams') || '[]'));
      const customExams = JSON.parse(localStorage.getItem('erp_custom_exams') || '[]');
      const rawExams = [...DEFAULT_EXAMS, ...customExams];
      const activeExamsList = rawExams.filter(e => !deletedExams.has(e.exam_id) && !deletedExams.has(e.exam_code));
      setExamCount(activeExamsList.length);

      // 5. Events
      const deletedEvents = new Set(JSON.parse(localStorage.getItem('erp_deleted_events') || '[]'));
      const customEvents = JSON.parse(localStorage.getItem('erp_custom_events') || '[]');
      const activeEventsList = customEvents.filter((e: any) => !deletedEvents.has(e.event_id) && !deletedEvents.has(e.title));
      setEventCount(activeEventsList.length);

      // 6. Announcements
      const deletedAnnouncements = new Set(JSON.parse(localStorage.getItem('erp_deleted_announcements') || '[]'));
      const customAnnouncements = JSON.parse(localStorage.getItem('erp_custom_announcements') || '[]');
      const activeAnnouncementsList = customAnnouncements.filter((a: any) => !deletedAnnouncements.has(a.announcement_id) && !deletedAnnouncements.has(a.title));
      setAnnouncementCount(activeAnnouncementsList.length);
    } catch {}
  };

  useEffect(() => {
    syncRealtimeCounts();
    const interval = setInterval(syncRealtimeCounts, 1000); // Live poll every 1s
    return () => clearInterval(interval);
  }, []);

  const { data: pendingMarks } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: () => api.get('/api/marks/pending-approval?limit=1').then(r => r.data).catch(() => null),
  });

  return (
    <div className="space-y-8">
      {/* Top Banner with Header + Quick Action Buttons */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-surface-900 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">HOD Administrative Center</h1>
          <p className="text-gray-400 text-sm">Department of Computer Science & Cybersecurity (Real-time Live Sync)</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            to="/hod/students"
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20"
          >
            <UserPlus className="w-4 h-4" />
            + Add Student
          </Link>

          <Link
            to="/hod/staff"
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-none shadow-lg shadow-purple-500/20"
          >
            <UserCheck className="w-4 h-4" />
            + Add Staff
          </Link>

          <Link
            to="/hod/subjects"
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4 hover:border-cyan-500/30"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            + Add Subject
          </Link>
        </div>
      </div>

      {/* Real-time Live Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/hod/students" className="glass-card p-6 rounded-2xl hover:border-cyan-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Total Active Students</span>
            <UserPlus className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{studentCount}</div>
          <div className="text-xs text-cyan-400 mt-1 font-semibold">Live Real-Time Roster</div>
        </Link>

        <Link to="/hod/staff" className="glass-card p-6 rounded-2xl hover:border-purple-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Faculty Members</span>
            <UserCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{staffCount}</div>
          <div className="text-xs text-purple-400 mt-1 font-semibold">Live Active Faculty</div>
        </Link>

        <Link to="/hod/subjects" className="glass-card p-6 rounded-2xl hover:border-cyan-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Curriculum Subjects</span>
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{subjectCount}</div>
          <div className="text-xs text-cyan-300 mt-1 font-semibold">1st - 4th Year Courses</div>
        </Link>

        <Link to="/hod/exams" className="glass-card p-6 rounded-2xl hover:border-yellow-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Scheduled Exams</span>
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{examCount}</div>
          <div className="text-xs text-yellow-400 mt-1 font-semibold">IAT & Semester Exams</div>
        </Link>

        <Link to="/hod/events" className="glass-card p-6 rounded-2xl hover:border-purple-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Department Events</span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{eventCount}</div>
          <div className="text-xs text-purple-300 mt-1 font-semibold">Hackathons & Workshops</div>
        </Link>

        <Link to="/hod/announcements" className="glass-card p-6 rounded-2xl hover:border-cyan-500/30 transition-all block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Official Circulars</span>
            <Megaphone className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{announcementCount}</div>
          <div className="text-xs text-cyan-300 mt-1 font-semibold">Active Announcements</div>
        </Link>
      </div>

      {/* Quick Navigation Panel */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Management & Real-time Audit Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Mark Approval Portal', desc: 'Review staff submitted marks and send WhatsApp updates to parents', to: '/hod/mark-approval', icon: FileCheck, color: 'text-yellow-400' },
            { title: 'Security Center', desc: 'Monitor active user sessions, threat anomalies, and login logs in real time', to: '/hod/security', icon: ShieldAlert, color: 'text-red-400' },
            { title: 'System Audit Logs', desc: 'Live tamper-evident trail for all student, staff, subject, exam, and event changes', to: '/hod/audit-logs', icon: Award, color: 'text-cyan-400' },
          ].map(m => {
            const Icon = m.icon;
            return (
              <Link key={m.title} to={m.to} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 space-y-2 block">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Icon className={`w-5 h-5 ${m.color}`} />
                  {m.title}
                </div>
                <p className="text-xs text-gray-400">{m.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
