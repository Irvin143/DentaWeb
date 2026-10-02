import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  UserPlus,
  CalendarPlus,
  Banknote,
  PackagePlus,
} from 'lucide-react';
import { getAuth } from '../../config/permisos.js';

const CITAS = [
  { hora: '09:00 AM', paciente: 'Elena García', motivo: 'Limpieza Dental', estado: 'Confirmada', tono: 'secondary' },
  { hora: '10:30 AM', paciente: 'Roberto Díaz', motivo: 'Extracción de molar', estado: 'En consulta', tono: 'primary' },
  { hora: '01:15 PM', paciente: 'Sofia Méndez', motivo: 'Ortodoncia - Ajuste', estado: 'Pendiente', tono: 'neutral' },
  { hora: '03:45 PM', paciente: 'Juan Pérez', motivo: 'Revisión General', estado: 'Cancelada', tono: 'error' },
];

const ACTIVIDAD = [
  { titulo: 'Nuevo paciente registrado', detalle: 'Carlos Ruiz', cuando: 'hace 5 min' },
  { titulo: 'Pago recibido', detalle: '$1,200.00 de Ana López', cuando: 'hace 12 min' },
  { titulo: 'Cita reagendada', detalle: 'Miguel Ángel para el 18 Oct', cuando: 'hace 45 min' },
];

const SISTEMA = ['Servidor principal Operativo', 'Base de datos Conectada', 'Copias de seguridad Actualizadas'];

const TONOS = {
  secondary: 'bg-secondary-container text-secondary',
  primary: 'bg-primary-container/10 text-primary',
  neutral: 'bg-surface-container text-on-surface-variant',
  error: 'bg-error-container text-error',
};

function fechaHoy() {
  const texto = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function PanelPage() {
  const usuario = getAuth()?.usuario;
  const nombre = usuario?.nombre ?? usuario?.correo ?? 'Usuario';

  return (
    <section className="flex flex-col gap-6 bg-surface p-4 md:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Bienvenido de nuevo, {nombre}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{fechaHoy()}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-on-primary text-on-surface-variant"
        >
          <Bell size={18} />
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Tarjeta
          icono={<Calendar size={18} />}
          etiqueta="Citas de hoy"
          valor="24"
          nota="+12% vs ayer"
        />
        <Tarjeta
          icono={<Users size={18} />}
          etiqueta="Pacientes nuevos"
          valor="12"
          nota="+5% este mes"
        />
        <Tarjeta
          icono={<DollarSign size={18} />}
          etiqueta="Ingresos mensuales"
          valor="$42,500"
          nota="+8% vs mes anterior"
        />
        <Tarjeta
          icono={<AlertTriangle size={18} />}
          etiqueta="Alertas de stock"
          valor="3"
          nota="Requiere atención"
          alerta
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-outline-variant bg-on-primary p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-on-surface">Agenda de hoy</h2>
            <span className="text-sm font-medium text-primary">Ver calendario</span>
          </header>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CITAS.map((cita) => (
              <li key={cita.hora} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-outline">{cita.hora}</p>
                  <p className="truncate text-sm font-semibold text-on-surface">{cita.paciente}</p>
                  <p className="truncate text-xs text-on-surface-variant">{cita.motivo}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${TONOS[cita.tono]}`}>
                  {cita.estado}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-outline-variant bg-on-primary p-5">
          <h2 className="mb-4 text-base font-bold text-on-surface">Actividad reciente</h2>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {ACTIVIDAD.map((item) => (
              <li key={item.titulo}>
                <p className="text-sm font-semibold text-on-surface">{item.titulo}</p>
                <p className="text-sm text-on-surface-variant">{item.detalle}</p>
                <p className="text-xs text-outline">{item.cuando}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-outline-variant bg-on-primary p-5">
          <h2 className="mb-4 text-base font-bold text-on-surface">Estado del sistema</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {SISTEMA.map((linea) => (
              <li key={linea} className="flex items-center gap-2 text-sm text-secondary">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
                {linea}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-primary">Ver detalles técnicos</p>
        </article>

        <article className="rounded-2xl border border-outline-variant bg-on-primary p-5">
          <h2 className="mb-4 text-base font-bold text-on-surface">Acciones rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/pacientes"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant px-3 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <UserPlus size={16} className="text-primary" />
              Nuevo paciente
            </Link>
            <Accion icono={<CalendarPlus size={16} className="text-primary" />}>Nueva cita</Accion>
            <Accion icono={<Banknote size={16} className="text-primary" />}>Registrar pago</Accion>
            <Accion icono={<PackagePlus size={16} className="text-primary" />}>Añadir inventario</Accion>
          </div>
        </article>
      </div>
    </section>
  );
}

function Tarjeta({ icono, etiqueta, valor, nota, alerta = false }) {
  return (
    <article className="rounded-2xl border border-outline-variant bg-on-primary p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${alerta ? 'bg-error-container text-error' : 'bg-primary-container/10 text-primary'}`}>
        {icono}
      </div>
      <p className="text-sm text-on-surface-variant">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold text-on-surface">{valor}</p>
      <p className={`mt-1 text-xs font-medium ${alerta ? 'text-error' : 'text-secondary'}`}>{nota}</p>
    </article>
  );
}

function Accion({ icono, children }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant px-3 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
    >
      {icono}
      {children}
    </button>
  );
}
