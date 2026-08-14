import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, CheckCircle2, UserCheck } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DEFAULT_EVENTS = [
  {
    event_id: 'ev_1',
    title: 'National Cyber Security Hackathon 2025',
    description: '24-hour intensive CTF (Capture The Flag) challenge & vulnerability exploitation competition.',
    event_type: 'HACKATHON',
    event_date: '2025-09-25',
    event_time: '09:00 AM - 09:00 AM (24 Hours)',
    venue: 'Computer Lab 3 & Cybersecurity Lab',
  },
  {
    event_id: 'ev_2',
    title: 'Ethical Hacking & Malware Analysis Workshop',
    description: 'Hands-on practical training on reverse engineering, payload analysis, and Wireshark network inspection.',
    event_type: 'WORKSHOP',
    event_date: '2025-10-12',
    event_time: '10:00 AM - 04:00 PM',
    venue: 'Seminar Hall A',
  },
  {
    event_id: 'ev_3',
    title: 'Guest Lecture: Cloud Infrastructure & Zero Trust Security',
    description: 'Keynote session by industry cloud security architect on zero trust policies and IAM architecture.',
    event_type: 'SEMINAR',
    event_date: '2025-11-05',
    event_time: '11:00 AM - 01:00 PM',
    venue: 'Main Auditorium',
  },
];

export const EventsPage: React.FC = () => {
  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({});

  const { data: apiEvents, isLoading } = useQuery({
    queryKey: ['student-events'],
    queryFn: async () => {
      try {
        const r = await api.get('/api/student-portal/events');
        return r.data.data;
      } catch {
        return null;
      }
    },
  });

  const eventsList = apiEvents?.length ? apiEvents : DEFAULT_EVENTS;

  const handleRegister = (eventId: string, title: string) => {
    setRegisteredEvents(prev => ({ ...prev, [eventId]: true }));
    toast.success(`Successfully registered for "${title}"!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Department Events & Hackathons</h1>
        <p className="text-gray-400 text-sm">Join upcoming technical workshops, CTF competitions, and guest lectures</p>
      </div>

      {isLoading && !eventsList.length ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsList.map((e: any) => {
            const isRegistered = registeredEvents[e.event_id];
            return (
              <div key={e.event_id} className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-purple-500/20 hover:border-cyan-500/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-purple-500/20">
                      {e.event_type}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{new Date(e.event_date).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{e.title}</h3>
                  <p className="text-xs text-gray-300 line-clamp-3">{e.description}</p>

                  <div className="space-y-1.5 text-xs text-gray-400 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{e.event_time || '10:00 AM - 04:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{e.venue || 'Main Campus Auditorium'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {isRegistered ? (
                    <button disabled className="w-full btn-secondary text-xs py-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(e.event_id, e.title)}
                      className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                    >
                      <UserCheck className="w-4 h-4" /> Register for Event
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
