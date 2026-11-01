import React from 'react';
import ControlTema from '../components/ControlTema.jsx';
import { Sidebar } from '../components/Sidebar';

export function MainLayout({ children, paqueteRoles }) {
  return (
    <div className="flex h-dvh flex-col bg-surface md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
      <div className="fixed right-6 bottom-6 z-20">
        <ControlTema />
      </div>
    </div>
  );
}