import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Award, Calendar, FileText, CheckCircle2, Megaphone, User, Download, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const username = user?.username?.toUpperCase() || 'CS2001';

  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      try {
        const r = await api.get('/api/student-portal/profile');
        return r.data.data;
      } catch {
        return null;
      }
    },
  });

  const studentName = profile?.name || `Student ${username}`;
  const is3rdYear = username.startsWith('CS30');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-surface-900 border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full uppercase tracking-wider mb-2 inline-block border border-cyan-500/30">
            Prathyusha Engineering College
          </span>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {studentName}</h1>
          <p className="text-gray-400 text-sm font-mono">
            Register No: <span className="text-cyan-400 font-bold">{username}</span> · B.E. Cybersecurity · Year {is3rdYear ? 3 : 2} (Sem {is3rdYear ? 5 : 3})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/student/reports"
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            Download PROS Report
          </Link>
          <Link
            to="/student/profile"
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <User className="w-4 h-4" />
            My Profile
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Enrolled Subjects</span>
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">6</div>
          <div className="text-xs text-cyan-400 mt-1">B.E. Cybersecurity</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Overall Attendance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">88.5%</div>
          <div className="text-xs text-emerald-400 mt-1">Eligible for Exams</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">PROS Report Status</span>
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">READY</div>
          <div className="text-xs text-gray-400 mt-1">3 Reports Available</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Academic Status</span>
            <User className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">GOOD STANDING</div>
          <div className="text-xs text-gray-500 mt-1">0 Pending Disciplinary</div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Marks Summary */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Recent Exam Performance
            </h2>
            <Link to="/student/marks" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { code: 'CS201', name: 'Network Security', exam: 'IAT-1 Assessment', marks: '45 / 50', grade: 'O', status: 'PASS' },
              { code: 'CS102', name: 'Programming in C', exam: 'IAT-1 Assessment', marks: '42 / 50', grade: 'A+', status: 'PASS' },
              { code: 'CS301', name: 'Web Application Security', exam: 'IAT-1 Assessment', marks: '48 / 50', grade: 'O', status: 'PASS' },
            ].map((m, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <div className="text-sm font-medium text-white">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.code} · {m.exam}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-400">{m.marks}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{m.grade} (PASS)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links & Department Notices */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" />
            Department Highlights & Events
          </h2>

          <div className="space-y-3">
            <Link to="/student/events" className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between block transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Calendar className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-white">National Cyber Security Hackathon 2025</div>
                  <p className="text-xs text-gray-400">24-Hour CTF Challenge · Register Now</p>
                </div>
              </div>
              <span className="text-xs text-cyan-400">Join →</span>
            </Link>

            <Link to="/student/announcements" className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between block transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Megaphone className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-white">IAT-1 Examination Timetable</div>
                  <p className="text-xs text-gray-400">Official circular for Sem 3 & Sem 5</p>
                </div>
              </div>
              <span className="text-xs text-cyan-400">Read →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
