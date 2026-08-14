import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { SessionTable } from '../../components/security/SessionTable';

export const SessionsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Active Sessions" />
      <div className="glass-card"><SessionTable /></div>
    </div>
  );
};
