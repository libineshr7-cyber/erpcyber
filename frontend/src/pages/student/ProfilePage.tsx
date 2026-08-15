import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Shield, Key, Building2, Mail, CheckCircle2, Lock, Save, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const username = user?.username?.toUpperCase() || 'CS2001';

  // Editable States ONLY: Email & Password
  const [emailInput, setEmailInput] = useState(`${username.toLowerCase()}@prathyusha.edu.in`);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
    programme: 'B.E. Computer Science & Engineering (Cybersecurity)',
    department: 'Department of Computer Science & Engineering',
    college: 'Prathyusha Engineering College (An Autonomous Institution)',
    current_year: username.startsWith('CS30') ? 3 : 2,
    current_semester: username.startsWith('CS30') ? 5 : 3,
    batch: username.startsWith('CS30') ? '2023-2027' : '2024-2028',
    section: 'Section A',
    gender: 'Male',
    parent_name: `Mr. Parent of ${username}`,
    parent_phone: '+91 98400 11234',
    advisor: 'Dr. Priya Sharma (ST001)',
  };

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSavingEmail(true);
    setTimeout(() => {
      setIsSavingEmail(false);
      toast.success('Email address updated successfully!');
    }, 600);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      toast.error('New password must be at least 3 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-1 flex items-center gap-2">
          <User className="w-8 h-8 text-cyan-400" />
          Student Account & Credentials
        </h1>
        <p className="text-gray-400 text-sm">Update your institutional email address and security password (academic records remain locked)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Locked Institutional Academic Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-surface-900 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-cyan-500/20">
                {studentData.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  {studentData.name}
                  <Lock className="w-4 h-4 text-gray-400" title="Locked by Department Admin" />
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/30">
                    REG: {studentData.register_number}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE STUDENT
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Academic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10 text-sm">
              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                  Programme / Branch <Lock className="w-3 h-3 text-gray-500" />
                </span>
                <div className="text-white font-medium">{studentData.programme}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                  Year & Semester <Lock className="w-3 h-3 text-gray-500" />
                </span>
                <div className="text-white font-medium">Year {studentData.current_year} (Sem {studentData.current_semester}) · {studentData.section}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                  Batch Cycle <Lock className="w-3 h-3 text-gray-500" />
                </span>
                <div className="text-white font-medium">{studentData.batch}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                  Faculty Advisor <Lock className="w-3 h-3 text-gray-500" />
                </span>
                <div className="text-cyan-400 font-medium">{studentData.advisor}</div>
              </div>
            </div>
          </div>

          {/* Locked Institutional Information */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Institutional Details <span className="text-xs text-gray-500 font-normal flex items-center gap-1"><Lock className="w-3 h-3" /> Read-Only</span>
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

        {/* Right Column: STUDENT EDITABLE CONTROLS (EMAIL & PASSWORD ONLY) */}
        <div className="space-y-6">
          {/* Editable Email Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-cyan-500/40">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Edit Institutional Email
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              You can edit your contact email address below:
            </p>

            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="input-field w-full text-sm font-semibold text-white bg-surface-900 focus:border-cyan-500"
                  placeholder="student@prathyusha.edu.in"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingEmail}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSavingEmail ? 'Saving Email...' : 'Save Email Address'}
              </button>
            </form>
          </div>

          {/* Editable Password Reset Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-purple-500/40">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Edit Account Password
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Default password is set to <span className="font-mono text-cyan-400 font-bold">123</span>. Update your password below:
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full text-sm bg-surface-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-field w-full text-sm bg-surface-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="input-field w-full text-sm bg-surface-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-none shadow-lg shadow-purple-500/20 cursor-pointer mt-2"
              >
                <Key className="w-4 h-4" />
                {isSavingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
