import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Building2, Stethoscope, Users, Calendar } from 'lucide-react';

// Preparación para la sesión activa 
const mockActiveSession = {
  user: {
    name: "Sr. Jesús Mejía",
    role: "Administrador General",
    avatarUrl: null //mostrará la inicial como fallback
  }
};

export function Sidebar() {
  const { user } = mockActiveSession;

  const navItems = [
    { path: "/panel", label: "Panel Principal", icon: LayoutGrid },
    { path: "/clinicas", label: "Clínicas", icon: Building2 },
    { path: "/odontologos", label: "Odontólogos", icon: Stethoscope },
    { path: "/pacientes", label: "Pacientes", icon: Users },
    { path: "/agenda", label: "Agenda", icon: Calendar },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-slate-100 bg-white p-4 shadow-sm">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
            <img src="/logo.svg" alt="Logo DentalWeb" className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-slate-800">DentalWeb</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Clínicas SaaS</span>
          </div>
        </div>

        {/* Menu de Navegacion con NavLink */}
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 font-semibold text-teal-700"
                    : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"}
                    />
                    {item.label}
                  </div>
                  {/* Punto verde indica donde estas */}
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.5)]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Perfil de Usuario Dinamico */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-bold text-slate-800">{user.name}</span>
            <span className="truncate text-xs text-slate-500">{user.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}