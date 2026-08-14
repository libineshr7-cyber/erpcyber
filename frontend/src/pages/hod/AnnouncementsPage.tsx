import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Pin } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const AnnouncementsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [pinned, setPinned] = useState(false);

  const qc = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements-list'],
    queryFn: () => api.get('/api/hod/announcements').then(r => r.data.data || []),
  });

  const addAnnouncementMutation = useMutation({
    mutationFn: () => api.post('/api/hod/announcements', { title, content, category, pinned }),
    onSuccess: () => {
      toast.success('Announcement published!');
      setIsAddModalOpen(false);
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['announcements-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to publish announcement'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Department Announcements</h1>
          <p className="text-gray-400 text-sm">Publish notices, exam circulars, and official updates</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4" /> + Add Announcement
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !announcements?.length ? (
          <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">No announcements published yet.</div>
        ) : (
          announcements.map((a: any) => (
            <div key={a.announcement_id} className={`glass-card p-6 rounded-2xl space-y-2 ${a.pinned ? 'border-purple-500/40 bg-purple-950/10' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400">{a.category || 'GENERAL'}</span>
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line">{a.content}</p>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-purple-500/30">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-purple-400" /> New Announcement</h2>
            <form onSubmit={ev => { ev.preventDefault(); addAnnouncementMutation.mutate(); }} className="space-y-3 text-sm">
              <input type="text" required value={title} onChange={ev => setTitle(ev.target.value)} placeholder="Title" className="input-field" />
              <textarea rows={4} required value={content} onChange={ev => setContent(ev.target.value)} placeholder="Announcement details..." className="input-field w-full" />
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input type="checkbox" checked={pinned} onChange={ev => setPinned(ev.target.checked)} className="accent-purple-500" /> Pin to top
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                  <button type="submit" disabled={addAnnouncementMutation.isPending} className="btn-primary text-xs">Publish</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
