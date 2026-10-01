import React from 'react';
import { Sidebar } from '../components/Sidebar';

export function MainLayout({ children, paqueteRoles }) {
  console.log('MainLayout renderizado con paqueteRoles:', paqueteRoles);
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50 md:flex-row">
      {/* 1. Menú lateral: barra superior en mobile, columna fija en escritorio */}
      <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
    
    </div>
  );
}