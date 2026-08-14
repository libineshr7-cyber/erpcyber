import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';

export const SubjectsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Subjects Management" />
      <Table headers={['Code', 'Name', 'Semester', 'Actions']}>
        <tr><td colSpan={4} className="p-4 text-center">No subjects found</td></tr>
      </Table>
    </div>
  );
};
