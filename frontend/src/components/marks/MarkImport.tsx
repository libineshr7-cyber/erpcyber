import React from 'react';
import { Button } from '../ui/Button';

export const MarkImport: React.FC = () => {
  return (
    <div className="p-6 glass-card text-center border-dashed border-2 border-slate-600 hover:border-brand-500 transition-colors">
      <h3 className="heading-2 mb-2">Upload Excel Marks</h3>
      <p className="text-slate-400 mb-4">Drag and drop your .xlsx file here</p>
      <Button>Browse Files</Button>
    </div>
  );
};
