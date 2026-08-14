import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const SecurityCenterPage: React.FC = () => {
  const qc = useQueryClient();

  const { data: overview } = useQuery({
    queryKey: ['security-overview'],
    queryFn: () => api.get('/api/hod/security/overview').then(r => r.data.data),
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: () => api.get('/api/hod/security/events').then(r => r.data.data?.events || []),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/hod/security/events/${id}/resolve`),
    onSuccess: () => {
      toast.success('Security anomaly resolved');
      qc.invalidateQueries({ queryKey: ['security-events'] });
      qc.invalidateQueries({ queryKey: ['security-overview'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Security Center</h1>
        <p className="text-gray-400 text-sm">Real-time threat monitoring, anomaly detection, and session security audit</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-gray-400 text-xs block mb-1">Total Security Events</span>
          <span className="text-3xl font-bold text-white">{overview?.totalEvents || 0}</span>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-gray-400 text-xs block mb-1">Unresolved Anomalies</span>
          <span className="text-3xl font-bold text-amber-400">{overview?.unresolvedEvents || 0}</span>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <span className="text-gray-400 text-xs block mb-1">Active User Sessions</span>
          <span className="text-3xl font-bold text-cyan-400">{overview?.activeSessions || 1}</span>
        </div>
      </div>

      {/* Anomaly Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Detected Security Events
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !events?.length ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span>Zero threat anomalies detected! System status nominal.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Type</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Detected At</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {events.map((e: any) => (
                  <tr key={e.event_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-cyan-400 text-xs">{e.event_type}</td>
                    <td className="p-4 text-xs font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full ${e.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {e.severity}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 text-xs">{e.description}</td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      {e.resolved ? (
                        <span className="text-xs text-emerald-400 flex items-center justify-end gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>
                      ) : (
                        <button onClick={() => resolveMutation.mutate(e.event_id)} className="btn-primary text-xs px-3 py-1">Resolve</button>
                      )}
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
