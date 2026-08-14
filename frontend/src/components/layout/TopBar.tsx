import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-300">
        @{user?.username || 'User'} <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">{user?.role}</span>
      </span>
      <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
        Logout
      </button>
    </div>
  );
};
