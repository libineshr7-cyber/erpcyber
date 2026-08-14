import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search } from 'lucide-react';
import api from '../../api/client';

export const AuditLogsPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: () => api.get(`/api/hod/audit-logs?action=${actionFilter}&limit=100`).then(r => r.data),
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Audit Logs</h1>
        <p className="text-gray-400 text-sm">Tamper-evident audit trail of all academic, mark, and administrative changes</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !logs?.length ? (
          <div className="p-12 text-center text-gray-500">No audit log entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {logs.map((l: any) => (
                  <tr key={l.log_id} className="hover:bg-white/5">
                    <td className="p-4 text-xs font-mono text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-cyan-400 text-xs">{l.action}</td>
                    <td className="p-4 text-white text-xs">{l.username || 'system'}</td>
                    <td className="p-4 text-xs font-semibold"><span className="px-2 py-0.5 rounded bg-white/10 text-gray-300">{l.role || 'SYSTEM'}</span></td>
                    <td className="p-4 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${l.result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {l.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
