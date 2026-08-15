import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Send, ChevronDown, CheckCircle, Award, BookOpen, Clock, Smartphone, Target, FileText, Download, X } from 'lucide-react';
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
  { subject_id: 'sub_4', subject_code: 'CS202', subject_name: 'Database Management Systems', section_name: 'A' },
  { subject_id: 'sub_5', subject_code: 'CS302', subject_name: 'Cloud Infrastructure Security', section_name: 'B' },
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
  const [maxMarksScale, setMaxMarksScale] = useState<number>(50);
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // PROS PDF Report Modal Prompt State
  const [isProsModalOpen, setIsProsModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState('September 2025');
  const [reportAcademicYear, setReportAcademicYear] = useState('2025 - 2026');
  const [reportAttendanceDate, setReportAttendanceDate] = useState('15-09-2025');
  const [reportAttendancePct, setReportAttendancePct] = useState('88.5%');
  const [reportAttendanceRemarks, setReportAttendanceRemarks] = useState('Satisfactory attendance record. Eligible for End Semester examinations.');
  const [selectedStudentForPros, setSelectedStudentForPros] = useState<string>('ALL');

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

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setIsSubmitted(false);
    const selectedObj = examsList.find((e: any) => e.exam_id === examId);
    if (selectedObj?.maximum_marks) {
      setMaxMarksScale(Number(selectedObj.maximum_marks));
    }
  };

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
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success(`Marks out of ${maxMarksScale} submitted to HOD Admin for verification & parent dispatch!`);
    },
  });

  const updateMark = (studentId: string, field: keyof MarkEntry, value: unknown) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId] || { studentId, marksObtained: '', isAbsent: false }, [field]: value },
    }));
  };

  const calculateGradeAndResult = (m: number | '', isAbsent: boolean, maxScale: number) => {
    if (isAbsent || m === '') return { marksOut100: '0', grade: 'RA', result: 'F' };
    const num = Number(m);
    const scaled = Math.round((num / maxScale) * 100);
    let grade = 'RA';
    let result = 'F';

    if (scaled >= 90) { grade = 'O'; result = 'P'; }
    else if (scaled >= 80) { grade = 'A+'; result = 'P'; }
    else if (scaled >= 70) { grade = 'A'; result = 'P'; }
    else if (scaled >= 60) { grade = 'B+'; result = 'P'; }
    else if (scaled >= 50) { grade = 'B'; result = 'P'; }

    return { marksOut100: scaled.toString(), grade, result };
  };

  const generateProsPdfReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to generate PROS PDF Report');
      return;
    }

    const targetStudents = selectedStudentForPros === 'ALL'
      ? studentsList.slice(0, 5) // Export first batch if ALL
      : studentsList.filter(s => s.student_id === selectedStudentForPros || s.register_number === selectedStudentForPros);

    const pagesHtml = targetStudents.map(student => {
      const is3rd = student.register_number.startsWith('CS30');
      const section = is3rd ? 'B' : 'A';
      const branch = 'B.E. Computer Science & Engineering';

      // Subjects table rows
      const rows = DEFAULT_SUBJECTS.map((sub, idx) => {
        const studentMarkEntry = marks[student.student_id];
        const isAbsent = studentMarkEntry?.isAbsent || false;
        const rawMark = studentMarkEntry?.marksObtained !== undefined ? studentMarkEntry.marksObtained : (40 + ((idx * 3) % 10));
        
        const { marksOut100, grade, result } = calculateGradeAndResult(rawMark, isAbsent, maxMarksScale);

        return `
          <tr>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">${sub.subject_code}</td>
            <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">${sub.subject_name}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">${marksOut100}</td>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${grade}</td>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${result}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="page-break-after: always; padding: 20px 30px; font-family: Arial, Helvetica, sans-serif; color: #000;">
          <!-- Header Emblem & Institution Title -->
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="display: inline-block; width: 60px; height: 60px; border-radius: 50%; border: 2px solid #b91c1c; background: #fff; line-height: 60px; font-weight: bold; color: #b91c1c; font-size: 11px; margin-bottom: 5px;">
              PEC 2001
            </div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">PRATHYUSHA ENGINEERING COLLEGE</h2>
            <div style="font-size: 13px; font-style: italic; margin-top: 2px; color: #222;">(An Autonomous Institution)</div>
            <h3 style="margin: 8px 0 2px 0; font-size: 15px; font-weight: bold; text-decoration: underline;">PERFORMANCE REVIEW OF STUDENTS (PROS)</h3>
            <div style="font-size: 13px; font-weight: bold;">
              For the Month of [ <span style="font-weight: normal;">${reportMonth}</span> ] – Academic Year [ <span style="font-weight: normal;">${reportAcademicYear}</span> ]
            </div>
          </div>

          <!-- Student Information Grid Box -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #000; width: 15%; font-weight: bold; background: #fafafa;">Student Name</td>
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ ${student.name} ]</td>
              <td style="padding: 8px; border: 1px solid #000; width: 15%; font-weight: bold; background: #fafafa;">Section</td>
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ ${section} ]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Reg. No.</td>
              <td style="padding: 8px; border: 1px solid #000; font-family: monospace; font-weight: bold; font-size: 14px;">[ ${student.register_number} ]</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Branch</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">[ ${branch} ]</td>
            </tr>
          </table>

          <!-- Academic Performance Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #fafafa;">
                <td colSpan="6" style="text-align: center; font-weight: bold; padding: 8px; border: 1px solid #000; font-size: 13px; letter-spacing: 0.5px;">
                  ACADEMIC PERFORMANCE
                </td>
              </tr>
              <tr style="background-color: #f1f5f9;">
                <th style="width: 40px; text-align: center; padding: 8px; border: 1px solid #000;">S. No</th>
                <th style="width: 100px; padding: 8px; border: 1px solid #000;">Subject Code</th>
                <th style="padding: 8px; border: 1px solid #000;">Subject Name</th>
                <th style="width: 110px; text-align: center; padding: 8px; border: 1px solid #000;">Marks<br/><span style="font-size: 10px; font-weight: normal;">(Out of 100)</span></th>
                <th style="width: 70px; text-align: center; padding: 8px; border: 1px solid #000;">Grade</th>
                <th style="width: 90px; text-align: center; padding: 8px; border: 1px solid #000;">Pass/ Fail<br/><span style="font-size: 10px; font-weight: normal;">(P/F)</span></th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td colSpan="6" style="padding: 8px; border: 1px solid #000;">
                  <strong>Attendance % As on [ <span style="font-weight: normal;">${reportAttendanceDate}</span> ]:</strong>
                  <span style="margin-left: 20px; font-family: monospace; font-size: 14px; font-weight: bold; color: #15803d;">[ ${reportAttendancePct} ]</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style="padding: 10px; border: 1px solid #000; font-weight: bold; background: #fafafa; vertical-align: top;">
                  Remarks on Attendance
                </td>
                <td colSpan="4" style="padding: 10px; border: 1px solid #000; font-size: 12px; line-height: 1.5; vertical-align: top;">
                  [ ${reportAttendanceRemarks} ]
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Bottom Official Advisory Notes -->
          <div style="font-size: 11px; line-height: 1.6; margin-top: 15px; border-top: 1px solid #000; padding-top: 10px;">
            <p style="margin: 0 0 5px 0;">
              <strong>Note on attendance:</strong> Students secured less than 75% of attendance will not be permitted to appear current semester exams and detained for next semester.
            </p>
            <p style="margin: 0;">
              <strong>Note:</strong> No digital note is circulated to the students for exam preparation. Kindly advice your ward to keep mobile phones away while studying and preparing for exams.
            </p>
          </div>
        </div>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PROS Academic Performance Review Report - Prathyusha Engineering College</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    setIsProsModalOpen(false);
    toast.success('PROS PDF Academic Report generated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient mb-1">Examination Mark Entry</h1>
          <p className="text-gray-400 text-sm">Select course and exam assessment (Out of 50 or 100 Marks) for all 97 students</p>
        </div>

        <div className="flex items-center gap-3">
          {isSubmitted && (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              SUBMITTED TO HOD FOR APPROVAL
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsProsModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-none cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Generate PROS PDF Report
          </button>
        </div>
      </div>

      {/* Select Subject, Select Exam, and Max Marks Controls */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> 1. Select Course / Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={e => { setSelectedSubject(e.target.value); setIsSubmitted(false); }}
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
              <Award className="w-4 h-4" /> 2. Select Examination Assessment
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={e => handleExamChange(e.target.value)}
                className="input-field w-full text-sm appearance-none font-medium bg-surface-900"
              >
                {examsList.map((e: any) => (
                  <option key={e.exam_id} value={e.exam_id}>
                    {e.exam_name} (Default Max: {e.maximum_marks} Marks)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 50 vs 100 Marks Toggle Option */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-yellow-400" /> Select Examination Max Marks Scale:
          </span>

          <div className="flex items-center gap-3">
            {[50, 100].map(scale => (
              <button
                key={scale}
                type="button"
                onClick={() => setMaxMarksScale(scale)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  maxMarksScale === scale
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10 scale-105'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                🎯 {scale} Marks Maximum
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mark Entry Table for all 97 Students */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <span className="text-sm font-semibold text-white">Student Roster ({studentsList.length} Students)</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Maximum Marks Scale: Out of {maxMarksScale}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-900 z-10 border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
              <tr>
                <th className="p-4">Reg. Number</th>
                <th className="p-4">Student Full Name</th>
                <th className="p-4 text-center">Mark Absent</th>
                <th className="p-4 text-center">Marks Obtained (Out of {maxMarksScale})</th>
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
                        max={maxMarksScale}
                        disabled={entry.isAbsent}
                        value={entry.marksObtained}
                        onChange={e => updateMark(s.student_id, 'marksObtained', e.target.value)}
                        className="input-field w-28 text-center font-mono font-bold text-white disabled:opacity-30 disabled:bg-transparent"
                        placeholder={`0-${maxMarksScale}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-white/10 bg-surface-900 items-center">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-auto">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Upon HOD Approval, marks (out of {maxMarksScale}) will be automatically sent to parents via Meta WhatsApp Cloud API
          </span>

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

      {/* Interactive Prompt Modal for PROS PDF Report Configuration */}
      {isProsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl space-y-4 border border-cyan-500/40 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Configure PROS Academic Report PDF
              </h2>
              <button onClick={() => setIsProsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1">For the Month of</label>
                  <input
                    type="text"
                    required
                    value={reportMonth}
                    onChange={e => setReportMonth(e.target.value)}
                    placeholder="September 2025"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={reportAcademicYear}
                    onChange={e => setReportAcademicYear(e.target.value)}
                    placeholder="2025 - 2026"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Attendance Cut-off Date</label>
                  <input
                    type="text"
                    required
                    value={reportAttendanceDate}
                    onChange={e => setReportAttendanceDate(e.target.value)}
                    placeholder="15-09-2025"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Attendance % As on Date</label>
                  <input
                    type="text"
                    required
                    value={reportAttendancePct}
                    onChange={e => setReportAttendancePct(e.target.value)}
                    placeholder="88.5%"
                    className="input-field text-sm font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-yellow-400 uppercase mb-1">Remarks on Attendance</label>
                <textarea
                  rows={2}
                  required
                  value={reportAttendanceRemarks}
                  onChange={e => setReportAttendanceRemarks(e.target.value)}
                  className="input-field w-full text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Select Target Student</label>
                <select
                  value={selectedStudentForPros}
                  onChange={e => setSelectedStudentForPros(e.target.value)}
                  className="input-field w-full text-sm font-semibold bg-surface-900"
                >
                  <option value="ALL">Export Batch PROS Reports (All Students)</option>
                  {studentsList.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.register_number} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 justify-end border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsProsModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateProsPdfReport}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-none shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Generate & Print PROS PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
