import {
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  FolderOpen,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Siren,
  Smile,
  User,
} from 'lucide-react';
import { getAuth } from '../../config/permisos.js';

function fechaHoy() {
  const texto = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const botonSecundario =
  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container';

const botonPrimario =
  'flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700';

function presentarPalabra(texto) {
  const palabra = String(texto ?? '').trim().split(/\s+/)[0] ?? '';
  if (!palabra) return '';
  const minusculas = palabra.toLocaleLowerCase('es-MX');
  return minusculas.charAt(0).toLocaleUpperCase('es-MX') + minusculas.slice(1);
}

function saludoPorHora(fecha = new Date()) {
  const hora = fecha.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function PanelPacientePage() {
  const usuario = getAuth()?.usuario;
  const primerNombre = presentarPalabra(usuario?.nombre);
  const saludo = saludoPorHora();

  return (
    <section className="flex flex-col gap-6 bg-surface p-4 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            {primerNombre ? `${saludo}, ${primerNombre}` : saludo}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{fechaHoy()}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block">
            <span className="sr-only">Buscar citas o historial</span>
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              placeholder="Buscar citas o historial..."
              className="h-10 w-full rounded-xl border border-outline-variant bg-on-primary pr-4 pl-9 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-teal-500/20 focus:outline-none sm:w-64"
            />
          </label>
          <button
            type="button"
            className={botonPrimario}
          >
            <Plus size={18} aria-hidden="true" />
            Agendar cita
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-on-primary p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <CalendarClock size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-outline uppercase">Próxima cita</p>
            <p className="mt-0.5 truncate text-base font-bold text-on-surface">Viernes 25 Oct, 10:30 AM</p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">Dra. Andrea Sámano · Box 02</p>
          </div>
        </article>

        <article className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-on-primary p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
            <Smile size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-outline uppercase">Tratamiento activo</p>
            <p className="mt-0.5 truncate text-base font-bold text-on-surface">Ortodoncia Correctiva</p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">Control mensual al día</p>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-outline-variant bg-on-primary p-6">
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-on-surface">Tu próxima visita</h2>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              Confirmada
            </span>
          </div>
          <p className="text-xs font-medium text-outline">Recordatorio en 4 días</p>
        </header>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container text-center">
              <span className="text-xs font-bold text-outline uppercase">Oct</span>
              <span className="text-xl leading-none font-bold text-on-surface">25</span>
              <span className="text-xs font-medium text-outline">10:30 AM</span>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-teal-50 text-teal-600">
                <User size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">Dra. Andrea Sámano</p>
                <p className="text-xs text-on-surface-variant">Ortodoncista · Box 02</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-outline">
                  <MapPin size={14} aria-hidden="true" />
                  DentalWeb Miraflores Centro
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={botonSecundario}>
              <MessageSquare size={16} aria-hidden="true" className="text-outline" />
              Mensaje
            </button>
          </div>
        </div>
      </article>

      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-outline uppercase">Accesos directos</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-outline-variant bg-on-primary p-5 text-left transition-colors hover:border-teal-600"
          >
            <span className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                <CalendarCheck size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-on-surface">Agendar nueva cita</span>
                <span className="block text-xs text-on-surface-variant">Reservar turno con especialista</span>
              </span>
            </span>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-outline" />
          </button>

          <button
            type="button"
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-outline-variant bg-on-primary p-5 text-left transition-colors hover:border-error"
          >
            <span className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-error">
                <Siren size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-on-surface">Urgencia dental</span>
                  <span className="rounded bg-error-container px-1.5 text-xs font-bold text-error uppercase">24/7</span>
                </span>
                <span className="block text-xs text-on-surface-variant">Dolor agudo o bracket suelto</span>
              </span>
            </span>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-outline" />
          </button>

          <button
            type="button"
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-outline-variant bg-on-primary p-5 text-left transition-colors hover:border-teal-600"
          >
            <span className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                <FolderOpen size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-on-surface">Historial clínico</span>
                <span className="block text-xs text-on-surface-variant">Radiografías y notas médicas</span>
              </span>
            </span>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-outline" />
          </button>
        </div>
      </div>
    </section>
  );
}
