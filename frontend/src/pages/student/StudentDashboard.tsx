import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Calendar, FileText, CheckCircle2, Megaphone, User } from 'lucide-react';
import api from '../../api/client';

export const StudentDashboard: React.FC = () => {
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/api/student-portal/profile').then(r => r.data.data),
  });

  const { data: marks } = useQuery({
    queryKey: ['student-marks'],
    queryFn: () => api.get('/api/student-portal/marks').then(r => r.data.data || []),
  });

  const { data: attendance } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/api/student-portal/attendance').then(r => r.data.data || []),
  });

  const { data: announcements } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: () => api.get('/api/student-portal/announcements').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-gray-950 border border-cyan-500/20">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {profile?.name || 'Student'}</h1>
        <p className="text-gray-400 text-sm">
          Register Number: <span className="font-mono text-cyan-400">{profile?.register_number}</span> · Batch: {profile?.batch} · Year {profile?.current_year} (Sem {profile?.current_semester})
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Courses Enrolled</span>
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">{marks?.length || 0}</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Overall Attendance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {attendance?.length ? `${Math.round(attendance.reduce((acc: number, curr: any) => acc + Number(curr.attendance_percentage || 0), 0) / attendance.length)}%` : 'N/A'}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Announcements</span>
            <Megaphone className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{announcements?.length || 0}</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Academic Status</span>
            <User className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-xl font-semibold text-emerald-400 mt-1">ACTIVE</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Marks Summary */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Approved Examination Results
          </h2>
          {!marks?.length ? (
            <div className="text-gray-500 py-8 text-center">No approved exam marks available yet.</div>
          ) : (
            <div className="space-y-3">
              {marks.slice(0, 5).map((m: any) => (
                <div key={m.mark_id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-white">{m.subject_name}</div>
                    <div className="text-xs text-gray-400">{m.subject_code} · {m.exam_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">{m.marks_obtained} / {m.maximum_marks}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">{m.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Subject Attendance
          </h2>
          {!attendance?.length ? (
            <div className="text-gray-500 py-8 text-center">No attendance data available yet.</div>
          ) : (
            <div className="space-y-4">
              {attendance.map((a: any) => (
                <div key={a.subject_name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{a.subject_name}</span>
                    <span className={`font-bold ${Number(a.attendance_percentage) >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {a.attendance_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${Number(a.attendance_percentage) >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, Number(a.attendance_percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
