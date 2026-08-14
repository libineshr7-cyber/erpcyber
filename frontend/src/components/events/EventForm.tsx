import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const EventForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  return (
    <form className="space-y-4 text-left" onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
      <Input label="Event Title" />
      <Input label="Date" type="date" />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea className="input-field min-h-[100px]" />
      </div>
      <Button type="submit">Save Event</Button>
    </form>
  );
};
