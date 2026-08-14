import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock } from 'lucide-react';
import api from '../../api/client';

export const EventsPage: React.FC = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['student-events'],
    queryFn: () => api.get('/api/student-portal/events').then(r => r.data.data || []),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Department Events</h1>
        <p className="text-gray-400">Workshops, Hackathons, and Academic Seminars</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !events?.length ? (
        <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">No upcoming events scheduled.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((e: any) => (
            <div key={e.event_id} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full uppercase">
                  {e.event_type}
                </span>
                <span className="text-xs text-gray-400">{new Date(e.event_date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{e.title}</h3>
              <p className="text-sm text-gray-300 line-clamp-3">{e.description}</p>
              <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{e.event_time || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{e.venue || 'Main Campus'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
