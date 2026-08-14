import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';

export const AcademicYearsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Academic Years" />
      <Table headers={['Name', 'Status', 'Actions']}>
        <tr><td colSpan={3} className="p-4 text-center">No academic years found</td></tr>
      </Table>
    </div>
  );
};
