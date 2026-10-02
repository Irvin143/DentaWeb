import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, BriefcaseMedical, CalendarCheck, CalendarClock, DoorOpen, GraduationCap, IdCard, LayoutGrid, LogOut, Menu, Package, Scan, Shield, Stethoscope, UserCog, Users, X } from 'lucide-react';
import { getAuth, puedeVer, primeraRutaPermitida } from '../config/permisos'; // ajusta la ruta a donde guardes permisos.js
//hola
const navItems = [
  { path: '/panel', label: 'Panel Principal', icon: LayoutGrid },
  { path: '/panel-paciente', label: 'Mi panel', icon: CalendarCheck },
  { path: '/pacientes', label: 'Pacientes', icon: Users },
  { path: '/odontologos', label: 'Odontólogos', icon: Stethoscope },
  { path: '/clinicas', label: 'Clínicas', icon: Building2 },
  { path: '/consultorios', label: 'Consultorios', icon: DoorOpen },
  { path: '/servicios', label: 'Servicios', icon: BriefcaseMedical },
  { path: '/especialidades', label: 'Especialidades', icon: GraduationCap },
  { path: '/estudios', label: 'Estudios', icon: Scan },
  { path: '/tipos-cita', label: 'Tipos de Cita', icon: CalendarClock },
  { path: '/paquetes', label: 'Paquetes Roles', icon: Package },
  { path: '/roles', label: 'Roles', icon: Shield },
  { path: '/tipos-usuario', label: 'Tipos de Usuario', icon: IdCard },
  { path: '/usuarios', label: 'Usuarios', icon: UserCog },
  // { path: "/agenda", label: "Agenda", icon: Calendar },
];

function DialogoCerrarSesion({ onCancelar, onConfirmar }) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onCancelar();
    };
    document.addEventListener('keydown', onKeyDown, true);
    cancelarRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onCancelar]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cerrar-sesion"
        aria-describedby="texto-cerrar-sesion"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="titulo-cerrar-sesion" className="text-lg font-bold text-slate-800">
            Cerrar sesión
          </h2>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <p id="texto-cerrar-sesion" className="px-6 py-5 text-sm text-slate-600">
          ¿Seguro que quieres salir de ClinicWare?
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Marca() {
  return (
    <Link to={primeraRutaPermitida(getAuth()?.usuario) ?? '/panel'} className="flex items-center gap-3 px-2">
      <figure className="m-0 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
        <img src="/logo.svg" alt="Logo DentalWeb" className="h-7 w-7" />
      </figure>
      <hgroup className="flex flex-col">
        <p className="text-lg font-bold leading-tight text-slate-800">Clinic Ware</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Clínicas SaaS
        </p>
      </hgroup>
    </Link>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const usuario = getAuth()?.usuario;
  const [abierto, setAbierto] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const confirmarSalidaRef = useRef(false);
  confirmarSalidaRef.current = confirmarSalida;

  // Solo se muestran las opciones a las que el usuario tiene acceso
  const itemsVisibles = navItems.filter((item) => puedeVer(item.path, usuario));

  const nombre = usuario?.nombre ?? usuario?.correo ?? 'Usuario';
  const etiquetaRol = usuario?.paquete ?? '';

  const cerrarSesion = () => {
    sessionStorage.removeItem('clinicware_auth');
    navigate('/', { replace: true });
  };

  const cancelarCierre = useCallback(() => setConfirmarSalida(false), []);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto (mobile)
  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !confirmarSalidaRef.current) setAbierto(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [abierto]);

  return (
    <>
      {/* Barra superior (solo mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm md:hidden">
        <Marca />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="menu-lateral"
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Fondo oscuro (solo mobile, cuando el menú está abierto) */}
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 cursor-default bg-slate-900/40 md:hidden"
        />
      )}

      {/* Sidebar: panel deslizante en mobile, fijo en escritorio */}
      <aside
        id="menu-lateral"
        className={`fixed inset-y-0 left-0 z-50  flex w-64 flex-col justify-between border-r border-slate-100 bg-white p-4 shadow-sm transition-[transform,visibility] duration-200 md:visible md:static md:h-screen md:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full invisible'
        }`}
      >
        <section>
          <header className="mb-8 flex items-center justify-between">
            <Marca />
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-50 md:hidden"
            >
              <X size={20} />
            </button>
          </header>

          {/* Menú de navegación */}
          <nav aria-label="Navegación principal" >
            <ul className="m-0 list-none space-y-1.5 p-0">
              {itemsVisibles.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setAbierto(false)}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-teal-50 font-semibold text-teal-700'
                          : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-3">
                          <item.icon
                            size={18}
                            aria-hidden="true"
                            className={isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-500'}
                          />
                          {item.label}
                        </span>
                        {/* Punto verde: indica dónde estás */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.5)]"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* Perfil de usuario y cierre de sesión */}
        <footer className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600"
            >
              {nombre.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-sm font-bold text-slate-800">{nombre}</strong>
              <small className="truncate text-xs text-slate-500">{etiquetaRol}</small>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmarSalida(true)}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </footer>
      </aside>

      {confirmarSalida && (
        <DialogoCerrarSesion onCancelar={cancelarCierre} onConfirmar={cerrarSesion} />
      )}
    </>
  );
}