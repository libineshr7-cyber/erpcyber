import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, Pin, Clock } from 'lucide-react';
import api from '../../api/client';

export const AnnouncementsPage: React.FC = () => {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: () => api.get('/api/student-portal/announcements').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Department Announcements</h1>
        <p className="text-gray-400">Important notices, circulars, and official updates</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !announcements?.length ? (
        <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">No announcements published at this time.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <div key={a.announcement_id} className={`glass-card p-6 rounded-2xl space-y-3 ${a.pinned ? 'border-purple-500/40 bg-purple-950/10' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="w-4 h-4 text-purple-400 rotate-45" />}
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400">
                    {a.category || 'GENERAL'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(a.published_at || a.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
