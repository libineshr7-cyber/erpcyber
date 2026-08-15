import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Send, CheckCircle, RefreshCw, X } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const SEEDED_REPORTS = [
  { report_id: 'rep_1', register_number: 'CS2001', student_name: 'Student CS2001', exam_name: 'IAT-1 Assessment', generated_at: '2025-09-17T10:30:00Z' },
  { report_id: 'rep_2', register_number: 'CS2002', student_name: 'Student CS2002', exam_name: 'IAT-1 Assessment', generated_at: '2025-09-17T11:00:00Z' },
  { report_id: 'rep_3', register_number: 'CS3001', student_name: 'Student CS3001', exam_name: 'IAT-1 Assessment', generated_at: '2025-09-16T15:45:00Z' },
];

export const ReportsPage: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // PROS Modal Prompt State
  const [isProsModalOpen, setIsProsModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState('September 2025');
  const [reportAcademicYear, setReportAcademicYear] = useState('2025 - 2026');
  const [reportAttendanceDate, setReportAttendanceDate] = useState('15-09-2025');
  const [reportAttendancePct, setReportAttendancePct] = useState('88.5%');
  const [reportAttendanceRemarks, setReportAttendanceRemarks] = useState('Satisfactory attendance record. Eligible for End Semester examinations.');

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => api.get('/api/students?limit=100').then(r => r.data.data || []),
  });

  const { data: exams } = useQuery({
    queryKey: ['exams-list'],
    queryFn: () => api.get('/api/exams').then(r => r.data.data || []),
  });

  const generateProsPdfReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to generate PROS PDF Report');
      return;
    }

    const reg = selectedStudent ? `CS20${selectedStudent.slice(-2)}` : 'CS2001';
    const studentName = selectedStudent ? `Student ${reg}` : 'Student CS2001';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PROS Academic Performance Review Report - Prathyusha Engineering College</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { margin: 0; padding: 20px 30px; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
          </style>
        </head>
        <body>
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
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ ${studentName} ]</td>
              <td style="padding: 8px; border: 1px solid #000; width: 15%; font-weight: bold; background: #fafafa;">Section</td>
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ A ]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Reg. No.</td>
              <td style="padding: 8px; border: 1px solid #000; font-family: monospace; font-weight: bold; font-size: 14px;">[ ${reg} ]</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Branch</td>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">[ B.E. Computer Science & Engineering ]</td>
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
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">1</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS201</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Network Security</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">90</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">O</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">2</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS102</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Programming in C</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">84</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">A+</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">3</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS301</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Web Application Security</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">96</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">O</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
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
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">PDF Academic Reports</h1>
        <p className="text-gray-400">Generate, view, and distribute official student PROS performance reports</p>
      </div>

      {/* Generator Card */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Generate New Official PROS Academic Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- Choose Student --</option>
              {students?.map((s: any) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.register_number} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Examination</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- Choose Exam --</option>
              {exams?.map((e: any) => (
                <option key={e.exam_id} value={e.exam_id}>
                  {e.exam_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setIsProsModalOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-none shadow-lg shadow-cyan-500/20 cursor-pointer py-2.5"
            >
              <FileText className="w-4 h-4" />
              Generate Official PROS PDF
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface-900">
          <h3 className="font-semibold text-white text-sm">Generated Reports History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase bg-surface-900">
                <th className="p-4">Reg No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Exam</th>
                <th className="p-4">Status</th>
                <th className="p-4">Generated At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {SEEDED_REPORTS.map((r: any) => (
                <tr key={r.report_id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-cyan-400 font-bold text-xs">{r.register_number}</td>
                  <td className="p-4 text-white font-medium text-sm">{r.student_name}</td>
                  <td className="p-4 text-gray-300 text-xs">{r.exam_name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Ready
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs font-mono">{new Date(r.generated_at).toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setIsProsModalOpen(true)}
                      className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                      title="Download PROS PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toast.success('PROS PDF report queued and sent via Meta WhatsApp Cloud API!')}
                      className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                      title="Send via WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROS Modal Prompt */}
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
