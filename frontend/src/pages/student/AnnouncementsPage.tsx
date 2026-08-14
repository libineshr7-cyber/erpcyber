import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, Pin, Clock, Filter } from 'lucide-react';
import api from '../../api/client';

const DEFAULT_ANNOUNCEMENTS = [
  {
    announcement_id: 'ann_1',
    title: 'IAT-1 Internal Assessment Timetable Released (2025-2026)',
    content: 'The Internal Assessment Test 1 (IAT-1) timetable for 2nd Year (Sem 3) and 3rd Year (Sem 5) B.E. Cybersecurity students has been officially published. Hall tickets and seating arrangements will be displayed on the department notice board.',
    category: 'EXAMINATIONS',
    pinned: true,
    created_at: '2025-08-10',
  },
  {
    announcement_id: 'ann_2',
    title: 'Semester Course Registration & Academic Fee Deadline',
    content: 'All students are instructed to complete their online course registration for the 2025-2026 academic year. Kindly settle any outstanding semester fee dues prior to hall ticket issuance.',
    category: 'ACADEMIC',
    pinned: false,
    created_at: '2025-08-05',
  },
  {
    announcement_id: 'ann_3',
    title: 'Annual Technical Symposium: Call for Cybersecurity Projects & Demos',
    content: 'Submissions are invited for the upcoming National Technical Symposium. Projects in Network Security, Blockchain, Cryptography, and Cloud Defence will be awarded cash prizes. Contact student coordinators for registration.',
    category: 'GENERAL',
    pinned: false,
    created_at: '2025-07-28',
  },
];

export const AnnouncementsPage: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState('');

  const { data: apiAnnouncements, isLoading } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: async () => {
      try {
        const r = await api.get('/api/student-portal/announcements');
        return r.data.data;
      } catch {
        return null;
      }
    },
  });

  const list = apiAnnouncements?.length ? apiAnnouncements : DEFAULT_ANNOUNCEMENTS;
  const filteredList = list.filter((a: any) => !filterCategory || a.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Department Circulars & Notices</h1>
          <p className="text-gray-400 text-sm">Official announcements, examination schedules, and academic guidelines</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-field text-xs py-2"
          >
            <option value="">All Categories ({list.length})</option>
            <option value="EXAMINATIONS">Examinations</option>
            <option value="ACADEMIC">Academic</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {isLoading && !filteredList.length ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((a: any) => (
            <div key={a.announcement_id} className={`glass-card p-6 rounded-2xl space-y-3 ${a.pinned ? 'border-purple-500/40 bg-purple-950/10' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="w-4 h-4 text-purple-400 rotate-45" />}
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 uppercase">
                    {a.category || 'GENERAL'}
                  </span>
                  {a.pinned && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300">PINNED NOTICE</span>}
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
