import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Calendar } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_EXAMS = [
  { exam_id: 'ex_1', exam_name: 'IAT-1 Assessment', exam_code: 'IAT1', exam_date: '2025-09-15', maximum_marks: 50, passing_marks: 25, status: 'SCHEDULED' },
  { exam_id: 'ex_2', exam_name: 'IAT-2 Assessment', exam_code: 'IAT2', exam_date: '2025-10-20', maximum_marks: 50, passing_marks: 25, status: 'SCHEDULED' },
  { exam_id: 'ex_3', exam_name: 'Model Examination', exam_code: 'MDL1', exam_date: '2025-11-15', maximum_marks: 100, passing_marks: 50, status: 'SCHEDULED' },
  { exam_id: 'ex_4', exam_name: 'End Semester Exam', exam_code: 'SEM1', exam_date: '2025-12-05', maximum_marks: 100, passing_marks: 50, status: 'SCHEDULED' },
];

export const ExamsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [localExams, setLocalExams] = useState<any[]>([]);
  const [examName, setExamName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [maximumMarks, setMaximumMarks] = useState('50');
  const [passingMarks, setPassingMarks] = useState('25');

  const qc = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/exams');
        return res.data.data;
      } catch {
        return null;
      }
    },
  });

  const apiExams = exams || [];
  const combinedExams = apiExams.length > 0 ? apiExams : [...localExams, ...DEFAULT_EXAMS];

  const addExamMutation = useMutation({
    mutationFn: async () => {
      const code = examCode.toUpperCase();
      const newExam = {
        exam_id: `ex_${Date.now()}`,
        exam_name: examName,
        exam_code: code,
        exam_date: examDate || new Date().toISOString(),
        maximum_marks: Number(maximumMarks),
        passing_marks: Number(passingMarks),
        status: 'SCHEDULED',
      };

      try {
        await api.post('/api/exams', {
          examName,
          examCode: code,
          examDate: examDate || undefined,
          maximumMarks: Number(maximumMarks),
          passingMarks: Number(passingMarks),
        });
      } catch {}

      setLocalExams(prev => [newExam, ...prev]);
      return newExam;
    },
    onSuccess: () => {
      toast.success(`Exam ${examName} created!`);
      setIsAddModalOpen(false);
      setExamName('');
      setExamCode('');
      qc.invalidateQueries({ queryKey: ['exams-list'] });
      qc.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Examinations Management ({combinedExams.length})</h1>
          <p className="text-gray-400 text-sm">Synchronized across HOD and Staff portals</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Award className="w-4 h-4" />
          + Add Exam
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading && !combinedExams.length ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !combinedExams.length ? (
          <div className="p-12 text-center text-gray-500">No exams created yet. Click "+ Add Exam" to schedule an assessment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Exam Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Exam Date</th>
                  <th className="p-4">Max Marks</th>
                  <th className="p-4">Passing Marks</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {combinedExams.map((e: any) => (
                  <tr key={e.exam_id || e.exam_code} className="hover:bg-white/5">
                    <td className="p-4 font-bold text-white">{e.exam_name}</td>
                    <td className="p-4 font-mono text-cyan-400 text-xs">{e.exam_code || '—'}</td>
                    <td className="p-4 text-gray-300 text-xs">{e.exam_date ? new Date(e.exam_date).toLocaleDateString() : 'TBA'}</td>
                    <td className="p-4 font-mono text-white text-xs">{e.maximum_marks}</td>
                    <td className="p-4 font-mono text-gray-300 text-xs">{e.passing_marks}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400 font-semibold">
                        {e.status || 'SCHEDULED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Schedule New Examination
            </h2>

            <form onSubmit={ev => { ev.preventDefault(); addExamMutation.mutate(); }} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Exam Title (e.g. IAT-1 / Semester Exam)</label>
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
                  <label className="block text-xs text-gray-300 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={ev => setExamDate(ev.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={maximumMarks}
                    onChange={ev => setMaximumMarks(ev.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={ev => setPassingMarks(ev.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={addExamMutation.isPending} className="btn-primary text-xs">Create Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
