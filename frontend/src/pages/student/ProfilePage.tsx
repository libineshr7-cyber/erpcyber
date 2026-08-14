import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Shield, BookOpen, Hash } from 'lucide-react';
import api from '../../api/client';

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/api/student-portal/profile').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white heading-gradient mb-2">Student Profile</h1>
        <p className="text-gray-400">Personal and academic identification records</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !profile ? (
        <div className="glass-card p-12 text-center text-gray-500 rounded-2xl">Profile details not found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl font-bold">
                {profile.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <p className="text-sm font-mono text-cyan-400">{profile.register_number}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Programme</span>
                <span className="text-white font-medium">{profile.programme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Batch</span>
                <span className="text-white font-medium">{profile.batch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Academic Year</span>
                <span className="text-white font-medium">Year {profile.current_year} (Semester {profile.current_semester})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gender</span>
                <span className="text-white font-medium">{profile.gender || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Account Security & Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Registered Email</span>
                <span className="text-white font-medium">{profile.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Account Role</span>
                <span className="text-cyan-400 font-semibold">STUDENT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-emerald-400 font-semibold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
