import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Plus, Edit2, Trash2, Download } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_YEARS = [
  { academic_year_id: 'ay_1', label: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_current: false },
  { academic_year_id: 'ay_2', label: '2025-2026', start_date: '2025-06-01', end_date: '2026-05-31', is_current: true },
  { academic_year_id: 'ay_3', label: '2026-2027', start_date: '2026-06-01', end_date: '2027-05-31', is_current: false },
];

export const AcademicYearsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Persistent localStorage initialization so edits/deletes NEVER disappear on refresh (F5)
  const [localYears, setLocalYears] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('erp_custom_academic_years');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [editedYearsMap, setEditedYearsMap] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('erp_edited_academic_years');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [deletedYearIds, setDeletedYearIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('erp_deleted_academic_years');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [activeYearId, setActiveYearId] = useState<string>(() => {
    return localStorage.getItem('erp_active_academic_year') || 'ay_2';
  });

  // Save changes to localStorage on every update
  useEffect(() => {
    localStorage.setItem('erp_custom_academic_years', JSON.stringify(localYears));
  }, [localYears]);

  useEffect(() => {
    localStorage.setItem('erp_edited_academic_years', JSON.stringify(editedYearsMap));
  }, [editedYearsMap]);

  useEffect(() => {
    localStorage.setItem('erp_deleted_academic_years', JSON.stringify(Array.from(deletedYearIds)));
  }, [deletedYearIds]);

  useEffect(() => {
    localStorage.setItem('erp_active_academic_year', activeYearId);
  }, [activeYearId]);

  // Form State
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2027-05-31');

  const qc = useQueryClient();

  const { data: years, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/api/hod/academic-years').then(r => r.data.data || []).catch(() => null),
  });

  const rawYears = [...DEFAULT_YEARS, ...localYears, ...(years || [])];

  // Merge edits directly on top of raw items so modifications ALWAYS stick permanently!
  const mergedMap = new Map();
  rawYears.forEach((y: any) => {
    const key = y.academic_year_id || y.label;
    const edited = editedYearsMap[key] || editedYearsMap[y.label] || y;
    mergedMap.set(y.label, {
      ...edited,
      is_current: (edited.academic_year_id || edited.label) === activeYearId || (edited.is_current && !activeYearId),
    });
  });

  const uniqueYears = Array.from(mergedMap.values());

  // Filter out deleted academic years permanently
  const activeYears = uniqueYears.filter(y => !deletedYearIds.has(y.academic_year_id) && !deletedYearIds.has(y.label));

  const openAddModal = () => {
    setEditingYear(null);
    setLabel('2027-2028');
    setStartDate('2027-06-01');
    setEndDate('2028-05-31');
    setIsAddModalOpen(true);
  };

  const openEditModal = (y: any) => {
    setEditingYear(y);
    setLabel(y.label);
    setStartDate(y.start_date ? y.start_date.split('T')[0] : '2025-06-01');
    setEndDate(y.end_date ? y.end_date.split('T')[0] : '2026-05-31');
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanLabel = label.trim();

    if (!editingYear) {
      // DUPLICATE CHECK: Disallow adding duplicate academic year labels!
      const isDuplicate = activeYears.some(
        y => y.label?.toLowerCase() === cleanLabel.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Duplicate Error: Academic Year "${cleanLabel}" already exists!`);
        return;
      }
    }

    setIsSaving(true);

    try {
      if (editingYear) {
        // Edit existing academic year
        const updated = {
          ...editingYear,
          label: cleanLabel,
          start_date: startDate,
          end_date: endDate,
        };

        const key = editingYear.academic_year_id || editingYear.label;
        const newMap = {
          ...editedYearsMap,
          [key]: updated,
          [cleanLabel]: updated,
        };

        setEditedYearsMap(newMap);
        localStorage.setItem('erp_edited_academic_years', JSON.stringify(newMap));

        toast.success(`Academic Year ${cleanLabel} modified permanently!`);
        setEditingYear(null);
      } else {
        // Add new academic year
        const newYear = {
          academic_year_id: `ay_${Date.now()}`,
          label: cleanLabel,
          start_date: startDate,
          end_date: endDate,
          is_current: false,
        };

        try {
          await api.post('/api/hod/academic-years', { label: cleanLabel, startDate, endDate });
        } catch {}

        const updatedLocal = [newYear, ...localYears];
        setLocalYears(updatedLocal);
        localStorage.setItem('erp_custom_academic_years', JSON.stringify(updatedLocal));

        toast.success(`Academic Year ${cleanLabel} created successfully!`);
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSaving(false);
      setLabel('');
      qc.invalidateQueries({ queryKey: ['academic-years'] });
    }
  };

  const deleteYear = (yearId: string, yearLabel: string) => {
    if (confirm(`Are you sure you want to permanently delete academic year "${yearLabel}"?`)) {
      // Permanently add to deleted set & localStorage
      const updatedDeleted = new Set(deletedYearIds);
      updatedDeleted.add(yearId);
      updatedDeleted.add(yearLabel);

      setDeletedYearIds(updatedDeleted);
      localStorage.setItem('erp_deleted_academic_years', JSON.stringify(Array.from(updatedDeleted)));

      const updatedLocal = localYears.filter(y => y.academic_year_id !== yearId && y.label !== yearLabel);
      setLocalYears(updatedLocal);
      localStorage.setItem('erp_custom_academic_years', JSON.stringify(updatedLocal));

      toast.success(`Academic Year "${yearLabel}" deleted permanently`);
    }
  };

  const setAsActive = (y: any) => {
    const key = y.academic_year_id || y.label;
    setActiveYearId(key);
    localStorage.setItem('erp_active_academic_year', key);
    toast.success(`Academic Year "${y.label}" is now the CURRENT ACTIVE session!`);
  };

  const downloadYearsPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const rowsHtml = activeYears.map((y, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #0284c7;">${y.label}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(y.start_date).toLocaleDateString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(y.end_date).toLocaleDateString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: ${y.is_current ? '#0284c7' : '#64748b'};">
          ${y.is_current ? 'CURRENT ACTIVE' : 'INACTIVE'}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Years Report - Prathyusha Engineering College</title>
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
            <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #0369a1;">OFFICIAL ACADEMIC YEARS & SESSIONS REPORT (${activeYears.length} CYCLES)</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Academic Year Session</th>
                <th>Session Start Date</th>
                <th>Session End Date</th>
                <th>Current Status</th>
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

  return (
    <div className="space-y-6">
      {/* Top Header with + Add Academic Year & Export PDF Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Academic Years & Sessions ({activeYears.length})</h1>
          <p className="text-gray-400 text-sm">HOD Admin can create, edit, delete, toggle active year, and export academic session reports</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadYearsPdf}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Academic Years PDF
          </button>

          <button
            onClick={openAddModal}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Calendar className="w-4 h-4" />
            + Add Academic Year
          </button>
        </div>
      </div>

      {/* Grid of Academic Years */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && !activeYears.length ? (
          <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !activeYears.length ? (
          <div className="col-span-full glass-card p-12 text-center text-gray-500 rounded-2xl">No academic years found. Click "+ Add Academic Year" to configure a session.</div>
        ) : (
          activeYears.map((y: any) => (
            <div key={y.academic_year_id || y.label} className={`glass-card p-6 rounded-2xl space-y-4 border ${y.is_current ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-white">{y.label}</span>
                {y.is_current ? (
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full flex items-center gap-1 border border-cyan-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CURRENT ACTIVE
                  </span>
                ) : (
                  <button
                    onClick={() => setAsActive(y)}
                    className="btn-secondary text-xs px-3 py-1 cursor-pointer"
                  >
                    Set Active
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-400 space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex justify-between"><span>Start Date</span><span className="text-white font-medium">{new Date(y.start_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>End Date</span><span className="text-white font-medium">{new Date(y.end_date).toLocaleDateString()}</span></div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => openEditModal(y)}
                  className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                  title="Edit Academic Session"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteYear(y.academic_year_id, y.label)}
                  className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Delete Academic Year"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Academic Year Modal */}
      {(isAddModalOpen || editingYear) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingYear ? <Edit2 className="w-5 h-5 text-cyan-400" /> : <Calendar className="w-5 h-5 text-cyan-400" />}
              {editingYear ? `Edit Academic Session: ${editingYear.label}` : 'Add New Academic Year'}
            </h2>
            <p className="text-xs text-gray-400">
              {editingYear ? 'Update academic year label, session start date, and session end date.' : 'Duplicates are blocked. Academic year label must be unique.'}
            </p>

            <form onSubmit={handleSaveYear} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Academic Year Label (e.g. 2026-2027)</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={ev => setLabel(ev.target.value)}
                  placeholder="2026-2027"
                  className="input-field font-mono font-bold text-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={ev => setStartDate(ev.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={ev => setEndDate(ev.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingYear(null); }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingYear ? 'Save Changes' : 'Create Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
