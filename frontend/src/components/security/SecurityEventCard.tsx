import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SecurityEvent } from '../../types/security.types';

export const SecurityEventCard: React.FC<{ event: SecurityEvent }> = ({ event }) => {
  return (
    <Card className="border-l-4 border-l-red-500">
      <div className="flex justify-between">
        <div>
          <Badge variant="danger">{event.severity}</Badge>
          <h4 className="font-medium mt-2 text-slate-200">{event.type}</h4>
          <p className="text-sm text-slate-400 mt-1">{event.description}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{event.timestamp}</p>
          <p className="mt-1">User: {event.user}</p>
        </div>
      </div>
    </Card>
  );
};
