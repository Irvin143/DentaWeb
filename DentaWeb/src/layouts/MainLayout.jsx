import React from 'react';
import ControlTema from '../components/ControlTema.jsx';
import { Sidebar } from '../components/Sidebar';
import { useAltoVisual } from '../hooks/useAltoVisual.js';

export function MainLayout({ children, paqueteRoles }) {
  useAltoVisual();

  return (
    <div className="flex h-[var(--app-vvh,100svh)] flex-col bg-surface pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] md:flex-row md:pt-0 md:pb-0">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
      <div className="fixed right-6 bottom-6 z-20 hidden md:block">
        <ControlTema />
      </div>
    </div>
  );
}