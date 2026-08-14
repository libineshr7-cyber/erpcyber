import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Save, Send, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface Student { student_id: string; register_number: string; name: string; }
interface MarkEntry { studentId: string; marksObtained: number | ''; isAbsent: boolean; }

export const MarkEntryPage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const qc = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: () => api.get('/api/staff/me/assignments').then(r => r.data.data || []),
  });

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/api/exams').then(r => r.data.data || []),
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-for-marks', selectedSubject],
    queryFn: () => selectedSubject
      ? api.get(`/api/students?subjectId=${selectedSubject}&limit=200`).then(r => r.data.data || [])
      : Promise.resolve([]),
    enabled: !!selectedSubject,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(marks)
        .filter(([, v]) => v.marksObtained !== '' || v.isAbsent)
        .map(([studentId, v]) => ({
          studentId,
          subjectId: selectedSubject,
          examId: selectedExam,
          marksObtained: v.isAbsent ? undefined : Number(v.marksObtained),
          isAbsent: v.isAbsent,
        }));
      return api.post('/api/marks/bulk', { entries });
    },
    onSuccess: () => {
      toast.success('Marks saved successfully');
      qc.invalidateQueries({ queryKey: ['marks-pending'] });
    },
    onError: () => toast.error('Failed to save marks'),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post('/api/marks/bulk-submit', { subjectId: selectedSubject, examId: selectedExam }),
    onSuccess: () => toast.success('Marks submitted for HOD approval'),
    onError: () => toast.error('Failed to submit marks'),
  });

  const updateMark = (studentId: string, field: keyof MarkEntry, value: unknown) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId] || { studentId, marksObtained: '', isAbsent: false }, [field]: value },
    }));
  };

  const selectedExamData = examsData?.find((e: Record<string, unknown>) => e.exam_id === selectedExam);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Mark Entry</h1>
        <p className="text-gray-400">Enter and submit student marks for approval</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Subject</label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="input-field w-full appearance-none"
              >
                <option value="">-- Choose Subject --</option>
                {assignments?.map((a: Record<string, string>) => (
                  <option key={a.assignment_id} value={a.subject_id}>
                    {a.subject_code} — {a.subject_name} (Section {a.section_name})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Exam</label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={e => setSelectedExam(e.target.value)}
                className="input-field w-full appearance-none"
              >
                <option value="">-- Choose Exam --</option>
                {examsData?.map((e: Record<string, string>) => (
                  <option key={e.exam_id} value={e.exam_id}>
                    {e.exam_name} (Max: {e.maximum_marks})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Mark Table */}
      {selectedSubject && selectedExam && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !studentsData?.length ? (
            <div className="flex items-center gap-3 text-gray-500 p-8">
              <AlertCircle className="w-5 h-5" />
              <span>No students found for this subject.</span>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm text-gray-400">{studentsData.length} students</span>
                <span className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">
                  Max marks: {selectedExamData?.maximum_marks}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Reg. No</th>
                      <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Name</th>
                      <th className="text-center p-4 text-xs font-medium text-gray-400 uppercase">Absent</th>
                      <th className="text-center p-4 text-xs font-medium text-gray-400 uppercase">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.map((s: Student) => {
                      const entry = marks[s.student_id] || { marksObtained: '', isAbsent: false };
                      return (
                        <tr key={s.student_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-sm font-mono text-cyan-400">{s.register_number}</td>
                          <td className="p-4 text-sm text-white">{s.name}</td>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={entry.isAbsent}
                              onChange={e => updateMark(s.student_id, 'isAbsent', e.target.checked)}
                              className="w-4 h-4 accent-cyan-500"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              min={0}
                              max={selectedExamData?.maximum_marks}
                              disabled={entry.isAbsent}
                              value={entry.marksObtained}
                              onChange={e => updateMark(s.student_id, 'marksObtained', e.target.value)}
                              className="input-field w-24 text-center disabled:opacity-40"
                              placeholder="—"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 flex gap-3 justify-end border-t border-white/10">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
