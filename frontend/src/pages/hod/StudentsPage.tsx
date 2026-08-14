import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Trash2, Key, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const StudentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Student Form State
  const [registerNumber, setRegisterNumber] = useState('');
  const [name, setName] = useState('');
  const [programme, setProgramme] = useState('B.E. Cybersecurity');
  const [currentYear, setCurrentYear] = useState('2');
  const [currentSemester, setCurrentSemester] = useState('3');
  const [batch, setBatch] = useState('2024-2028');

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students-list', search, yearFilter],
    queryFn: () => api.get(`/api/students?search=${search}&currentYear=${yearFilter}&limit=100`).then(r => r.data),
  });

  const students = data?.data || [];

  const addStudentMutation = useMutation({
    mutationFn: () => api.post('/api/students', {
      registerNumber,
      name,
      programme,
      currentYear: Number(currentYear),
      currentSemester: Number(currentSemester),
      batch,
      admissionYear: 2024,
    }),
    onSuccess: () => {
      toast.success(`Student ${registerNumber} created successfully with default password "123"!`);
      setIsAddModalOpen(false);
      setRegisterNumber('');
      setName('');
      qc.invalidateQueries({ queryKey: ['students-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create student'),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/api/students/${studentId}`),
    onSuccess: () => {
      toast.success('Student deleted / archived successfully');
      qc.invalidateQueries({ queryKey: ['students-list'] });
    },
    onError: () => toast.error('Failed to delete student'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (username: string) => api.post('/api/auth/admin-reset-password', { targetUsername: username, newPassword: '123' }),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Password reset to "123"');
    },
    onError: () => toast.error('Failed to reset password'),
  });

  return (
    <div className="space-y-6">
      {/* Top Header with + Add Student Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Student Roster</h1>
          <p className="text-gray-400 text-sm">Manage student accounts, academic years, and reset passwords</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <UserPlus className="w-4 h-4" />
          + Add Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reg number or name..."
            className="input-field pl-9 w-full text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year (CS2001-CS2049)</option>
            <option value="3">3rd Year (CS3001-CS3048)</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !students.length ? (
          <div className="p-12 text-center text-gray-500">No students found. Click "+ Add Student" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Programme</th>
                  <th className="p-4">Year & Sem</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {students.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-cyan-400">{s.register_number}</td>
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-gray-300 text-xs">{s.programme}</td>
                    <td className="p-4 text-gray-300 text-xs">Year {s.current_year} (Sem {s.current_semester})</td>
                    <td className="p-4 text-gray-400 text-xs">{s.batch}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => resetPasswordMutation.mutate(s.register_number)}
                        className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors"
                        title="Reset password to 123"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete student ${s.name} (${s.register_number})?`)) {
                            deleteStudentMutation.mutate(s.student_id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-cyan-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Add New Student
            </h2>
            <p className="text-xs text-gray-400">Default login password will be set to <span className="font-mono text-cyan-400">123</span>.</p>

            <form onSubmit={e => { e.preventDefault(); addStudentMutation.mutate(); }} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Register Number (e.g. CS2050)</label>
                <input
                  type="text"
                  required
                  value={registerNumber}
                  onChange={e => setRegisterNumber(e.target.value.toUpperCase())}
                  placeholder="CS2050"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Current Year</label>
                  <select value={currentYear} onChange={e => setCurrentYear(e.target.value)} className="input-field">
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">Current Semester</label>
                  <select value={currentSemester} onChange={e => setCurrentSemester(e.target.value)} className="input-field">
                    <option value="1">Sem 1</option>
                    <option value="2">Sem 2</option>
                    <option value="3">Sem 3</option>
                    <option value="4">Sem 4</option>
                    <option value="5">Sem 5</option>
                    <option value="6">Sem 6</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStudentMutation.isPending}
                  className="btn-primary text-xs"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
