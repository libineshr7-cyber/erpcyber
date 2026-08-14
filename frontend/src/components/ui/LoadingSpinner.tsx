import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};
