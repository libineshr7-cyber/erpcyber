import React from 'react';

export const ActivityFeed: React.FC<{ activities: { id: string; text: string; time: string }[] }> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map(act => (
        <div key={act.id} className="flex gap-4 text-sm">
          <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
          <div>
            <p className="text-slate-200">{act.text}</p>
            <p className="text-slate-500 text-xs mt-0.5">{act.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
