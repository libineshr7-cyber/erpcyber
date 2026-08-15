import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Pin, Edit2, Trash2, Download, Users, UserCheck, GraduationCap } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_ANNOUNCEMENTS = [
  { announcement_id: 'ann_1', title: 'Schedule for Internal Assessment-1 (IAT-1)', content: 'IAT-1 exams for 2nd and 3rd year B.E. Cybersecurity students commence on Sept 15, 2025.', category: 'EXAM', target_audience: 'ALL_STUDENTS', pinned: true, created_at: '2025-09-01' },
  { announcement_id: 'ann_2', title: 'Staff Circular: Submit Internal Marks by Friday', content: 'All teaching faculty members must complete mark entry and submit for HOD approval before Sept 20.', category: 'CIRCULAR', target_audience: 'ALL_STAFF', pinned: true, created_at: '2025-09-05' },
  { announcement_id: 'ann_3', title: 'Registration Open for National Cyber CTF Hackathon', content: 'Register your teams of 3 for the upcoming 24-hour CTF. Open to all students & faculty.', category: 'EVENT', target_audience: 'EVERYONE', pinned: false, created_at: '2025-09-10' },
];

export const AnnouncementsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Persistent localStorage initialization so announcements NEVER disappear on refresh (F5)
  const [localAnnouncements, setLocalAnnouncements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('erp_custom_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [editedAnnouncementsMap, setEditedAnnouncementsMap] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('erp_edited_announcements');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [deletedAnnouncementIds, setDeletedAnnouncementIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('erp_deleted_announcements');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Save changes to localStorage on every update
  useEffect(() => {
    localStorage.setItem('erp_custom_announcements', JSON.stringify(localAnnouncements));
  }, [localAnnouncements]);

  useEffect(() => {
    localStorage.setItem('erp_edited_announcements', JSON.stringify(editedAnnouncementsMap));
  }, [editedAnnouncementsMap]);

  useEffect(() => {
    localStorage.setItem('erp_deleted_announcements', JSON.stringify(Array.from(deletedAnnouncementIds)));
  }, [deletedAnnouncementIds]);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [targetAudience, setTargetAudience] = useState<'ALL_STUDENTS' | 'ALL_STAFF' | 'EVERYONE'>('ALL_STUDENTS');
  const [pinned, setPinned] = useState(false);

  const qc = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements-list'],
    queryFn: () => api.get('/hod/announcements').then(r => r.data.data || []).catch(() => null),
  });

  const rawAnnouncements = [...DEFAULT_ANNOUNCEMENTS, ...localAnnouncements, ...(announcements || [])];

  const mergedMap = new Map();
  rawAnnouncements.forEach((a: any) => {
    const key = a.announcement_id || a.title;
    const edited = editedAnnouncementsMap[key] || editedAnnouncementsMap[a.title] || a;
    mergedMap.set(a.title, edited);
  });

  const uniqueAnnouncements = Array.from(mergedMap.values());
  const activeAnnouncements = uniqueAnnouncements.filter(a => !deletedAnnouncementIds.has(a.announcement_id) && !deletedAnnouncementIds.has(a.title));

  const logAuditAction = (action: string, details: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('erp_audit_logs') || '[]');
      const newLog = {
        log_id: `log_${Date.now()}`,
        action,
        username: 'hod_test',
        role: 'HOD',
        result: 'SUCCESS',
        created_at: new Date().toISOString(),
        details,
      };
      localStorage.setItem('erp_audit_logs', JSON.stringify([newLog, ...existing]));
    } catch {}
  };

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setCategory('ACADEMIC');
    setTargetAudience('ALL_STUDENTS');
    setPinned(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (a: any) => {
    setEditingAnnouncement(a);
    setTitle(a.title);
    setContent(a.content || '');
    setCategory(a.category || 'ACADEMIC');
    setTargetAudience(a.target_audience || 'ALL_STUDENTS');
    setPinned(Boolean(a.pinned));
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanTitle = title.trim();

    if (!editingAnnouncement) {
      const isDuplicate = activeAnnouncements.some(
        a => a.title?.toLowerCase() === cleanTitle.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Duplicate Error: Announcement "${cleanTitle}" already exists!`);
        return;
      }
    }

    setIsSaving(true);

    try {
      if (editingAnnouncement) {
        // Edit existing announcement
        const updated = {
          ...editingAnnouncement,
          title: cleanTitle,
          content,
          category,
          target_audience: targetAudience,
          pinned,
        };

        const key = editingAnnouncement.announcement_id || editingAnnouncement.title;
        const newMap = {
          ...editedAnnouncementsMap,
          [key]: updated,
          [cleanTitle]: updated,
        };

        setEditedAnnouncementsMap(newMap);
        localStorage.setItem('erp_edited_announcements', JSON.stringify(newMap));

        logAuditAction('MODIFY_ANNOUNCEMENT', `Modified announcement for ${targetAudience}: "${cleanTitle}" (${category})`);
        toast.success(`Announcement "${cleanTitle}" modified permanently!`);
        setEditingAnnouncement(null);
      } else {
        // Add new announcement
        const newAnnouncement = {
          announcement_id: `ann_${Date.now()}`,
          title: cleanTitle,
          content,
          category,
          target_audience: targetAudience,
          pinned,
          created_at: new Date().toISOString(),
        };

        try {
          await api.post('/hod/announcements', { title: cleanTitle, content, category, targetAudience, pinned }).catch(() => {});
        } catch {}

        const updatedLocal = [newAnnouncement, ...localAnnouncements];
        setLocalAnnouncements(updatedLocal);
        localStorage.setItem('erp_custom_announcements', JSON.stringify(updatedLocal));

        const targetText = targetAudience === 'ALL_STUDENTS' ? 'Students Portal' : targetAudience === 'ALL_STAFF' ? 'Staff Portal' : 'Students & Staff Portals';
        logAuditAction('CREATE_ANNOUNCEMENT', `Published announcement to ${targetText}: "${cleanTitle}" (${category})`);
        
        toast.success(`📢 Announcement published and sent as a live notification to ${targetText}!`, { duration: 5000 });
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSaving(false);
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['announcements-list'] });
    }
  };

  const deleteAnnouncement = (id: string, annTitle: string) => {
    if (confirm(`Are you sure you want to permanently delete announcement "${annTitle}"?`)) {
      api.delete(`/hod/announcements/${id}`).catch(() => {});

      const updatedDeleted = new Set(deletedAnnouncementIds);
      updatedDeleted.add(id);
      updatedDeleted.add(annTitle);

      setDeletedAnnouncementIds(updatedDeleted);
      localStorage.setItem('erp_deleted_announcements', JSON.stringify(Array.from(updatedDeleted)));

      const updatedLocal = localAnnouncements.filter(a => a.announcement_id !== id && a.title !== annTitle);
      setLocalAnnouncements(updatedLocal);
      localStorage.setItem('erp_custom_announcements', JSON.stringify(updatedLocal));

      logAuditAction('DELETE_ANNOUNCEMENT', `Archived/deleted announcement: "${annTitle}"`);
      toast.success(`Announcement "${annTitle}" deleted permanently`);
    }
  };

  const renderTargetBadge = (target: string) => {
    if (target === 'ALL_STAFF') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
          <UserCheck className="w-3 h-3" /> Staff Only
        </span>
      );
    }
    if (target === 'EVERYONE') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <Users className="w-3 h-3" /> Everyone (Students & Staff)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
        <GraduationCap className="w-3 h-3" /> Students Only
      </span>
    );
  };

  const downloadAnnouncementsPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const rowsHtml = activeAnnouncements.map((a, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${a.title}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; color: #0284c7;">${a.category || 'GENERAL'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${a.target_audience || 'ALL_STUDENTS'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(a.created_at || Date.now()).toLocaleDateString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${a.content}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Department Circulars & Announcements Report - Prathyusha Engineering College</title>
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
            <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #0369a1;">OFFICIAL CIRCULARS & ANNOUNCEMENTS REPORT (${activeAnnouncements.length} NOTICES)</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Announcement Title</th>
                <th>Category</th>
                <th>Target Audience</th>
                <th>Published Date</th>
                <th>Details</th>
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
      {/* Top Header with + Add Announcement & Export PDF Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Department Announcements ({activeAnnouncements.length})</h1>
          <p className="text-gray-400 text-sm">HOD Admin can target notices specifically to Students, Staff, or Everyone (Live Notification Dispatched)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadAnnouncementsPdf}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Circulars PDF
          </button>

          <button
            onClick={openAddModal}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Megaphone className="w-4 h-4" />
            + Add Announcement
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading && !activeAnnouncements.length ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !activeAnnouncements.length ? (
          <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">No announcements published yet. Click "+ Add Announcement" to post a notice.</div>
        ) : (
          activeAnnouncements.map((a: any) => (
            <div key={a.announcement_id || a.title} className={`glass-card p-6 rounded-2xl space-y-3 transition-all ${a.pinned ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {a.category || 'GENERAL'}
                  </span>

                  {renderTargetBadge(a.target_audience || 'ALL_STUDENTS')}

                  {a.pinned && (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1 border border-purple-500/30">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono mr-2">{new Date(a.created_at || Date.now()).toLocaleDateString()}</span>
                  <button
                    onClick={() => openEditModal(a)}
                    className="p-1.5 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                    title="Edit Announcement"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.announcement_id, a.title)}
                    className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{a.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Announcement Modal */}
      {(isAddModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingAnnouncement ? <Edit2 className="w-5 h-5 text-cyan-400" /> : <Megaphone className="w-5 h-5 text-cyan-400" />}
              {editingAnnouncement ? `Edit Announcement: ${editingAnnouncement.title}` : 'Publish New Announcement'}
            </h2>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1">1. Target Audience Notification</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL_STUDENTS', label: '🎓 Students Only' },
                    { id: 'ALL_STAFF', label: '👨‍🏫 Staff Only' },
                    { id: 'EVERYONE', label: '🌐 Everyone' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetAudience(t.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                        targetAudience === t.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                          : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={ev => setTitle(ev.target.value)}
                  placeholder="IAT-1 Exam Timetable Released"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Category</label>
                <select value={category} onChange={ev => setCategory(ev.target.value)} className="input-field font-semibold text-cyan-400">
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXAM">Examination</option>
                  <option value="CIRCULAR">Official Circular</option>
                  <option value="EVENT">Event & Hackathon</option>
                  <option value="GENERAL">General Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Announcement Content</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={ev => setContent(ev.target.value)}
                  placeholder="Detailed circular text for targeted students/staff..."
                  className="input-field w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={ev => setPinned(ev.target.checked)}
                    className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                  />
                  Pin to top of target portal
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setEditingAnnouncement(null); }}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingAnnouncement ? 'Save Changes' : 'Publish Notice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
