import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';

export const StaffPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Staff Management" />
      <Table headers={['Staff ID', 'Name', 'Department', 'Actions']}>
        <tr><td colSpan={4} className="p-4 text-center">No staff found</td></tr>
      </Table>
    </div>
  );
};
