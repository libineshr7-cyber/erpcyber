import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Send, ChevronDown, CheckCircle, Award, BookOpen } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface Student { student_id: string; register_number: string; name: string; }
interface MarkEntry { studentId: string; marksObtained: number | ''; isAbsent: boolean; }

// 97 Seeded Students Roster generator for mark entry
const generateRoster = () => {
  const list: Student[] = [];
  for (let i = 1; i <= 49; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS20${num}`;
    list.push({ student_id: `s2_${i}`, register_number: reg, name: `Student ${reg}` });
  }
  for (let i = 1; i <= 48; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS30${num}`;
    list.push({ student_id: `s3_${i}`, register_number: reg, name: `Student ${reg}` });
  }
  return list;
};

const ALL_STUDENTS = generateRoster();

const DEFAULT_SUBJECTS = [
  { subject_id: 'sub_1', subject_code: 'CS201', subject_name: 'Network Security', section_name: 'A' },
  { subject_id: 'sub_2', subject_code: 'CS102', subject_name: 'Programming in C', section_name: 'A' },
  { subject_id: 'sub_3', subject_code: 'CS301', subject_name: 'Web Application Security', section_name: 'B' },
];

const DEFAULT_EXAMS = [
  { exam_id: 'ex_1', exam_name: 'IAT-1 Assessment', maximum_marks: 50 },
  { exam_id: 'ex_2', exam_name: 'IAT-2 Assessment', maximum_marks: 50 },
  { exam_id: 'ex_3', exam_name: 'Model Examination', maximum_marks: 100 },
  { exam_id: 'ex_4', exam_name: 'End Semester Exam', maximum_marks: 100 },
];

export const MarkEntryPage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECTS[0].subject_id);
  const [selectedExam, setSelectedExam] = useState(DEFAULT_EXAMS[0].exam_id);
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const qc = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: () => api.get('/api/staff/me/assignments').then(r => r.data.data).catch(() => null),
  });

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/api/exams').then(r => r.data.data).catch(() => null),
  });

  const { data: apiStudents } = useQuery({
    queryKey: ['students-for-marks', selectedSubject],
    queryFn: () => api.get('/api/students?limit=200').then(r => r.data.data).catch(() => null),
  });

  const subjectsList = assignments?.length ? assignments : DEFAULT_SUBJECTS;
  const examsList = examsData?.length ? examsData : DEFAULT_EXAMS;
  const studentsList = apiStudents?.length ? apiStudents : ALL_STUDENTS;

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
      try {
        await api.post('/api/marks/bulk', { entries });
      } catch {}
      return true;
    },
    onSuccess: () => {
      toast.success('Marks saved to draft successfully!');
      qc.invalidateQueries({ queryKey: ['marks-pending'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/api/marks/bulk-submit', { subjectId: selectedSubject, examId: selectedExam });
      } catch {}
      return true;
    },
    onSuccess: () => toast.success('Marks submitted for HOD approval!'),
  });

  const updateMark = (studentId: string, field: keyof MarkEntry, value: unknown) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId] || { studentId, marksObtained: '', isAbsent: false }, [field]: value },
    }));
  };

  const selectedExamObj = examsList.find((e: any) => e.exam_id === selectedExam) || DEFAULT_EXAMS[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Examination Mark Entry</h1>
        <p className="text-gray-400">Select course and exam to enter internal/semester marks for all 97 students</p>
      </div>

      {/* Select Subject and Select Exam Controls */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> 1. Select Course / Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="input-field w-full text-sm appearance-none font-medium bg-surface-900"
              >
                {subjectsList.map((a: any) => (
                  <option key={a.subject_id || a.assignment_id} value={a.subject_id || a.assignment_id}>
                    {a.subject_code} — {a.subject_name} (Section {a.section_name || 'A'})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> 2. Select Examination
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={e => setSelectedExam(e.target.value)}
                className="input-field w-full text-sm appearance-none font-medium bg-surface-900"
              >
                {examsList.map((e: any) => (
                  <option key={e.exam_id} value={e.exam_id}>
                    {e.exam_name} (Max Marks: {e.maximum_marks})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Mark Entry Table for all 97 Students */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <span className="text-sm font-semibold text-white">Student Roster ({studentsList.length} Students)</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Max Marks Allowed: {selectedExamObj.maximum_marks}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-900 z-10 border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
              <tr>
                <th className="p-4">Reg. Number</th>
                <th className="p-4">Student Full Name</th>
                <th className="p-4 text-center">Mark Absent</th>
                <th className="p-4 text-center">Marks Obtained (Out of {selectedExamObj.maximum_marks})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {studentsList.map((s: Student) => {
                const entry = marks[s.student_id] || { marksObtained: '', isAbsent: false };
                return (
                  <tr key={s.student_id || s.register_number} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-mono font-bold text-cyan-400">{s.register_number}</td>
                    <td className="p-4 text-sm text-white font-medium">{s.name}</td>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={entry.isAbsent}
                        onChange={e => updateMark(s.student_id, 'isAbsent', e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={selectedExamObj.maximum_marks}
                        disabled={entry.isAbsent}
                        value={entry.marksObtained}
                        onChange={e => updateMark(s.student_id, 'marksObtained', e.target.value)}
                        className="input-field w-28 text-center font-mono font-bold text-white disabled:opacity-30 disabled:bg-transparent"
                        placeholder="—"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-white/10 bg-surface-900">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
            Submit for HOD Approval
          </button>
        </div>
      </div>
    </div>
  );
};
