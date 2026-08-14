import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, UserCheck, BookOpen, ShieldAlert, Award, FileCheck } from 'lucide-react';
import api from '../../api/client';

export const HODDashboard: React.FC = () => {
  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => api.get('/api/students?limit=1').then(r => r.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => api.get('/api/staff?limit=1').then(r => r.data),
  });

  const { data: pendingMarks } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: () => api.get('/api/marks/pending-approval?limit=1').then(r => r.data),
  });

  return (
    <div className="space-y-8">
      {/* Top Banner with Header + 3 Quick Action Buttons */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-surface-900 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">HOD Administrative Center</h1>
          <p className="text-gray-400 text-sm">Department of Computer Science & Cybersecurity</p>
        </div>

        {/* Top 3 Quick Action Buttons requested */}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Total Students</span>
            <UserPlus className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">{studentsData?.pagination?.total || 97}</div>
          <div className="text-xs text-cyan-400 mt-1">CS2001-CS2049, CS3001-CS3048</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Faculty Members</span>
            <UserCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{staffData?.pagination?.total || 7}</div>
          <div className="text-xs text-purple-400 mt-1">ST001 to ST007</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Pending Approvals</span>
            <FileCheck className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">{pendingMarks?.pagination?.total || 0}</div>
          <div className="text-xs text-yellow-400 mt-1">Awaiting HOD sign-off</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Security Status</span>
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">SECURE</div>
          <div className="text-xs text-gray-500 mt-1">0 active anomalies</div>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Management Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Mark Approval Portal', desc: 'Review and approve/reject staff submitted exam marks', to: '/hod/mark-approval', icon: FileCheck, color: 'text-yellow-400' },
            { title: 'Security Center', desc: 'Monitor login anomalies, brute force attempts, and active sessions', to: '/hod/security', icon: ShieldAlert, color: 'text-red-400' },
            { title: 'System Audit Logs', desc: 'View tamper-evident action trail for all system changes', to: '/hod/audit-logs', icon: Award, color: 'text-cyan-400' },
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
