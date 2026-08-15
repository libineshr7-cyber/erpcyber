import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Shield } from 'lucide-react';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-surface-900 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex-shrink-0 flex flex-col border-r border-white/5 z-20">
        <div className="p-6 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-white leading-tight">Cybersecurity ERP</h1>
            <span className="text-[10px] text-cyan-400 font-mono">ACADEMIC PORTAL</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <Sidebar />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 glass-panel border-b border-white/[0.05] flex items-center justify-between px-6 flex-shrink-0 relative z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 font-mono">System Online</span>
          </div>
          <TopBar />
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
