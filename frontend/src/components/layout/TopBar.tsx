import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Megaphone, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const DEFAULT_ANNOUNCEMENTS = [
  { announcement_id: 'ann_1', title: 'Schedule for Internal Assessment-1 (IAT-1)', content: 'IAT-1 exams for 2nd and 3rd year B.E. Cybersecurity students commence on Sept 15, 2025.', category: 'EXAM', target_audience: 'ALL_STUDENTS', pinned: true, created_at: '2025-09-01' },
  { announcement_id: 'ann_2', title: 'Staff Circular: Submit Internal Marks by Friday', content: 'All teaching faculty members must complete mark entry and submit for HOD approval before Sept 20.', category: 'CIRCULAR', target_audience: 'ALL_STAFF', pinned: true, created_at: '2025-09-05' },
  { announcement_id: 'ann_3', title: 'Registration Open for National Cyber CTF Hackathon', content: 'Register your teams of 3 for the upcoming 24-hour CTF. Open to all students & faculty.', category: 'EVENT', target_audience: 'EVERYONE', pinned: false, created_at: '2025-09-10' },
];

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [relevantNotifs, setRelevantNotifs] = useState<any[]>([]);

  const isHOD = user?.role?.toUpperCase().includes('HOD');

  useEffect(() => {
    if (isHOD) return; // HOD tab doesn't need notification popup

    const loadNotifs = () => {
      try {
        const savedCustom = JSON.parse(localStorage.getItem('erp_custom_announcements') || '[]');
        const savedEdited = JSON.parse(localStorage.getItem('erp_edited_announcements') || '{}');
        const deletedSet = new Set(JSON.parse(localStorage.getItem('erp_deleted_announcements') || '[]'));

        const raw = [...DEFAULT_ANNOUNCEMENTS, ...savedCustom];
        const mergedMap = new Map();
        raw.forEach(a => {
          const key = a.announcement_id || a.title;
          const edited = savedEdited[key] || savedEdited[a.title] || a;
          mergedMap.set(a.title, edited);
        });

        const active = Array.from(mergedMap.values()).filter((a: any) => !deletedSet.has(a.announcement_id) && !deletedSet.has(a.title));

        const role = user?.role?.toUpperCase() || 'STUDENT';
        const filtered = active.filter((a: any) => {
          const target = a.target_audience || 'ALL_STUDENTS';
          if (role.includes('STAFF')) return target === 'ALL_STAFF' || target === 'EVERYONE';
          return target === 'ALL_STUDENTS' || target === 'EVERYONE';
        });

        setRelevantNotifs(filtered);
      } catch {
        setRelevantNotifs(DEFAULT_ANNOUNCEMENTS);
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 1500);
    return () => clearInterval(interval);
  }, [user?.role, isHOD]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-4 relative">
      {/* Bell Notification Icon — Rendered ONLY for Staff & Students (hidden for HOD) */}
      {!isHOD && (
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 hover:bg-white/10 text-cyan-400 rounded-xl transition-colors relative cursor-pointer"
            title="View HOD Announcements & Notifications"
          >
            <Bell className="w-5 h-5" />
            {relevantNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
            {relevantNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card p-4 rounded-2xl border border-cyan-500/30 shadow-2xl z-50 animate-slide-up space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  HOD Notifications ({relevantNotifs.length})
                </span>
                <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-white/5 pr-1">
                {!relevantNotifs.length ? (
                  <div className="text-center py-6 text-xs text-gray-500">No new notifications.</div>
                ) : (
                  relevantNotifs.map((n: any, idx) => (
                    <div key={idx} className="pt-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{n.title}</span>
                        <span className="text-[10px] text-gray-500">{new Date(n.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2">{n.content}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 inline-block border border-cyan-500/20">
                        Target: {n.target_audience === 'ALL_STAFF' ? 'Staff Only' : n.target_audience === 'ALL_STUDENTS' ? 'Students Only' : 'Everyone'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <span className="text-sm font-medium text-slate-300">
        @{user?.username || 'User'} <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">{user?.role}</span>
      </span>
      
      <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer">
        Logout
      </button>
    </div>
  );
};
