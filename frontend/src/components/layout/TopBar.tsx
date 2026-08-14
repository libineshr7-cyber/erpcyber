import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-300">{user?.name} ({user?.role})</span>
      <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
        Logout
      </button>
    </div>
  );
};
