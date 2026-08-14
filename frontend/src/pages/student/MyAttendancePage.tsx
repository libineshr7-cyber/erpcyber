import React from 'react';
import { Clock } from 'lucide-react';

export const MyAttendancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Attendance</h1>
        <p className="text-gray-400">Subject-wise attendance tracking and eligibility status</p>
      </div>

      <div className="glass-card p-16 rounded-3xl text-center border border-cyan-500/20 max-w-2xl mx-auto space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl text-cyan-400">
          📋
        </div>
        <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full uppercase tracking-wider">
          Coming Soon
        </span>
        <h2 className="text-2xl font-bold text-white">Attendance Tracking</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          The student attendance percentage calculator will be published following the mid-term audit. Your examination marks and official report cards are available!
        </p>
      </div>
    </div>
  );
};
