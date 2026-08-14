import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Search, Trash2, Key, Mail } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const StaffPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Staff Form State
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-list', search],
    queryFn: () => api.get(`/api/staff?search=${search}`).then(r => r.data),
  });

  const staffList = data?.data || [];

  const addStaffMutation = useMutation({
    mutationFn: () => api.post('/api/staff', {
      employeeId,
      name,
      email,
      designation,
      phone,
    }),
    onSuccess: () => {
      toast.success(`Staff member ${employeeId} added with default password "123"!`);
      setIsAddModalOpen(false);
      setEmployeeId('');
      setName('');
      setEmail('');
      qc.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add staff member'),
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (staffId: string) => api.delete(`/api/staff/${staffId}`),
    onSuccess: () => {
      toast.success('Staff member deleted / deactivated');
      qc.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: () => toast.error('Failed to delete staff member'),
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
      {/* Top Header with + Add Staff Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Faculty & Staff Roster</h1>
          <p className="text-gray-400 text-sm">Manage faculty accounts, employee IDs (ST001-ST007), and reset credentials</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <UserCheck className="w-4 h-4" />
          + Add Staff
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff name or employee ID..."
            className="input-field pl-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !staffList.length ? (
          <div className="p-12 text-center text-gray-500">No staff members found. Click "+ Add Staff" to register faculty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                  <th className="p-4">Emp ID</th>
                  <th className="p-4">Faculty Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {staffList.map((s: any) => (
                  <tr key={s.staff_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-purple-400">{s.employee_id}</td>
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-gray-300 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" /> {s.email}
                    </td>
                    <td className="p-4 text-gray-300 text-xs">{s.designation || 'Assistant Professor'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => resetPasswordMutation.mutate(s.employee_id)}
                        className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors"
                        title="Reset password to 123"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete staff member ${s.name} (${s.employee_id})?`)) {
                            deleteStaffMutation.mutate(s.staff_id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                        title="Delete Staff"
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

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-purple-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Add New Staff Member
            </h2>
            <p className="text-xs text-gray-400">Default login password will be set to <span className="font-mono text-cyan-400">123</span>.</p>

            <form onSubmit={e => { e.preventDefault(); addStaffMutation.mutate(); }} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Employee ID (e.g. ST008)</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="ST008"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="st008@erp.local"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="Assistant Professor"
                  className="input-field"
                />
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
                  disabled={addStaffMutation.isPending}
                  className="btn-primary text-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
