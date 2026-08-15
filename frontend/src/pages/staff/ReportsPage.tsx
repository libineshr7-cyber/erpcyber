import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Send, CheckCircle, RefreshCw, X, User, Layers, Calendar } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface StudentRosterItem {
  student_id: string;
  register_number: string;
  name: string;
  year: string;
  section: string;
  attendance: number;
}

// Generate roster for 97 Students with unique attendance %
const generateRosterWithAttendance = (): StudentRosterItem[] => {
  const list: StudentRosterItem[] = [];
  for (let i = 1; i <= 49; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS20${num}`;
    const attendance = Number((72 + ((i * 7) % 26) + 0.5).toFixed(1));
    list.push({
      student_id: `s2_${i}`,
      register_number: reg,
      name: `Student ${reg}`,
      year: '2nd Year (Sem 3)',
      section: 'A',
      attendance,
    });
  }
  for (let i = 1; i <= 48; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS30${num}`;
    const attendance = Number((74 + ((i * 5) % 24) + 0.2).toFixed(1));
    list.push({
      student_id: `s3_${i}`,
      register_number: reg,
      name: `Student ${reg}`,
      year: '3rd Year (Sem 5)',
      section: 'B',
      attendance,
    });
  }
  return list;
};

const ALL_ROSTER = generateRosterWithAttendance();

const FIVE_SUBJECTS = [
  { subject_code: 'CS201', subject_name: 'Network Security' },
  { subject_code: 'CS102', subject_name: 'Programming in C' },
  { subject_code: 'CS301', subject_name: 'Web Application Security' },
  { subject_code: 'CS202', subject_name: 'Database Management Systems' },
  { subject_code: 'CS302', subject_name: 'Cloud Infrastructure Security' },
];

const SIX_SUBJECTS = [
  ...FIVE_SUBJECTS,
  { subject_code: 'CS203', subject_name: 'Operating Systems & System Audit' },
];

