import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';

export const StudentsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Students Management" />
      <Table headers={['Reg No', 'Name', 'Year', 'Section', 'Actions']}>
        <tr><td colSpan={5} className="p-4 text-center">No students found</td></tr>
      </Table>
    </div>
  );
};
