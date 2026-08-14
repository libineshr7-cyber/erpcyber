import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, Award, Calendar } from 'lucide-react';
import api from '../../api/client';

export const MyClassesPage: React.FC = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: () => api.get('/api/staff/me/assignments').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Assigned Classes</h1>
        <p className="text-gray-400">Courses and sections assigned to you for current academic sessions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !assignments?.length ? (
        <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">No active class assignments.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((a: any) => (
            <div key={a.assignment_id} className="glass-card p-6 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 font-mono text-xs font-semibold rounded-full">
                  {a.subject_code}
                </span>
                <span className="text-xs text-gray-400">{a.academic_year}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{a.subject_name}</h3>
              <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-4">
                <div className="flex justify-between">
                  <span>Semester</span>
                  <span className="text-white font-medium">Semester {a.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span>Section</span>
                  <span className="text-white font-medium">Section {a.section_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
