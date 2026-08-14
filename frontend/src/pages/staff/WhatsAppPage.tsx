import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, CheckCircle2, Clock, AlertTriangle, Eye, FileText } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const WhatsAppPage: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState('');

  const { data: exams } = useQuery({
    queryKey: ['exams-list'],
    queryFn: () => api.get('/api/exams').then(r => r.data.data || []),
  });

  const { data: previewData } = useQuery({
    queryKey: ['whatsapp-preview', selectedExam],
    queryFn: () => selectedExam ? api.post('/api/reports/whatsapp/bulk-preview', { examId: selectedExam }).then(r => r.data.data) : null,
    enabled: !!selectedExam,
  });

  const { data: logs } = useQuery({
    queryKey: ['whatsapp-logs'],
    queryFn: () => api.get('/api/reports/whatsapp/logs').then(r => r.data.data || []),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
      case 'READ':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{status}</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">WhatsApp Distribution Center</h1>
        <p className="text-gray-400">Secure automated distribution of academic reports to parent WhatsApp numbers</p>
      </div>

      {/* Bulk Send Card */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          Bulk Report Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Examination to Distribute</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- Select Exam --</option>
              {exams?.map((e: any) => (
                <option key={e.exam_id} value={e.exam_id}>{e.exam_name}</option>
              ))}
            </select>
          </div>
        </div>

        {previewData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <span className="text-xs text-gray-400 block">Total Reports Ready</span>
              <span className="text-2xl font-bold text-white">{previewData.total}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Valid Numbers</span>
              <span className="text-2xl font-bold text-emerald-400">{previewData.valid}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Missing Parent Phone</span>
              <span className="text-2xl font-bold text-amber-400">{previewData.missingPhone}</span>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">Message Delivery Audit Log</h3>
        </div>
        {!logs?.length ? (
          <div className="p-8 text-center text-gray-500">No message dispatch history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Dispatched By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sent Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {logs.map((l: any) => (
                  <tr key={l.message_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-cyan-400">{l.register_number}</td>
                    <td className="p-4 text-white">{l.student_name}</td>
                    <td className="p-4 text-gray-300">@{l.sent_by_username}</td>
                    <td className="p-4">{getStatusBadge(l.status)}</td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(l.created_at).toLocaleString()}</td>
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
