import React from 'react';
import { Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-surface-900 text-slate-200 overflow-hidden">
      <aside className="w-64 glass-panel flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-400">
            ERP Portal
          </h1>
        </div>
        <nav className="px-4 py-2">
          {/* Navigation links will go here */}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-panel border-b border-white/[0.05] flex items-center justify-between px-6">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500">
              U
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
