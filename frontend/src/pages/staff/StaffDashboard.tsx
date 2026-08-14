import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileCheck, AlertCircle, TrendingUp, Clock, Plus, Award } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className="glass-card p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{title}</div>
    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
  </div>
);

export const StaffDashboard: React.FC = () => {
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);

  // Form states for Course
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [credits, setCredits] = useState('3');
  const [semesterNumber, setSemesterNumber] = useState('3');

  // Form states for Exam
  const [examName, setExamName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [maximumMarks, setMaximumMarks] = useState('50');
  const [passingMarks, setPassingMarks] = useState('25');

  const qc = useQueryClient();

  const { data: assignmentsData } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: () => api.get('/api/staff/me/assignments').then(r => r.data.data),
  });

  const { data: pendingMarks } = useQuery({
    queryKey: ['marks-pending'],
    queryFn: () => api.get('/api/marks?status=DRAFT&limit=5').then(r => r.data),
  });

  const createCourseMutation = useMutation({
    mutationFn: () => api.post('/api/subjects', {
      subjectCode,
      subjectName,
      subjectType,
      credits: Number(credits),
      semesterNumber: Number(semesterNumber),
      yearOfStudy: Math.ceil(Number(semesterNumber) / 2),
      maximumMarks: 100,
      passingMarks: 50,
    }),
    onSuccess: () => {
      toast.success(`Course/Subject ${subjectCode} created successfully!`);
      setIsAddCourseModalOpen(false);
      setSubjectCode('');
      setSubjectName('');
      qc.invalidateQueries({ queryKey: ['staff-assignments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create course'),
  });

  const createExamMutation = useMutation({
    mutationFn: () => api.post('/api/exams', {
      examName,
      examCode,
      maximumMarks: Number(maximumMarks),
      passingMarks: Number(passingMarks),
    }),
    onSuccess: () => {
      toast.success(`Exam ${examName} created successfully!`);
      setIsAddExamModalOpen(false);
      setExamName('');
      setExamCode('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create exam'),
  });

  const quickActions = [
    { label: 'Enter Marks', to: '/staff/mark-entry', icon: '📝', comingSoon: false },
    { label: 'Take Attendance', to: '/staff/attendance', icon: '📋', comingSoon: true },
    { label: 'Generate Report', to: '/staff/reports', icon: '📄', comingSoon: false },
    { label: 'Send via WhatsApp', to: '/staff/whatsapp', icon: '💬', comingSoon: false },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with Action Buttons */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-surface-900 border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Faculty Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage courses, schedule exams, enter marks, and generate official PROS reports</p>
        </div>

        {/* Buttons to Create Course and Create Exam */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20"
          >
            <BookOpen className="w-4 h-4" />
            + Create Course
          </button>

          <button
            onClick={() => setIsAddExamModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-none shadow-lg shadow-purple-500/20"
          >
            <Award className="w-4 h-4" />
            + Create Exam
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Subjects"
          value={assignmentsData?.length || 6}
          icon={<BookOpen className="w-6 h-6 text-cyan-400" />}
          color="bg-cyan-500/10"
        />
        <StatCard
          title="Pending Mark Entry"
          value={pendingMarks?.pagination?.total || 0}
          icon={<FileCheck className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500/10"
          subtitle="Awaiting submission"
        />
        <StatCard
          title="Submitted for Approval"
          value="—"
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
          color="bg-yellow-500/10"
        />
        <StatCard
          title="Reports Generated"
          value="—"
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          color="bg-green-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            My Assigned Subjects
          </h2>
          {!assignmentsData?.length ? (
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div><div className="text-sm font-medium text-white">Programming in C</div><div className="text-xs text-gray-400">CS102 · Section A · Sem 1</div></div>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">2025-2026</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div><div className="text-sm font-medium text-white">Network Security</div><div className="text-xs text-gray-400">CS201 · Section A · Sem 3</div></div>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">2025-2026</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {assignmentsData.map((a: Record<string, string>) => (
                <div key={a.assignment_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">{a.subject_name}</div>
                    <div className="text-xs text-gray-400">{a.subject_code} · Section {a.section_name} · Sem {a.semester}</div>
                  </div>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">{a.academic_year}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              a.comingSoon ? (
                <button
                  key={a.label}
                  onClick={() => toast.success('Take Attendance module — Coming Soon!')}
                  className="relative flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-center group cursor-pointer"
                >
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                  <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{a.icon}</span>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{a.label}</span>
                </button>
              ) : (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 rounded-xl transition-all border border-white/5 text-center group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-xs text-gray-300 group-hover:text-cyan-400 transition-colors">{a.label}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Create New Course / Subject
            </h2>

            <form onSubmit={ev => { ev.preventDefault(); createCourseMutation.mutate(); }} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={ev => setSubjectCode(ev.target.value.toUpperCase())}
                    placeholder="CS202"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Type</label>
                  <select value={subjectType} onChange={ev => setSubjectType(ev.target.value)} className="input-field">
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={ev => setSubjectName(ev.target.value)}
                  placeholder="Cryptography & Network Security"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={ev => setCredits(ev.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Semester</label>
                  <select value={semesterNumber} onChange={ev => setSemesterNumber(ev.target.value)} className="input-field">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button type="button" onClick={() => setIsAddCourseModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={createCourseMutation.isPending} className="btn-primary text-xs">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-purple-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Create New Examination
            </h2>

            <form onSubmit={ev => { ev.preventDefault(); createExamMutation.mutate(); }} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Exam Title (e.g. IAT-1 / Model Exam)</label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={ev => setExamName(ev.target.value)}
                  placeholder="IAT-1 Assessment"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Exam Code</label>
                  <input
                    type="text"
                    value={examCode}
                    onChange={ev => setExamCode(ev.target.value.toUpperCase())}
                    placeholder="IAT1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maximumMarks}
                    onChange={ev => setMaximumMarks(ev.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button type="button" onClick={() => setIsAddExamModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={createExamMutation.isPending} className="btn-primary text-xs">Create Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
