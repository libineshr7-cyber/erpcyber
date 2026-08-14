import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Plus } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const AcademicYearsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [label, setLabel] = useState('2025-2026');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [endDate, setEndDate] = useState('2026-05-31');

  const qc = useQueryClient();

  const { data: years, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/api/hod/academic-years').then(r => r.data.data || []),
  });

  const addYearMutation = useMutation({
    mutationFn: () => api.post('/api/hod/academic-years', { label, startDate, endDate }),
    onSuccess: () => {
      toast.success(`Academic Year ${label} created!`);
      setIsAddModalOpen(false);
      qc.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create academic year'),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/hod/academic-years/${id}/set-current`),
    onSuccess: () => {
      toast.success('Active academic year updated!');
      qc.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: () => toast.error('Failed to set current academic year'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Academic Years & Sessions</h1>
          <p className="text-gray-400 text-sm">Configure multi-year academic cycles and toggle current active year</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Calendar className="w-4 h-4" />
          + Add Academic Year
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !years?.length ? (
          <div className="col-span-full glass-card p-12 text-center text-gray-500 rounded-2xl">No academic years found.</div>
        ) : (
          years.map((y: any) => (
            <div key={y.academic_year_id} className={`glass-card p-6 rounded-2xl space-y-4 border ${y.is_current ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-white">{y.label}</span>
                {y.is_current ? (
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CURRENT ACTIVE
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentMutation.mutate(y.academic_year_id)}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Set Active
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-white/5">
                <div className="flex justify-between"><span>Start Date</span><span className="text-white">{new Date(y.start_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>End Date</span><span className="text-white">{new Date(y.end_date).toLocaleDateString()}</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Add Academic Year
            </h2>

            <form onSubmit={ev => { ev.preventDefault(); addYearMutation.mutate(); }} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Academic Year Label (e.g. 2026-2027)</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={ev => setLabel(ev.target.value)}
                  placeholder="2026-2027"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={ev => setStartDate(ev.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={ev => setEndDate(ev.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={addYearMutation.isPending} className="btn-primary text-xs">Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
