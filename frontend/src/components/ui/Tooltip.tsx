import React from 'react';

export const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max">
        <div className="bg-surface-700 text-xs text-white px-2 py-1 rounded shadow-lg border border-white/[0.1]">
          {text}
        </div>
      </div>
    </div>
  );
};
