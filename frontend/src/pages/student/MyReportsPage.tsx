import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_STUDENT_REPORTS = [
  { report_id: 'rep_iat1', exam_name: 'IAT-1 Assessment PROS', academic_year: '2025-2026', month: 'September 2025', generated_at: '2025-09-20', status: 'READY', size: '142 KB' },
  { report_id: 'rep_iat2', exam_name: 'IAT-2 Assessment PROS', academic_year: '2025-2026', month: 'October 2025', generated_at: '2025-10-25', status: 'READY', size: '148 KB' },
  { report_id: 'rep_sem1', exam_name: 'End Semester Examination PROS', academic_year: '2025-2026', month: 'December 2025', generated_at: '2025-12-10', status: 'READY', size: '165 KB' },
];

export const MyReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const username = user?.username?.toUpperCase() || 'CS2001';

  const [customReports, setCustomReports] = useState<any[]>([]);

  useEffect(() => {
    const loadReports = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('erp_student_pros_reports') || '[]');
        // Filter reports matching current student's register number or show all for demo
        const matching = saved.filter((r: any) => !r.register_number || r.register_number === username);
        setCustomReports(matching);
      } catch {}
    };

    loadReports();
    const interval = setInterval(loadReports, 1500); // Live poll every 1.5s
    return () => clearInterval(interval);
  }, [username]);

  const { data: apiReports, isLoading } = useQuery({
    queryKey: ['student-reports'],
    queryFn: async () => {
      try {
        const r = await api.get('/api/student-portal/reports');
        return r.data.data;
      } catch {
        return null;
      }
    },
  });

  const baseReports = apiReports?.length ? apiReports : DEFAULT_STUDENT_REPORTS;
  const combinedReports = [...customReports, ...baseReports];

  const handleDownloadProsPdf = (reportTitle: string) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PROS Report');
      return;
    }

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
              For the Month of [ <span style="font-weight: normal;">September 2025</span> ] – Academic Year [ <span style="font-weight: normal;">2025 - 2026</span> ]
            </div>
          </div>

          <!-- Student Information Grid Box -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #000; width: 15%; font-weight: bold; background: #fafafa;">Student Name</td>
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ Student ${username} ]</td>
              <td style="padding: 8px; border: 1px solid #000; width: 15%; font-weight: bold; background: #fafafa;">Section</td>
              <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">[ A ]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #000; font-weight: bold; background: #fafafa;">Reg. No. / Section</td>
              <td style="padding: 8px; border: 1px solid #000; font-family: monospace; font-weight: bold; font-size: 14px;">[ ${username} ]</td>
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
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">92</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">O</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">2</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS102</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Programming in C</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">85</td>
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
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">4</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS202</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Database Management Systems</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">88</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">A+</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">5</td>
                <td style="font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">CS302</td>
                <td style="padding: 6px; border: 1px solid #000; font-weight: 500;">Cloud Infrastructure Security</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px; border: 1px solid #000;">90</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">O</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">P</td>
              </tr>
              <tr>
                <td colSpan="6" style="padding: 8px; border: 1px solid #000;">
                  <strong>Attendance % As on [ <span style="font-weight: normal;">15-09-2025</span> ]:</strong>
                  <span style="margin-left: 20px; font-family: monospace; font-size: 14px; font-weight: bold; color: #15803d;">[ 88.5% ]</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style="padding: 10px; border: 1px solid #000; font-weight: bold; background: #fafafa; vertical-align: top;">
                  Remarks on Attendance
                </td>
                <td colSpan="4" style="padding: 10px; border: 1px solid #000; font-size: 12px; line-height: 1.5; vertical-align: top;">
                  [ Satisfactory attendance record. Eligible to appear for End Semester examinations. ]
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
    toast.success(`PROS Report downloaded for ${username}!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Academic Report Cards</h1>
        <p className="text-gray-400 text-sm">Download official Prathyusha Engineering College Performance Review of Students (PROS) reports</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-cyan-500/20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Official PROS Document Portal
          </span>
          <span className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full font-mono font-bold border border-cyan-500/20">
            STUDENT: {username}
          </span>
        </div>

        {isLoading && !combinedReports.length ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {combinedReports.map((r: any, idx: number) => (
              <div key={r.report_id || idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 mt-1 sm:mt-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{r.month || r.exam_name || 'PROS Report'} Card</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> OFFICIAL PROS
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Academic Year: {r.academic_year || '2025-2026'} · Attendance: <strong className="text-emerald-400">{r.attendance_pct || '88.5%'}</strong> · Delivered: {new Date(r.generated_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadProsPdf(r.month || r.exam_name || 'PROS')}
                  className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PROS PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
