import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { AuditLogTable } from '../../components/security/AuditLogTable';

export const AuditLogsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Audit Logs" />
      <div className="glass-card"><AuditLogTable /></div>
    </div>
  );
};