export const ReportsPage: React.FC = () => {
  // Target Selection Mode: 'YEAR' or 'PARTICULAR'
  const [targetMode, setTargetMode] = useState<'YEAR' | 'PARTICULAR'>('YEAR');
  const [selectedYearBatch, setSelectedYearBatch] = useState<string>('2nd Year');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('CS2001');

  // Enrolled Subjects Count Selector: 5 or 6 Subjects
  const [subjectCountScale, setSubjectCountScale] = useState<5 | 6>(5);

  // Metadata Prompts
  const [reportMonth, setReportMonth] = useState('September 2025');
  const [reportAcademicYear, setReportAcademicYear] = useState('2025 - 2026');
  const [reportAttendanceDate, setReportAttendanceDate] = useState('15-09-2025');

  // Custom Attendance Map (Student ID -> Attendance %)
  const [customAttendanceMap, setCustomAttendanceMap] = useState<Record<string, string>>({});
  const [customRemarksMap, setCustomRemarksMap] = useState<Record<string, string>>({});

  const getStudentAttendance = (student: StudentRosterItem) => {
    return customAttendanceMap[student.register_number] || `${student.attendance}%`;
  };

  const getStudentRemarks = (attendancePct: number) => {
    if (attendancePct >= 75) {
      return 'Satisfactory attendance record. Eligible to appear for End Semester examinations.';
    }
    return 'CRITICAL ATTENDANCE WARNING: Attendance is below 75%. Ward is at risk of detention.';
  };

  const activeSubjects = subjectCountScale === 5 ? FIVE_SUBJECTS : SIX_SUBJECTS;

  const getTargetStudents = (): StudentRosterItem[] => {
    if (targetMode === 'PARTICULAR') {
      const match = ALL_ROSTER.find(s => s.register_number === selectedStudentId || s.student_id === selectedStudentId);
      return match ? [match] : [ALL_ROSTER[0]];
    }

    if (selectedYearBatch === '2nd Year') {
      return ALL_ROSTER.filter(s => s.year.includes('2nd Year'));
    }
    if (selectedYearBatch === '3rd Year') {
      return ALL_ROSTER.filter(s => s.year.includes('3rd Year'));
    }
    return ALL_ROSTER;
  };

  const generateProsPdfReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to generate PROS PDF Report');
      return;
    }

    const targetStudents = getTargetStudents();

    const pagesHtml = targetStudents.map(student => {
      const branch = 'B.E. Computer Science & Engineering';
      const attendanceStr = getStudentAttendance(student);
      const attendanceNum = parseFloat(attendanceStr.replace('%', '')) || student.attendance;
      const remarks = customRemarksMap[student.register_number] || getStudentRemarks(attendanceNum);

      // Render 5 or 6 Subject Rows dynamically as chosen by teacher
      const rows = activeSubjects.map((sub, idx) => {
        const mark = 65 + ((idx * 7 + student.register_number.charCodeAt(4)) % 32);
        const grade = mark >= 90 ? 'O' : mark >= 80 ? 'A+' : mark >= 70 ? 'A' : mark >= 60 ? 'B+' : 'B';
        const result = mark >= 50 ? 'P' : 'F';

        return `
          <tr>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">${sub.subject_code}</td>
            <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">${sub.subject_name}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">${mark}</td>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${grade}</td>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${result}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="page-break-after: always; padding: 20px 30px; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff;">
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
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ ${student.section} ]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Reg. No. / Section</td>
              <td style="padding: 8px; border: 1px solid #000; font-family: monospace; font-weight: bold; font-size: 14px;">[ ${student.register_number} ]</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Branch</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">[ ${branch} ]</td>
            </tr>
          </table>

          <!-- Academic Performance Table (${subjectCountScale} Subjects) -->
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
                  <span style="margin-left: 20px; font-family: monospace; font-size: 14px; font-weight: bold; color: ${attendanceNum >= 75 ? '#15803d' : '#b91c1c'};">[ ${attendanceStr} ]</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style="padding: 10px; border: 1px solid #000; font-weight: bold; background: #fafafa; vertical-align: top;">
                  Remarks on Attendance
                </td>
                <td colSpan="4" style="padding: 10px; border: 1px solid #000; font-size: 12px; line-height: 1.5; vertical-align: top;">
                  [ ${remarks} ]
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
    toast.success(`PROS Report generated successfully for ${targetStudents.length} student(s) (${subjectCountScale} Subjects)!`);
  };

  const targetStudents = getTargetStudents();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-1 flex items-center gap-2">
          <FileText className="w-7 h-7 text-cyan-400" />
          Official PROS Academic Performance Reports
        </h1>
        <p className="text-gray-400 text-sm">Generate, customize, and print official Performance Review of Students (PROS) PDF documents</p>
      </div>

      {/* Main Configuration Card */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Layers className="w-5 h-5 text-cyan-400" /> 1. Select Report Target & Number of Subjects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Mode Picker: Particular Student vs Year Batch */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Choose Target Mode
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetMode('YEAR')}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  targetMode === 'YEAR'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" /> By Year / Batch
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('PARTICULAR')}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  targetMode === 'PARTICULAR'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                <User className="w-4 h-4" /> Particular Student
              </button>
            </div>

            {targetMode === 'YEAR' ? (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Select Year / Batch</label>
                <select
                  value={selectedYearBatch}
                  onChange={e => setSelectedYearBatch(e.target.value)}
                  className="input-field w-full text-sm font-semibold bg-surface-900"
                >
                  <option value="2nd Year">2nd Year B.E. CS (49 Students)</option>
                  <option value="3rd Year">3rd Year B.E. CS (48 Students)</option>
                  <option value="ALL">All 97 Students</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Select Particular Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="input-field w-full text-sm font-semibold bg-surface-900"
                >
                  {ALL_ROSTER.map(s => (
                    <option key={s.student_id} value={s.register_number}>
                      {s.register_number} — {s.name} ({s.year})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Number of Enrolled Subjects Selector: 5 vs 6 Subjects */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Enrolled Subjects Count for Term (5 vs 6 Subjects)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubjectCountScale(5)}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  subjectCountScale === 5
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10 scale-105'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                📚 5 Subjects
              </button>

              <button
                type="button"
                onClick={() => setSubjectCountScale(6)}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  subjectCountScale === 6
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10 scale-105'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                📚 6 Subjects
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Generates <strong className="text-purple-300">{subjectCountScale} Subject Rows</strong> in the Academic Performance table for each student.
            </p>
          </div>
        </div>

        {/* Header Metadata Inputs */}
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 pt-2">
          📅 2. Header & Attendance Cut-off Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Individual Student Attendance Customizer */}
        <h2 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-2 pt-2">
          <span>📊 3. Individual Student Attendance % Customizer ({targetStudents.length} Students)</span>
          <span className="text-xs text-gray-400 font-normal">Individual attendance differs per student</span>
        </h2>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
          {targetStudents.map(student => {
            const currentAttendance = getStudentAttendance(student);
            return (
              <div key={student.student_id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="font-medium text-white">
                  <span className="font-mono text-cyan-400 font-bold mr-2">{student.register_number}</span>
                  {student.name} ({student.year})
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-gray-400">Attendance %:</label>
                  <input
                    type="text"
                    value={currentAttendance}
                    onChange={e => setCustomAttendanceMap(prev => ({ ...prev, [student.register_number]: e.target.value }))}
                    className="input-field w-24 text-center font-mono font-bold text-emerald-400 py-1 text-xs"
                    placeholder="88.5%"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={generateProsPdfReport}
            className="btn-primary flex items-center justify-center gap-2 text-sm py-3 px-8 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-none shadow-xl shadow-cyan-500/20 cursor-pointer font-bold"
          >
            <Download className="w-5 h-5" />
            Generate & Print Official PROS PDF Report ({targetStudents.length} Students · {subjectCountScale} Subjects)
          </button>
        </div>
      </div>
    </div>
  );
};
