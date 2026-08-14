import React from 'react';
import { Card } from '../ui/Card';
import { Event } from '../../types/events.types';

export const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <Card className="overflow-hidden p-0 flex flex-col h-full">
      {event.imageUrl && (
        <div className="h-40 bg-surface-700 w-full bg-cover bg-center" style={{ backgroundImage: `url(${event.imageUrl})` }} />
      )}
      <div className="p-4 flex-1">
        <h3 className="font-display font-medium text-lg text-slate-200">{event.title}</h3>
        <p className="text-xs text-brand-400 mt-1">{event.date}</p>
        <p className="text-sm text-slate-400 mt-2 line-clamp-2">{event.description}</p>
      </div>
    </Card>
  );
};
