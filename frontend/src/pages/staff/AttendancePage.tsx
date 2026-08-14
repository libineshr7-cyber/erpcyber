import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Student Attendance</h1>
        <p className="text-gray-400">Classroom attendance recording and eligibility tracking</p>
      </div>

      <div className="glass-card p-16 rounded-3xl text-center border border-purple-500/20 max-w-2xl mx-auto space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl text-purple-400">
          📋
        </div>
        <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full uppercase tracking-wider">
          Module Status: Coming Soon
        </span>
        <h2 className="text-2xl font-bold text-white">Attendance Management Module</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          The biometrics and daily attendance recording system is currently undergoing scheduled maintenance. Mark entry and PDF reports are active!
        </p>
      </div>
    </div>
  );
};
