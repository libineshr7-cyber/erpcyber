import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const EventsManagePage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('WORKSHOP');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('Seminar Hall A');

  const qc = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events-list'],
    queryFn: () => api.get('/api/hod/events').then(r => r.data.data || []),
  });

  const addEventMutation = useMutation({
    mutationFn: () => api.post('/api/hod/events', { title, description, eventType, eventDate, venue }),
    onSuccess: () => {
      toast.success(`Event ${title} created!`);
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      qc.invalidateQueries({ queryKey: ['events-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create event'),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/hod/events/${id}`),
    onSuccess: () => {
      toast.success('Event archived');
      qc.invalidateQueries({ queryKey: ['events-list'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Department Events</h1>
          <p className="text-gray-400 text-sm">Schedule and publish workshops, hackathons, and guest lectures</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" /> + Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !events?.length ? (
          <div className="col-span-full glass-card p-12 text-center text-gray-500 rounded-2xl">No events scheduled yet.</div>
        ) : (
          events.map((e: any) => (
            <div key={e.event_id} className="glass-card p-6 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 uppercase">{e.event_type}</span>
                <button onClick={() => deleteEventMutation.mutate(e.event_id)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="text-lg font-bold text-white">{e.title}</h3>
              <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
              <div className="text-xs text-gray-400 pt-2 border-t border-white/5 flex justify-between">
                <span>Date: {new Date(e.event_date).toLocaleDateString()}</span>
                <span>Venue: {e.venue}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400" /> Create New Event</h2>
            <form onSubmit={ev => { ev.preventDefault(); addEventMutation.mutate(); }} className="space-y-3 text-sm">
              <input type="text" required value={title} onChange={ev => setTitle(ev.target.value)} placeholder="Event Title" className="input-field" />
              <textarea rows={3} value={description} onChange={ev => setDescription(ev.target.value)} placeholder="Description" className="input-field w-full" />
              <div className="grid grid-cols-2 gap-3">
                <select value={eventType} onChange={ev => setEventType(ev.target.value)} className="input-field">
                  <option value="WORKSHOP">Workshop</option>
                  <option value="HACKATHON">Hackathon</option>
                  <option value="SEMINAR">Seminar</option>
                </select>
                <input type="date" required value={eventDate} onChange={ev => setEventDate(ev.target.value)} className="input-field" />
              </div>
              <input type="text" value={venue} onChange={ev => setVenue(ev.target.value)} placeholder="Venue" className="input-field" />
              <div className="flex gap-3 pt-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={addEventMutation.isPending} className="btn-primary text-xs">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
