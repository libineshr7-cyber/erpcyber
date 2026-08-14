import React from 'react';
import { Table } from '../ui/Table';

export const AuditLogTable: React.FC = () => {
  return (
    <Table headers={['Time', 'User', 'Action', 'Resource', 'Result']}>
      <tr><td colSpan={5} className="p-4 text-center">No audit logs</td></tr>
    </Table>
  );
};
