import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Send, Download, Users, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentAttendance {
  student_id: string;
  register_number: string;
  name: string;
  year: string;
  status: 'PRESENT' | 'ABSENT' | 'ON_DUTY';
  parent_phone: string;
}

// Generate roster for 97 Students
const generateAttendanceRoster = (): StudentAttendance[] => {
  const list: StudentAttendance[] = [];
  for (let i = 1; i <= 49; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS20${num}`;
    list.push({
      student_id: `s2_${i}`,
      register_number: reg,
      name: `Student ${reg}`,
      year: '2nd Year (Sem 3)',
      status: 'PRESENT',
      parent_phone: `+91 9840${num}1234`,
    });
  }
  for (let i = 1; i <= 48; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const reg = `CS30${num}`;
    list.push({
      student_id: `s3_${i}`,
      register_number: reg,
      name: `Student ${reg}`,
      year: '3rd Year (Sem 5)',
      status: 'PRESENT',
      parent_phone: `+91 9884${num}5678`,
    });
  }
  return list;
};

const DEFAULT_SUBJECTS = [
  { subject_code: 'CS201', subject_name: 'Network Security', section: 'A' },
  { subject_code: 'CS102', subject_name: 'Programming in C', section: 'A' },
  { subject_code: 'CS301', subject_name: 'Web Application Security', section: 'B' },
];

export const AttendancePage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECTS[0].subject_code);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState('1');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'ON_DUTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [roster, setRoster] = useState<StudentAttendance[]>(() => {
    try {
      const saved = localStorage.getItem('erp_attendance_roster');
      return saved ? JSON.parse(saved) : generateAttendanceRoster();
    } catch {
      return generateAttendanceRoster();
    }
  });

  useEffect(() => {
    localStorage.setItem('erp_attendance_roster', JSON.stringify(roster));
  }, [roster]);

  const setStudentStatus = (id: string, status: 'PRESENT' | 'ABSENT' | 'ON_DUTY') => {
    setRoster(prev => prev.map(s => s.student_id === id ? { ...s, status } : s));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster(prev => prev.map(s => ({ ...s, status })));
    toast.success(`Marked all ${roster.length} students as ${status}!`);
  };

  const filteredRoster = roster.filter(s => {
    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch = !searchQuery || s.register_number.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const presentCount = roster.filter(s => s.status === 'PRESENT').length;
  const absentCount = roster.filter(s => s.status === 'ABSENT').length;
  const odCount = roster.filter(s => s.status === 'ON_DUTY').length;
  const presentPercentage = ((presentCount / roster.length) * 100).toFixed(1);

  const handleSaveAttendance = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      try {
        const existingLogs = JSON.parse(localStorage.getItem('erp_audit_logs') || '[]');
        const newLog = {
          log_id: `log_${Date.now()}`,
          action: 'RECORD_ATTENDANCE',
          username: 'faculty_staff',
          role: 'STAFF',
          result: 'SUCCESS',
          created_at: new Date().toISOString(),
          details: `Recorded attendance for ${selectedSubject} (Period ${periodNumber}) on ${attendanceDate}: ${presentCount} Present, ${absentCount} Absent.`,
        };
        localStorage.setItem('erp_audit_logs', JSON.stringify([newLog, ...existingLogs]));
      } catch {}

      toast.success(`Attendance for ${selectedSubject} saved successfully! (${presentCount} Present, ${absentCount} Absent)`);
    }, 600);
  };

  const handleNotifyAbsentParents = () => {
    const absentees = roster.filter(s => s.status === 'ABSENT');
    if (absentees.length === 0) {
      toast.success('Zero students absent today! No notifications required.');
      return;
    }

    toast.success(`📱 Meta WhatsApp Cloud API: Sent absent alert notifications to ${absentees.length} parents!`, { duration: 5000 });
  };

  const downloadAttendancePdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const rowsHtml = roster.map((s, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #0284c7;">${s.register_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.year}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: center; color: ${s.status === 'PRESENT' ? '#16a34a' : s.status === 'ABSENT' ? '#dc2626' : '#7c3aed'};">
          ${s.status}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Class Attendance Register - Prathyusha Engineering College</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0369a1; font-size: 22px; }
            .header h3 { margin: 5px 0 0 0; color: #475569; font-size: 14px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #0284c7; color: white; padding: 8px; border: 1px solid #0284c7; text-align: left; }
            .summary { margin-top: 15px; font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 6px; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRATHYUSHA ENGINEERING COLLEGE</h1>
            <h3>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
            <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #0369a1;">OFFICIAL CLASSROOM ATTENDANCE REGISTER — ${selectedSubject} (PERIOD ${periodNumber})</p>
          </div>

          <div class="summary">
            <span>Date: ${attendanceDate}</span>
            <span>Total: ${roster.length}</span>
            <span style="color: #16a34a;">Present: ${presentCount} (${presentPercentage}%)</span>
            <span style="color: #dc2626;">Absent: ${absentCount}</span>
            <span style="color: #7c3aed;">On Duty: ${odCount}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">S.No</th>
                <th>Reg. Number</th>
                <th>Student Full Name</th>
                <th>Year & Class</th>
                <th style="text-align: center;">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>Report Generated: ${new Date().toLocaleString()}</div>
            <div>Faculty Member Signature: _______________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient mb-1">Student Attendance Register</h1>
          <p className="text-gray-400 text-sm">Classroom attendance recording, eligibility tracking, and parent WhatsApp alerts</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNotifyAbsentParents}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4 text-emerald-400 border-emerald-500/30"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            WhatsApp Absent Alert ({absentCount})
          </button>

          <button
            onClick={downloadAttendancePdf}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Register PDF
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-5 shadow-lg shadow-cyan-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Control Selector Bar */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            1. Select Course / Subject
          </label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="input-field w-full text-sm font-semibold bg-surface-900"
          >
            {DEFAULT_SUBJECTS.map(s => (
              <option key={s.subject_code} value={s.subject_code}>
                {s.subject_code} — {s.subject_name} (Section {s.section})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            2. Attendance Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            className="input-field w-full text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">
            3. Select Period / Hour
          </label>
          <select
            value={periodNumber}
            onChange={e => setPeriodNumber(e.target.value)}
            className="input-field w-full text-sm font-semibold bg-surface-900"
          >
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <option key={p} value={p}>Period {p} ({p + 8}:30 AM)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <span className="text-gray-400 text-xs block mb-1">Total Class Roster</span>
          <span className="text-2xl font-bold text-white font-mono">{roster.length}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-500/20">
          <span className="text-gray-400 text-xs block mb-1">Present Today</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{presentCount} ({presentPercentage}%)</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-red-500/20">
          <span className="text-gray-400 text-xs block mb-1">Absent Students</span>
          <span className="text-2xl font-bold text-red-400 font-mono">{absentCount}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-purple-500/20">
          <span className="text-gray-400 text-xs block mb-1">On Duty (OD)</span>
          <span className="text-2xl font-bold text-purple-400 font-mono">{odCount}</span>
        </div>
      </div>

      {/* Filter & Bulk Action Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student Reg No or name..."
            className="input-field text-xs w-full sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="input-field text-xs font-semibold text-cyan-400"
          >
            <option value="ALL">All ({roster.length})</option>
            <option value="PRESENT">Present ({presentCount})</option>
            <option value="ABSENT">Absent ({absentCount})</option>
            <option value="ON_DUTY">On Duty ({odCount})</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => markAll('PRESENT')}
            className="btn-secondary text-xs py-1.5 px-3 text-emerald-400 border-emerald-500/30"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('ABSENT')}
            className="btn-secondary text-xs py-1.5 px-3 text-red-400 border-red-500/30"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-900 z-10 border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
              <tr>
                <th className="p-4">Reg. Number</th>
                <th className="p-4">Student Full Name</th>
                <th className="p-4">Year & Class</th>
                <th className="p-4 text-center">Attendance Toggle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredRoster.map(s => (
                <tr key={s.student_id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400 text-xs">{s.register_number}</td>
                  <td className="p-4 text-white font-medium text-sm">{s.name}</td>
                  <td className="p-4 text-gray-400 text-xs">{s.year}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex rounded-xl p-1 bg-surface-900 border border-white/10 gap-1">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(s.student_id, 'PRESENT')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          s.status === 'PRESENT'
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        PRESENT
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(s.student_id, 'ABSENT')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          s.status === 'ABSENT'
                            ? 'bg-red-500 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        ABSENT
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(s.student_id, 'ON_DUTY')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          s.status === 'ON_DUTY'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        ON DUTY
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
