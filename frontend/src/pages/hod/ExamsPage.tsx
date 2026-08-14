import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';

export const ExamsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Exams Management" />
      <Table headers={['Name', 'Max Marks', 'Actions']}>
        <tr><td colSpan={3} className="p-4 text-center">No exams found</td></tr>
      </Table>
    </div>
  );
};
