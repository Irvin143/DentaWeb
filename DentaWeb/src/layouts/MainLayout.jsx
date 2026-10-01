import React from 'react';
import { Sidebar } from '../components/Sidebar';

export function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. Menú lateral fijo a la izquierda */}
      <Sidebar />

      {/* 2. Área dinámica a la derecha donde se renderiza el catalogo */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}