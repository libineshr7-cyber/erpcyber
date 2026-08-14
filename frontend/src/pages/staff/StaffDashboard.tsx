import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileCheck, AlertCircle, TrendingUp, Clock } from 'lucide-react';
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
  const { data: assignmentsData } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: () => api.get('/api/staff/me/assignments').then(r => r.data.data),
  });

  const { data: pendingMarks } = useQuery({
    queryKey: ['marks-pending'],
    queryFn: () => api.get('/api/marks?status=DRAFT&limit=5').then(r => r.data),
  });

  const quickActions = [
    { label: 'Enter Marks', to: '/staff/mark-entry', icon: '📝', comingSoon: false },
    { label: 'Take Attendance', to: '/staff/attendance', icon: '📋', comingSoon: true },
    { label: 'Generate Report', to: '/staff/reports', icon: '📄', comingSoon: false },
    { label: 'Send via WhatsApp', to: '/staff/whatsapp', icon: '💬', comingSoon: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Staff Dashboard</h1>
        <p className="text-gray-400">Manage your classes, marks, and academic reporting</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Subjects"
          value={assignmentsData?.length || 0}
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
            <div className="flex items-center gap-3 text-gray-500 py-8">
              <AlertCircle className="w-5 h-5" />
              <span>No subjects assigned yet. Contact HOD.</span>
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
    </div>
  );
};
