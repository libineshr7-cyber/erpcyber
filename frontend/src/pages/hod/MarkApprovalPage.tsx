import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { MarkApprovalTable } from '../../components/marks/MarkApprovalTable';

export const MarkApprovalPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Mark Approvals" />
      <div className="glass-card"><MarkApprovalTable /></div>
    </div>
  );
};
