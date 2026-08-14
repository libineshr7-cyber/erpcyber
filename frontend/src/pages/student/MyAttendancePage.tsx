import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../api/client';

export const MyAttendancePage: React.FC = () => {
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/api/student-portal/attendance').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Attendance Summary</h1>
        <p className="text-gray-400">Subject-wise attendance tracking and eligibility status</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !attendance?.length ? (
          <div className="text-center text-gray-500 py-8">No attendance records found.</div>
        ) : (
          <div className="space-y-6">
            {attendance.map((a: any) => {
              const pct = Number(a.attendance_percentage || 0);
              const isEligible = pct >= 75;
              return (
                <div key={a.subject_name} className="p-4 bg-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">{a.subject_name}</h3>
                      <span className="text-xs text-gray-400">{a.subject_code} · {a.present} Present / {a.total_classes} Classes</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>{pct}%</span>
                      <div className="text-xs">
                        {isEligible ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Eligible</span>
                        ) : (
                          <span className="text-amber-400 flex items-center justify-end gap-1"><AlertTriangle className="w-3 h-3" /> Low Attendance</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
