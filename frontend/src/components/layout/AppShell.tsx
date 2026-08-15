import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Shield, Menu, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-900 text-slate-200 overflow-hidden w-full max-w-full">
      {/* Desktop Sidebar — Fixed W-64 on LG screens */}
      <aside className="hidden lg:flex w-64 glass-panel flex-shrink-0 flex-col border-r border-white/5 z-20">
        <div className="p-6 pb-4 flex items-center gap-3">
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

      {/* Mobile Drawer Overlay Backdrop (for Mobile & Tablet Viewports < LG) */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <aside
            className="w-72 sm:w-80 h-full bg-surface-800 glass-panel flex flex-col border-r border-white/10 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-display font-bold text-white leading-tight">Cybersecurity ERP</h1>
                  <span className="text-[9px] text-cyan-400 font-mono">ACADEMIC PORTAL</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-1">
              <Sidebar onItemClick={() => setIsMobileSidebarOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area — Auto-fits all device widths */}
      <div className="flex-1 flex flex-col min-w-0 relative w-full overflow-hidden">
        <header className="h-16 glass-panel border-b border-white/[0.05] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger button for Mobile / Tablet screens */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-cyan-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">System Online</span>
            </div>
          </div>

          <TopBar />
        </header>

        {/* Dynamic Responsive Main Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
