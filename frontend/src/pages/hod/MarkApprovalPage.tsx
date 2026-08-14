import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const MarkApprovalPage: React.FC = () => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => api.get('/api/marks/pending-approval?limit=100').then(r => r.data),
  });

  const pendingMarks = data?.data || [];

  const approveMutation = useMutation({
    mutationFn: (markId: string) => api.post(`/api/marks/${markId}/approve`),
    onSuccess: () => {
      toast.success('Mark entry approved!');
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
    onError: () => toast.error('Failed to approve mark'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/api/marks/${rejectId}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      toast.success('Mark entry rejected back to staff');
      setRejectId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
    onError: () => toast.error('Failed to reject mark'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Mark Approvals</h1>
        <p className="text-gray-400">Review faculty-submitted examination marks before publishing to student portals</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !pendingMarks.length ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>All mark submissions have been reviewed! No pending approvals.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Exam</th>
                  <th className="p-4 text-center">Submitted Marks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {pendingMarks.map((m: any) => (
                  <tr key={m.mark_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-cyan-400">{m.register_number}</td>
                    <td className="p-4 text-white font-medium">{m.student_name}</td>
                    <td className="p-4 text-gray-300 text-xs">{m.subject_code} — {m.subject_name}</td>
                    <td className="p-4 text-gray-300 text-xs">{m.exam_name}</td>
                    <td className="p-4 text-center font-bold text-white">
                      {m.is_absent ? <span className="text-amber-400">ABSENT</span> : `${m.marks_obtained} / ${m.maximum_marks}`}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => approveMutation.mutate(m.mark_id)}
                        disabled={approveMutation.isPending}
                        className="btn-primary text-xs px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(m.mark_id)}
                        className="btn-danger text-xs px-3 py-1"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-red-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Reject Mark Submission
            </h2>
            <p className="text-xs text-gray-400">Provide reason for rejection to send back to teaching faculty.</p>

            <form onSubmit={ev => { ev.preventDefault(); rejectMutation.mutate(); }} className="space-y-3 text-sm">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={ev => setRejectReason(ev.target.value)}
                placeholder="Reason for rejection (e.g. Total marks mismatch)..."
                className="input-field w-full"
              />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setRejectId(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={rejectMutation.isPending} className="btn-danger text-xs">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
