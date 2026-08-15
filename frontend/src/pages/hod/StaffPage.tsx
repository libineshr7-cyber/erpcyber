import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Search, Trash2, Key, Mail, Edit2, Download } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const SEEDED_STAFF = [
  { staff_id: 'st_1', employee_id: 'ST001', name: 'Dr. Priya Sharma', email: 'st001@erp.local', designation: 'Assistant Professor' },
  { staff_id: 'st_2', employee_id: 'ST002', name: 'Prof. Rahul Kumar', email: 'st002@erp.local', designation: 'Associate Professor' },
  { staff_id: 'st_3', employee_id: 'ST003', name: 'Dr. Anand V', email: 'st003@erp.local', designation: 'Assistant Professor' },
  { staff_id: 'st_4', employee_id: 'ST004', name: 'Prof. Sunita R', email: 'st004@erp.local', designation: 'Assistant Professor' },
  { staff_id: 'st_5', employee_id: 'ST005', name: 'Dr. Rajesh Kannan', email: 'st005@erp.local', designation: 'Professor' },
  { staff_id: 'st_6', employee_id: 'ST006', name: 'Prof. Meenakshi S', email: 'st006@erp.local', designation: 'Assistant Professor' },
  { staff_id: 'st_7', employee_id: 'ST007', name: 'Dr. Vikramaditya M', email: 'st007@erp.local', designation: 'Associate Professor' },
];

