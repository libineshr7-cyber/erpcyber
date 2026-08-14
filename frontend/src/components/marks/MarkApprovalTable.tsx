import React from 'react';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';

export const MarkApprovalTable: React.FC = () => {
  return (
    <Table headers={['Subject', 'Exam', 'Staff', 'Status', 'Actions']}>
      <tr>
        <td className="p-4" colSpan={5} text-center>No pending approvals</td>
      </tr>
    </Table>
  );
};
