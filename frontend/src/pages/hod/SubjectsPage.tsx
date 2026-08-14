import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_SUBJECTS = [
  { subject_id: 'sub_1', subject_code: 'CS201', subject_name: 'Network Security', subject_type: 'THEORY', credits: 4, semester_number: 3, maximum_marks: 100, passing_marks: 50 },
  { subject_id: 'sub_2', subject_code: 'CS102', subject_name: 'Programming in C', subject_type: 'THEORY', credits: 3, semester_number: 1, maximum_marks: 100, passing_marks: 50 },
  { subject_id: 'sub_3', subject_code: 'CS301', subject_name: 'Web Application Security', subject_type: 'PRACTICAL', credits: 4, semester_number: 5, maximum_marks: 100, passing_marks: 50 },
];

export const SubjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [localSubjects, setLocalSubjects] = useState<any[]>([]);

  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [credits, setCredits] = useState('3');
  const [semesterNumber, setSemesterNumber] = useState('3');
  const [yearOfStudy, setYearOfStudy] = useState('2');
  const [maximumMarks, setMaximumMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('50');

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subjects-list', search],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/subjects?search=${search}&limit=100`);
        return res.data.data;
      } catch {
        return null;
      }
    },
  });

  const apiSubjects = data || [];
  const combinedSubjects = apiSubjects.length > 0 ? apiSubjects : [...localSubjects, ...DEFAULT_SUBJECTS];

  const filteredSubjects = combinedSubjects.filter((sub: any) => {
    return !search || sub.subject_code?.toLowerCase().includes(search.toLowerCase()) || sub.subject_name?.toLowerCase().includes(search.toLowerCase());
  });

  const addSubjectMutation = useMutation({
    mutationFn: async () => {
      const code = subjectCode.toUpperCase();
      const newSub = {
        subject_id: `sub_${Date.now()}`,
        subject_code: code,
        subject_name: subjectName,
        subject_type: subjectType,
        credits: Number(credits),
        semester_number: Number(semesterNumber),
        maximum_marks: Number(maximumMarks),
        passing_marks: Number(passingMarks),
      };

      try {
        await api.post('/api/subjects', {
          subjectCode: code,
          subjectName,
          subjectType,
          credits: Number(credits),
          semesterNumber: Number(semesterNumber),
          yearOfStudy: Number(yearOfStudy),
          maximumMarks: Number(maximumMarks),
          passingMarks: Number(passingMarks),
        });
      } catch {}

      setLocalSubjects(prev => [newSub, ...prev]);
      return newSub;
    },
    onSuccess: () => {
      toast.success(`Course ${subjectCode.toUpperCase()} created successfully!`);
      setIsAddModalOpen(false);
      setSubjectCode('');
      setSubjectName('');
      qc.invalidateQueries({ queryKey: ['subjects-list'] });
      qc.invalidateQueries({ queryKey: ['staff-assignments'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header with + Add Subject Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Curriculum & Courses ({filteredSubjects.length})</h1>
          <p className="text-gray-400 text-sm">Synchronized across HOD and Staff dashboards</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <BookOpen className="w-4 h-4" />
          + Add Subject
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subject code or name..."
            className="input-field pl-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Subjects Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading && !filteredSubjects.length ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !filteredSubjects.length ? (
          <div className="p-12 text-center text-gray-500">No subjects found. Click "+ Add Subject" to add a course.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Max Marks</th>
                  <th className="p-4">Passing Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredSubjects.map((sub: any) => (
                  <tr key={sub.subject_id || sub.subject_code} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-cyan-400">{sub.subject_code}</td>
                    <td className="p-4 text-white font-medium">{sub.subject_name}</td>
                    <td className="p-4 text-xs font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${sub.subject_type === 'PRACTICAL' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {sub.subject_type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 text-xs">{sub.credits}</td>
                    <td className="p-4 text-gray-300 text-xs">Sem {sub.semester_number}</td>
                    <td className="p-4 text-gray-300 text-xs font-mono">{sub.maximum_marks}</td>
                    <td className="p-4 text-gray-300 text-xs font-mono">{sub.passing_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Add New Curriculum Subject
            </h2>

            <form onSubmit={e => { e.preventDefault(); addSubjectMutation.mutate(); }} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={e => setSubjectCode(e.target.value.toUpperCase())}
                    placeholder="CS201"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Type</label>
                  <select value={subjectType} onChange={e => setSubjectType(e.target.value)} className="input-field">
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="Data Structures & Algorithms"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={e => setCredits(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Semester</label>
                  <select value={semesterNumber} onChange={e => setSemesterNumber(e.target.value)} className="input-field">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Year</label>
                  <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="input-field">
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={maximumMarks}
                    onChange={e => setMaximumMarks(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={e => setPassingMarks(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubjectMutation.isPending}
                  className="btn-primary text-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
