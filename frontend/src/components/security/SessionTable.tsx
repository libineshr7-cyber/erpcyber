import React from 'react';
import { Table } from '../ui/Table';

export const SessionTable: React.FC = () => {
  return (
    <Table headers={['User', 'Role', 'Browser', 'Last Activity', 'Action']}>
      <tr><td colSpan={5} className="p-4 text-center">No active sessions</td></tr>
    </Table>
  );
};