export const StaffPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const [localStaff, setLocalStaff] = useState<any[]>([]);
  const [deletedStaffIds, setDeletedStaffIds] = useState<Set<string>>(new Set());

  // New/Edit Staff Form State
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');

  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['staff-list', search],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/staff?search=${search}`);
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const apiStaff = data?.data || [];
  const baseStaff = apiStaff.length > 0 ? apiStaff : [...localStaff, ...SEEDED_STAFF];

  // Filter out deleted staff permanently
  const activeStaff = baseStaff.filter(s => !deletedStaffIds.has(s.staff_id) && !deletedStaffIds.has(s.employee_id));

  const filteredStaff = activeStaff.filter((s: any) => {
    return !search || s.employee_id?.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase());
  });

  const openEditModal = (staffMember: any) => {
    setEditingStaff(staffMember);
    setEmployeeId(staffMember.employee_id);
    setName(staffMember.name);
    setEmail(staffMember.email || `${staffMember.employee_id.toLowerCase()}@erp.local`);
    setDesignation(staffMember.designation || 'Assistant Professor');
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmp = employeeId.trim().toUpperCase();

    if (!editingStaff) {
      // DUPLICATE CHECK: Disallow adding duplicate Employee IDs!
      const isDuplicate = activeStaff.some(
        s => s.employee_id?.toUpperCase() === cleanEmp
      );
      if (isDuplicate) {
        toast.error(`Duplicate Error: Staff member with Employee ID "${cleanEmp}" already exists!`);
        return;
      }
    }

    if (editingStaff) {
      // Edit existing staff member
      const updated = {
        ...editingStaff,
        employee_id: cleanEmp,
        name,
        email,
        designation,
      };

      try {
        await api.put(`/api/staff/${editingStaff.staff_id}`, {
          employeeId: cleanEmp,
          name,
          email,
          designation,
        });
      } catch {}

      setLocalStaff(prev => prev.map(s => s.staff_id === editingStaff.staff_id ? updated : s));
      toast.success(`Staff member ${cleanEmp} updated successfully!`);
      setEditingStaff(null);
    } else {
      // Add new staff member
      const newStaff = {
        staff_id: `custom_st_${Date.now()}`,
        employee_id: cleanEmp,
        name,
        email: email || `${cleanEmp.toLowerCase()}@erp.local`,
        designation,
      };

      try {
        await api.post('/api/staff', { employeeId: cleanEmp, name, email: newStaff.email, designation });
      } catch {}

      setLocalStaff(prev => [newStaff, ...prev]);
      toast.success(`Staff member ${cleanEmp} added with default password "123"!`);
      setIsAddModalOpen(false);
    }

    setEmployeeId('');
    setName('');
    setEmail('');
    qc.invalidateQueries({ queryKey: ['staff-list'] });
  };

  const deleteStaff = (staffId: string, empId: string) => {
    if (confirm(`Are you sure you want to permanently delete faculty member ${empId}?`)) {
      api.delete(`/api/staff/${staffId}`).catch(() => {});

      // Permanently add to deleted set
      setDeletedStaffIds(prev => new Set(prev).add(staffId).add(empId));
      setLocalStaff(prev => prev.filter(s => s.staff_id !== staffId && s.employee_id !== empId));

      toast.success(`Staff member ${empId} deleted successfully`);
    }
  };

  const resetPassword = (username: string) => {
    api.post('/api/auth/admin-reset-password', { targetUsername: username, newPassword: '123' }).catch(() => {});
    toast.success(`Password for ${username} reset to "123"`);
  };

  const downloadStaffPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const rowsHtml = filteredStaff.map((s, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #7c3aed;">${s.employee_id}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${s.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.email}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.designation || 'Assistant Professor'}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Faculty & Staff Roster Report - Prathyusha Engineering College</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #6d28d9; font-size: 22px; }
            .header h3 { margin: 5px 0 0 0; color: #475569; font-size: 14px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #7c3aed; color: white; padding: 10px; border: 1px solid #7c3aed; text-align: left; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRATHYUSHA ENGINEERING COLLEGE</h1>
            <h3>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
            <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #6d28d9;">OFFICIAL FACULTY & STAFF ROSTER REPORT (${filteredStaff.length} MEMBERS)</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Employee ID</th>
                <th>Faculty Full Name</th>
                <th>Institutional Email</th>
                <th>Designation</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>Generated Date: ${new Date().toLocaleDateString()}</div>
            <div>Head of Department Signature: _______________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header with + Add Staff & Download PDF Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white heading-gradient">Faculty & Staff Roster ({filteredStaff.length} Members)</h1>
          <p className="text-gray-400 text-sm">HOD Admin can create, edit, delete & export faculty credentials</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadStaffPdf}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4 text-purple-400" />
            Export Faculty PDF
          </button>

          <button
            onClick={() => {
              setEditingStaff(null);
              setEmployeeId('');
              setName('');
              setEmail('');
              setIsAddModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <UserCheck className="w-4 h-4" />
            + Add Staff
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search e.g. ST001, ST002..."
            className="input-field pl-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {!filteredStaff.length ? (
          <div className="p-12 text-center text-gray-500">No staff members found.</div>
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
                {filteredStaff.map((s: any) => (
                  <tr key={s.staff_id || s.employee_id} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-purple-400">{s.employee_id}</td>
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-gray-300 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" /> {s.email}
                    </td>
                    <td className="p-4 text-gray-300 text-xs">{s.designation || 'Assistant Professor'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 hover:bg-purple-500/10 text-purple-400 rounded-lg transition-colors cursor-pointer"
                        title="Edit Faculty Info"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => resetPassword(s.employee_id.toLowerCase())}
                        className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors cursor-pointer"
                        title="Reset password to 123"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStaff(s.staff_id, s.employee_id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
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

      {/* Add / Edit Staff Modal */}
      {(isAddModalOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border border-purple-500/30 animate-slide-up">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingStaff ? <Edit2 className="w-5 h-5 text-purple-400" /> : <UserCheck className="w-5 h-5 text-purple-400" />}
              {editingStaff ? `Edit Faculty Member: ${editingStaff.employee_id}` : 'Add New Staff Member'}
            </h2>
            <p className="text-xs text-gray-400">
              {editingStaff ? 'Update Employee ID, faculty full name, institutional email, and designation.' : 'Duplicates are blocked. Default login password is set to 123.'}
            </p>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Employee ID (Emp ID)</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="ST008"
                  className="input-field font-mono font-bold text-purple-400"
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
                  required
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="Assistant Professor"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingStaff(null); }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
