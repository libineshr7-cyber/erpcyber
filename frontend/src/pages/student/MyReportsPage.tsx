import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import api from '../../api/client';

export const MyReportsPage: React.FC = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['student-reports'],
    queryFn: () => api.get('/api/student-portal/reports').then(r => r.data.data || []),
  });

  const handleDownload = (uuid: string) => {
    window.open(`/api/student-portal/reports/${uuid}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">My Official Reports</h1>
        <p className="text-gray-400">Download cryptographically signed official PDF academic cards</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !reports?.length ? (
          <div className="p-12 text-center text-gray-500">No official report cards available for download yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {reports.map((r: any) => (
              <div key={r.report_id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{r.exam_name} Report Card</h3>
                    <p className="text-xs text-gray-400">Generated on {new Date(r.generated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(r.report_id)}
                  className="btn-primary flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
