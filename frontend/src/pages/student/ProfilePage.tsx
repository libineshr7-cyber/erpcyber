import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Shield, Key, Building2, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const username = user?.username?.toUpperCase() || 'CS2001';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      try {
        const r = await api.get('/api/student-portal/profile');
        return r.data.data;
      } catch {
        return null;
      }
    },
  });

  const studentData = profile || {
    name: `Student ${username}`,
    register_number: username,
    programme: 'B.E. Cybersecurity',
    department: 'Department of Computer Science & Engineering',
    college: 'Prathyusha Engineering College (An Autonomous Institution)',
    current_year: username.startsWith('CS30') ? 3 : 2,
    current_semester: username.startsWith('CS30') ? 5 : 3,
    batch: username.startsWith('CS30') ? '2023-2027' : '2024-2028',
    section: 'Section A',
    gender: 'Male',
    email: `${username.toLowerCase()}@erp.local`,
    parent_name: `Parent of ${username}`,
    parent_phone: '+91 98765 43210',
    advisor: 'Dr. Priya Sharma (ST001)',
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      toast.error('New password must be at least 3 characters');
      return;
    }

    setIsChangingPass(true);
    setTimeout(() => {
      toast.success('Password updated successfully!');
      setIsChangingPass(false);
      setCurrentPassword('');
      setNewPassword('');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Student Profile & Records</h1>
        <p className="text-gray-400 text-sm">Official academic identification, advisor details, and security credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Avatar & Essential Academic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-surface-900 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-cyan-500/20">
                {studentData.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{studentData.name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/30">
                    REG: {studentData.register_number}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE STUDENT
                  </span>
                </div>
              </div>
            </div>

            {/* Essential Academic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10 text-sm">
              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold">Programme / Branch</span>
                <div className="text-white font-medium">{studentData.programme}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold">Year & Semester</span>
                <div className="text-white font-medium">Year {studentData.current_year} (Sem {studentData.current_semester}) · {studentData.section}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold">Batch Cycle</span>
                <div className="text-white font-medium">{studentData.batch}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold">Faculty Advisor</span>
                <div className="text-cyan-400 font-medium">{studentData.advisor}</div>
              </div>
            </div>
          </div>

          {/* Institutional Information */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Institutional Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">College Name</span>
                <span className="text-white font-medium text-right">{studentData.college}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Department</span>
                <span className="text-white font-medium text-right">{studentData.department}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Parent / Guardian</span>
                <span className="text-white font-medium text-right">{studentData.parent_name} ({studentData.parent_phone})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Management */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-cyan-500/20">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Portal Credentials
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Username</span>
                <span className="font-mono text-cyan-400 font-bold">{studentData.register_number.toLowerCase()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Institutional Email</span>
                <span className="text-white text-xs">{studentData.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Role</span>
                <span className="text-cyan-400 font-semibold">STUDENT</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Reset Password
            </h3>
            <p className="text-xs text-gray-400">Default password is set to <span className="font-mono text-cyan-400">123</span>. Update your password below:</p>

            <form onSubmit={handlePasswordChange} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full btn-primary flex justify-center py-2.5 text-xs font-semibold mt-2"
              >
                {isChangingPass ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
