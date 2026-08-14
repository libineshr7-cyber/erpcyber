import React from 'react';
import { Card } from '../ui/Card';

export const BulkSendPreview: React.FC = () => {
  return (
    <Card>
      <h3 className="heading-2 text-lg mb-2">Bulk Send Preview</h3>
      <p className="text-slate-400 text-sm">Valid reports: 48 | Missing info: 2</p>
    </Card>
  );
};
