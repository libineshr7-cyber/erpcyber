import React from 'react';

export const ProgressBar: React.FC<{ progress: number; label: string }> = ({ progress, label }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1 text-slate-300">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-surface-700 rounded-full h-2">
        <div className="bg-brand-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
