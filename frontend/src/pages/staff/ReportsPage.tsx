import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Download, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const ReportsPage: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => api.get('/api/students?limit=100').then(r => r.data.data || []),
  });

  const { data: exams } = useQuery({
    queryKey: ['exams-list'],
    queryFn: () => api.get('/api/exams').then(r => r.data.data || []),
  });

  const { data: reports, refetch: refetchReports } = useQuery({
    queryKey: ['reports-list'],
    queryFn: () => api.get('/api/reports').then(r => r.data.data || []),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/api/reports/generate', { studentId: selectedStudent, examId: selectedExam }),
    onSuccess: () => {
      toast.success('Academic Report generated successfully!');
      refetchReports();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate report'),
  });

  const handleDownload = (reportId: string) => {
    window.open(`/api/reports/${reportId}`, '_blank');
  };

  const handleWhatsAppSend = async (reportId: string) => {
    try {
      await api.post(`/api/reports/${reportId}/send-whatsapp`);
      toast.success('Report queued/sent via WhatsApp!');
      refetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send WhatsApp message');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">PDF Academic Reports</h1>
        <p className="text-gray-400">Generate, view, and distribute official student academic performance reports</p>
      </div>

      {/* Generator Card */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Generate New Academic Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- Choose Student --</option>
              {students?.map((s: any) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.register_number} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Examination</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- Choose Exam --</option>
              {exams?.map((e: any) => (
                <option key={e.exam_id} value={e.exam_id}>
                  {e.exam_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => generateMutation.mutate()}
              disabled={!selectedStudent || !selectedExam || generateMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate Official PDF
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">Generated Reports History</h3>
          <button onClick={() => refetchReports()} className="text-gray-400 hover:text-cyan-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {!reports?.length ? (
          <div className="p-8 text-center text-gray-500">No reports generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Exam</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Generated At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {reports.map((r: any) => (
                  <tr key={r.report_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-cyan-400">{r.register_number}</td>
                    <td className="p-4 text-white font-medium">{r.student_name}</td>
                    <td className="p-4 text-gray-300">{r.exam_name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(r.generated_at).toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownload(r.report_id)}
                        className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppSend(r.report_id)}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </button>
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
