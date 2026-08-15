import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Shield } from 'lucide-react';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Sidebar - Solid White with Maroon accents */}
      <aside className="w-64 bg-white flex-shrink-0 flex flex-col border-r border-rose-900/10 shadow-sm z-20">
        <div className="p-6 pb-4 flex items-center gap-3 border-b border-rose-900/10 bg-gradient-to-r from-rose-950 to-rose-900 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg shadow-black/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-white leading-tight">Cybersecurity ERP</h1>
            <span className="text-[10px] text-rose-200 font-mono font-semibold tracking-wider">ACADEMIC PORTAL</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 bg-white">
          <Sidebar />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-50">
        <header className="h-16 bg-white border-b border-rose-900/10 flex items-center justify-between px-6 flex-shrink-0 relative z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-rose-900 font-mono font-bold">PRATHYUSHA ACADEMIC ERP</span>
          </div>
          <TopBar />
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8 relative z-10 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
