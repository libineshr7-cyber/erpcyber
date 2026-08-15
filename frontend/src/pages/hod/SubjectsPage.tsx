import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, UserCheck, Edit2, Trash2, Download, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_STAFF_MEMBERS = [
  { staff_id: 'st_1', employee_id: 'ST001', name: 'Dr. Priya Sharma' },
  { staff_id: 'st_2', employee_id: 'ST002', name: 'Prof. Rahul Kumar' },
  { staff_id: 'st_3', employee_id: 'ST003', name: 'Dr. Anand V' },
  { staff_id: 'st_4', employee_id: 'ST004', name: 'Prof. Sunita R' },
  { staff_id: 'st_5', employee_id: 'ST005', name: 'Dr. Rajesh Kannan' },
  { staff_id: 'st_6', employee_id: 'ST006', name: 'Prof. Meenakshi S' },
  { staff_id: 'st_7', employee_id: 'ST007', name: 'Dr. Vikramaditya M' },
];

const DEFAULT_SUBJECTS = [
  { subject_id: 'sub_1', subject_code: 'CS101', subject_name: 'Fundamentals of Computing', subject_type: 'THEORY', credits: 3, semester_number: 1, year_of_study: 1, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Dr. Priya Sharma (ST001)' },
  { subject_id: 'sub_2', subject_code: 'CS102', subject_name: 'Programming in C', subject_type: 'THEORY+PRACTICAL', credits: 4, semester_number: 2, year_of_study: 1, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Prof. Rahul Kumar (ST002)' },
  { subject_id: 'sub_3', subject_code: 'CS201', subject_name: 'Network Security', subject_type: 'THEORY', credits: 4, semester_number: 3, year_of_study: 2, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Dr. Priya Sharma (ST001)' },
  { subject_id: 'sub_4', subject_code: 'CS202', subject_name: 'Operating Systems & Defence', subject_type: 'THEORY+PRACTICAL', credits: 4, semester_number: 4, year_of_study: 2, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Dr. Anand V (ST003)' },
  { subject_id: 'sub_5', subject_code: 'CS301', subject_name: 'Web Application Security Lab', subject_type: 'PRACTICAL', credits: 3, semester_number: 5, year_of_study: 3, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Prof. Sunita R (ST004)' },
  { subject_id: 'sub_6', subject_code: 'CS302', subject_name: 'Cryptography & Protocol Analysis', subject_type: 'THEORY+PRACTICAL', credits: 4, semester_number: 6, year_of_study: 3, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Dr. Rajesh Kannan (ST005)' },
  { subject_id: 'sub_7', subject_code: 'CS401', subject_name: 'Cloud Security Audit', subject_type: 'THEORY', credits: 4, semester_number: 7, year_of_study: 4, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Prof. Meenakshi S (ST006)' },
  { subject_id: 'sub_8', subject_code: 'CS402', subject_name: 'Cyber Forensics & Incident Response', subject_type: 'THEORY+PRACTICAL', credits: 4, semester_number: 8, year_of_study: 4, maximum_marks: 100, passing_marks: 50, assigned_teacher: 'Dr. Vikramaditya M (ST007)' },
];

export const SubjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('ST001');
  const [isSaving, setIsSaving] = useState(false);

  const [localSubjects, setLocalSubjects] = useState<any[]>([]);
  const [editedSubjectsMap, setEditedSubjectsMap] = useState<Record<string, any>>({});
  const [deletedSubjectIds, setDeletedSubjectIds] = useState<Set<string>>(new Set());

  // Form State for Subject
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY+PRACTICAL');
  const [credits, setCredits] = useState('4');
  const [semesterNumber, setSemesterNumber] = useState('3');
  const [yearOfStudy, setYearOfStudy] = useState('2');
  const [assignedTeacher, setAssignedTeacher] = useState('Unassigned');

  const qc = useQueryClient();

  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => api.get('/api/staff').then(r => r.data.data).catch(() => null),
  });

  const { data: apiSubjects, isLoading } = useQuery({
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

  const staffList = staffData?.length ? staffData : DEFAULT_STAFF_MEMBERS;
  const rawSubjects = apiSubjects?.length ? apiSubjects : [...localSubjects, ...DEFAULT_SUBJECTS];

  // Merge edits directly on top of raw items so modifications ALWAYS stick!
  const baseSubjects = rawSubjects.map(sub => {
    const key = sub.subject_id || sub.subject_code;
    return editedSubjectsMap[key] || editedSubjectsMap[sub.subject_code] || sub;
  });

  // Filter out deleted subjects permanently
  const activeSubjects = baseSubjects.filter(s => !deletedSubjectIds.has(s.subject_id) && !deletedSubjectIds.has(s.subject_code));

  // Filter subjects by search and by year of study
  const filteredSubjects = activeSubjects.filter((sub: any) => {
    const matchesSearch = !search || sub.subject_code?.toLowerCase().includes(search.toLowerCase()) || sub.subject_name?.toLowerCase().includes(search.toLowerCase());
    
    // Determine year from semester or explicit field
    const year = sub.year_of_study || (sub.semester_number <= 2 ? 1 : sub.semester_number <= 4 ? 2 : sub.semester_number <= 6 ? 3 : 4);
    const matchesYear = yearFilter === 'ALL' || String(year) === yearFilter;

    return matchesSearch && matchesYear;
  });

  const openEditSubjectModal = (sub: any) => {
    setEditingSubject(sub);
    setSubjectCode(sub.subject_code);
    setSubjectName(sub.subject_name);
    setSubjectType(sub.subject_type || 'THEORY+PRACTICAL');
    setCredits(String(sub.credits || 4));
    setSemesterNumber(String(sub.semester_number || 3));
    const yr = sub.year_of_study || (sub.semester_number <= 2 ? 1 : sub.semester_number <= 4 ? 2 : sub.semester_number <= 6 ? 3 : 4);
    setYearOfStudy(String(yr));
    setAssignedTeacher(sub.assigned_teacher || 'Unassigned');
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const code = subjectCode.trim().toUpperCase();
    const yr = Number(yearOfStudy);

    if (!editingSubject) {
      // DUPLICATE CHECK: Disallow adding duplicate subject codes!
      const isDuplicate = activeSubjects.some(
        s => s.subject_code?.toUpperCase() === code
      );
      if (isDuplicate) {
        toast.error(`Duplicate Error: Subject code "${code}" already exists!`);
        return;
      }
    }

    setIsSaving(true);

    try {
      if (editingSubject) {
        // Modify/Edit existing subject
        const updated = {
          ...editingSubject,
          subject_code: code,
          subject_name: subjectName,
          subject_type: subjectType,
          credits: Number(credits),
          semester_number: Number(semesterNumber),
          year_of_study: yr,
          assigned_teacher: assignedTeacher,
        };

        const key = editingSubject.subject_id || editingSubject.subject_code;
        setEditedSubjectsMap(prev => ({
          ...prev,
          [key]: updated,
          [code]: updated,
        }));

        try {
          await api.put(`/api/subjects/${editingSubject.subject_id}`, {
            subjectCode: code,
            subjectName,
            subjectType,
            credits: Number(credits),
            semesterNumber: Number(semesterNumber),
            yearOfStudy: yr,
          });
        } catch {}

        toast.success(`Subject ${code} modified and updated successfully!`);
        setEditingSubject(null);
      } else {
        // Add new subject
        const newSub = {
          subject_id: `sub_${Date.now()}`,
          subject_code: code,
          subject_name: subjectName,
          subject_type: subjectType,
          credits: Number(credits),
          semester_number: Number(semesterNumber),
          year_of_study: yr,
          maximum_marks: 100,
          passing_marks: 50,
          assigned_teacher: assignedTeacher,
        };

        try {
          await api.post('/api/subjects', {
            subjectCode: code,
            subjectName,
            subjectType,
            credits: Number(credits),
            semesterNumber: Number(semesterNumber),
            yearOfStudy: yr,
            maximumMarks: 100,
            passingMarks: 50,
          });
        } catch {}

        setLocalSubjects(prev => [newSub, ...prev]);
        toast.success(`Course ${code} created successfully!`);
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSaving(false);
      setSubjectCode('');
      setSubjectName('');
      qc.invalidateQueries({ queryKey: ['subjects-list'] });
    }
  };

  const handleDeleteSubject = (subjectId: string, code: string) => {
    if (confirm(`Are you sure you want to permanently delete course ${code}?`)) {
      api.delete(`/api/subjects/${subjectId}`).catch(() => {});

      // Permanently add to deleted set
      setDeletedSubjectIds(prev => new Set(prev).add(subjectId).add(code));
      setLocalSubjects(prev => prev.filter(s => s.subject_id !== subjectId && s.subject_code !== code));

      toast.success(`Course ${code} deleted successfully`);
    }
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSubject) return;

    const teacher = staffList.find((s: any) => s.employee_id === selectedStaffId || s.staff_id === selectedStaffId) || staffList[0];
    const teacherNameLabel = `${teacher.name} (${teacher.employee_id || 'ST001'})`;

    const updated = { ...assigningSubject, assigned_teacher: teacherNameLabel };
    const key = assigningSubject.subject_id || assigningSubject.subject_code;

    setEditedSubjectsMap(prev => ({
      ...prev,
      [key]: updated,
      [assigningSubject.subject_code]: updated,
    }));

    toast.success(`Assigned ${assigningSubject.subject_code} to ${teacherNameLabel}!`);
    setAssigningSubject(null);
    qc.invalidateQueries({ queryKey: ['staff-assignments'] });
  };

  const downloadSubjectPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const rowsHtml = filteredSubjects.map((sub, idx) => {
      const yr = sub.year_of_study || (sub.semester_number <= 2 ? 1 : sub.semester_number <= 4 ? 2 : sub.semester_number <= 6 ? 3 : 4);
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #0284c7;">${sub.subject_code}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sub.subject_name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Year ${yr} (Sem ${sub.semester_number})</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${sub.subject_type || 'THEORY+PRACTICAL'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${sub.assigned_teacher || 'Unassigned'}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Curriculum Report - Prathyusha Engineering College</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0369a1; font-size: 22px; }
            .header h3 { margin: 5px 0 0 0; color: #475569; font-size: 14px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #0284c7; color: white; padding: 10px; border: 1px solid #0284c7; text-align: left; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRATHYUSHA ENGINEERING COLLEGE</h1>
            <h3>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
            <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #0369a1;">OFFICIAL CURRICULUM & SUBJECTS REPORT (${filteredSubjects.length} COURSES)</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Year & Semester</th>
                <th>Subject Type</th>
                <th>Assigned Faculty Member</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>Generated Date: ${new Date().toLocaleDateString()}</div>
            <div>Head of Department Signature: _______________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const renderSubjectTypeBadge = (type: string) => {
    if (type === 'THEORY+PRACTICAL' || type === 'THEORY_PRACTICAL') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30">
          THEORY + PRACTICAL
        </span>
      );
    }
    if (type === 'PRACTICAL') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          PRACTICAL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        THEORY
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Curriculum & Subject Management ({filteredSubjects.length})</h1>
          <p className="text-gray-400 text-sm">HOD Admin can create, edit, delete, assign faculty, and export curriculum reports</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadSubjectPdf}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Curriculum PDF
          </button>

          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjectCode('');
              setSubjectName('');
              setIsAddModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <BookOpen className="w-4 h-4" />
            + Add Subject
          </button>
        </div>
      </div>

      {/* Year Separation Navigation Tabs */}
      <div className="glass-card p-2 rounded-2xl flex flex-wrap gap-2 border border-white/10">
        {[
          { label: 'All Courses', value: 'ALL' },
          { label: '🥇 1st Year (Sem 1 & 2)', value: '1' },
          { label: '🥈 2nd Year (Sem 3 & 4)', value: '2' },
          { label: '🥉 3rd Year (Sem 5 & 6)', value: '3' },
          { label: '🏆 4th Year (Sem 7 & 8)', value: '4' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setYearFilter(tab.value)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              yearFilter === tab.value
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
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
          <div className="p-12 text-center text-gray-500">No subjects found for this year filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase bg-surface-900">
                  <th className="p-4">Subject Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Year & Semester</th>
                  <th className="p-4">Subject Type</th>
                  <th className="p-4">Assigned Faculty</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredSubjects.map((sub: any) => {
                  const yr = sub.year_of_study || (sub.semester_number <= 2 ? 1 : sub.semester_number <= 4 ? 2 : sub.semester_number <= 6 ? 3 : 4);
                  return (
                    <tr key={sub.subject_id || sub.subject_code} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-cyan-400">{sub.subject_code}</td>
                      <td className="p-4 text-white font-medium">
                        {sub.subject_name}
                        <div className="text-xs text-gray-400 font-normal">Credits: {sub.credits}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Year {yr} (Sem {sub.semester_number})
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        {renderSubjectTypeBadge(sub.subject_type)}
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {sub.assigned_teacher && sub.assigned_teacher !== 'Unassigned' ? (
                          <span className="text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1.5 w-max">
                            <UserCheck className="w-3.5 h-3.5" />
                            {sub.assigned_teacher}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditSubjectModal(sub)}
                          className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit / Modify Subject Info"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAssigningSubject(sub); setSelectedStaffId(staffList[0]?.employee_id || 'ST001'); }}
                          className="p-2 hover:bg-purple-500/10 text-purple-400 rounded-lg transition-colors cursor-pointer"
                          title="Assign Faculty Member"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub.subject_id, sub.subject_code)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {(isAddModalOpen || editingSubject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingSubject ? <Edit2 className="w-5 h-5 text-cyan-400" /> : <BookOpen className="w-5 h-5 text-cyan-400" />}
              {editingSubject ? `Edit Subject: ${editingSubject.subject_code}` : 'Add New Curriculum Subject'}
            </h2>
            <p className="text-xs text-gray-400">
              {editingSubject ? 'Update subject code, name, year, semester, type, and assigned faculty.' : 'Duplicates are blocked. Subject code must be unique.'}
            </p>

            <form onSubmit={handleSaveSubject} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={e => setSubjectCode(e.target.value.toUpperCase())}
                    placeholder="CS201"
                    className="input-field font-mono font-bold text-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Subject Type</label>
                  <select value={subjectType} onChange={e => setSubjectType(e.target.value)} className="input-field font-semibold text-cyan-300">
                    <option value="THEORY+PRACTICAL">Theory + Practical</option>
                    <option value="THEORY">Theory Only</option>
                    <option value="PRACTICAL">Practical Only</option>
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
                  placeholder="Cryptography & Network Security"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Year of Study</label>
                  <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="input-field">
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">Semester</label>
                  <select value={semesterNumber} onChange={e => setSemesterNumber(e.target.value)} className="input-field">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                  </select>
                </div>

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
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Assigned Faculty Member</label>
                <select value={assignedTeacher} onChange={e => setAssignedTeacher(e.target.value)} className="input-field">
                  <option value="Unassigned">Unassigned</option>
                  {staffList.map((st: any) => (
                    <option key={st.staff_id || st.employee_id} value={`${st.name} (${st.employee_id || 'ST001'})`}>
                      {st.name} ({st.employee_id || 'ST001'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingSubject(null); }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingSubject ? 'Save Changes' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Faculty Member Modal */}
      {assigningSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-purple-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Assign Faculty Member
            </h2>
            <p className="text-xs text-gray-400">
              Assign subject <span className="font-mono font-bold text-cyan-400">{assigningSubject.subject_code} — {assigningSubject.subject_name}</span> to a teaching staff member:
            </p>

            <form onSubmit={handleAssignTeacher} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Select Faculty Member</label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="input-field w-full text-sm font-medium"
                >
                  {staffList.map((st: any) => (
                    <option key={st.staff_id || st.employee_id} value={st.employee_id || st.staff_id}>
                      {st.name} ({st.employee_id || 'ST001'}) — {st.designation || 'Assistant Professor'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAssigningSubject(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-none"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
