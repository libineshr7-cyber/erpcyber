import React from 'react';

const PlaceholderPage: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-white heading-gradient mb-2">{title}</h1>
      <p className="text-gray-400">{description}</p>
    </div>
    <div className="glass-card p-16 rounded-2xl text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-500">This page is ready. Connect it to the API endpoints in your backend.</p>
    </div>
  </div>
);

export const AttendancePage: React.FC = () => (
  <PlaceholderPage title="Attendance Management" description="Record and manage student attendance" icon="📋" />
);
