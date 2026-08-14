import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ShieldAlert } from 'lucide-react';
import api from '../../api/client';

export const MyMarksPage: React.FC = () => {
  const { data: marks, isLoading } = useQuery({
    queryKey: ['student-marks'],
    queryFn: () => api.get('/api/student-portal/marks').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Academic Marks</h1>
        <p className="text-gray-400">Official, verified, and approved examination marks</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !marks?.length ? (
          <div className="p-12 text-center text-gray-500">No approved examination marks published yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Subject Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Exam</th>
                  <th className="p-4 text-center">Marks Obtained</th>
                  <th className="p-4 text-center">Grade</th>
                  <th className="p-4 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {marks.map((m: any) => (
                  <tr key={m.mark_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-cyan-400 font-semibold">{m.subject_code}</td>
                    <td className="p-4 text-white font-medium">{m.subject_name}</td>
                    <td className="p-4 text-gray-300">{m.exam_name}</td>
                    <td className="p-4 text-center font-bold text-white">
                      {m.is_absent ? <span className="text-amber-400">ABSENT</span> : `${m.marks_obtained} / ${m.maximum_marks}`}
                    </td>
                    <td className="p-4 text-center font-bold text-cyan-400">{m.grade}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${m.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
