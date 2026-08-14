import React from 'react';
import { Input } from '../ui/Input';

interface MarkEntryRowProps {
  student: { id: string; regNo: string; name: string };
  maxMarks: number;
}

export const MarkEntryRow: React.FC<MarkEntryRowProps> = ({ student, maxMarks }) => {
  return (
    <tr className="border-b border-white/[0.05] hover:bg-white/[0.02]">
      <td className="p-4">{student.regNo}</td>
      <td className="p-4">{student.name}</td>
      <td className="p-4">
        <Input type="number" max={maxMarks} placeholder="0" className="w-24 text-center" />
      </td>
      <td className="p-4 text-center">
        <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-surface-800 text-brand-500 focus:ring-brand-500" />
      </td>
    </tr>
  );
};
