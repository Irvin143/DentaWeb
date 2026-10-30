import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Loader2,
  X,
} from 'lucide-react';
// TODO: ajusta la ruta al archivo donde tienes apiRequest y las demás APIs
import { citasApi } from '../../services/api.js';

/* ---------- Constantes ---------- */
const TONOS = {
  Pendiente: 'bg-amber-100 text-amber-800',
  Concluida: 'bg-green-100 text-green-800',
  Cancelada: 'bg-error-container text-error',
  'No asistió': 'bg-error-container text-error',
};
const TONO_DESCONOCIDO = 'bg-surface-container text-on-surface-variant';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'proximas', etiqueta: 'Próximas' },
  { id: 'pasadas', etiqueta: 'Pasadas' },
];

// Solo las citas pendientes se pueden reagendar o cancelar
const ESTADOS_ACCIONABLES = ['Pendiente'];

/* ---------- Utilidades ---------- */
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const fechaCorta = (f) =>
  f.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');

const fechaLarga = (f) =>
  f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

const hora = (f) =>
  f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

const puedeActuar = (c) => c.fecha >= new Date() && ESTADOS_ACCIONABLES.includes(c.estado);

/* ---------- Adaptador: respuesta del backend -> formato de la pantalla ---------- */
const ESTADOS = {
  pendiente: 'Pendiente',
  concluida: 'Concluida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

function adaptarCita(c) {
  // El backend manda fecha ('AAAA-MM-DD') y hora ('HH:mm') por separado
  const fecha = new Date(`${c.fecha}T${c.hora}`);
  if (Number.isNaN(fecha.getTime())) return null;

  const clave = String(c.estado ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  return {
    id: c.id,
    fecha,
    motivo: c.motivo ?? 'Consulta',
    doctor: c.doctor ?? '—',
    // Un estado desconocido se muestra tal cual, sin botones de acción
    estado: ESTADOS[clave] ?? String(c.estado ?? 'Sin estado'),
  };
}

/* ---------- Página ---------- */
export default function CitasTablaPage() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [filtro, setFiltro] = useState('todas');
  const [descendente, setDescendente] = useState(true);

  const [porCancelar, setPorCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState('');

  const cargar = useCallback(async (signal) => {
    setCargando(true);
    setErrorCarga('');
    try {
      const datos = await citasApi.listar({ signal });
      setCitas(datos.map(adaptarCita).filter(Boolean));
    } catch (error) {
      if (error.name === 'AbortError') return;
      setErrorCarga(error.message || 'No se pudieron cargar tus citas.');
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  const ahora = new Date();
  const conteo = {
    todas: citas.length,
    proximas: citas.filter((c) => c.fecha >= ahora).length,
    pasadas: citas.filter((c) => c.fecha < ahora).length,
  };

  const filas = useMemo(() => {
    const ahoraMs = Date.now();
    return citas
      .filter((c) =>
        filtro === 'todas' ? true : filtro === 'proximas' ? c.fecha.getTime() >= ahoraMs : c.fecha.getTime() < ahoraMs,
      )
      .sort((a, b) => (descendente ? b.fecha - a.fecha : a.fecha - b.fecha));
  }, [citas, filtro, descendente]);

  function abrirCancelacion(cita) {
    setErrorCancelar('');
    setPorCancelar(cita);
  }

  async function confirmarCancelacion() {
    const cita = porCancelar;
    setCancelando(true);
    setErrorCancelar('');
    try {
      await citasApi.cancelar(cita.id);
      setCitas((actuales) => actuales.map((c) => (c.id === cita.id ? { ...c, estado: 'Cancelada' } : c)));
      setPorCancelar(null);
    } catch (error) {
      // El diálogo se queda abierto para que puedas reintentar.
      setErrorCancelar(error.message || 'No se pudo cancelar la cita.');
    } finally {
      setCancelando(false);
    }
  }

  const IconoOrden = descendente ? ArrowDown : ArrowUp;

  return (
    <section className="flex flex-col gap-6 bg-surface p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mis citas</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Todas tus citas en un solo lugar.</p>
        </div>
        <Link
          to="/citas/nueva"
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
        >
          <CalendarPlus size={16} />
          Nueva cita
        </Link>
      </header>

      <article className="overflow-hidden rounded-2xl border border-outline-variant bg-on-primary">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 border-b border-outline-variant p-4">
          {FILTROS.map((f) => {
            const activo = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={activo}
                disabled={cargando}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${
                  activo
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {f.etiqueta}
                {!cargando && <span className={`text-xs ${activo ? 'opacity-80' : 'text-outline'}`}>{conteo[f.id]}</span>}
              </button>
            );
          })}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto" aria-busy={cargando}>
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface text-xs font-semibold uppercase tracking-wide text-outline">
                <th scope="col" className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setDescendente((d) => !d)}
                    aria-label={`Ordenar por fecha ${descendente ? 'ascendente' : 'descendente'}`}
                    className="flex cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors hover:text-on-surface"
                  >
                    Fecha
                    <IconoOrden size={13} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-5 py-3">Hora</th>
                <th scope="col" className="px-5 py-3">Motivo</th>
                <th scope="col" className="px-5 py-3">Doctor</th>
                <th scope="col" className="px-5 py-3">Estado</th>
                <th scope="col" className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilasCargando />
              ) : errorCarga ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div role="alert" className="flex flex-col items-center gap-2 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-error">
                        <AlertTriangle size={22} aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold text-on-surface">No pudimos cargar tus citas</p>
                      <p className="text-sm text-on-surface-variant">{errorCarga}</p>
                      <button
                        type="button"
                        onClick={() => cargar()}
                        className="mt-2 cursor-pointer rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                        <CalendarX size={22} aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold text-on-surface">No hay citas para mostrar</p>
                      <p className="text-sm text-on-surface-variant">
                        {filtro === 'pasadas'
                          ? 'Las citas que ya pasaron aparecerán aquí.'
                          : 'Agenda una nueva cita para verla aquí.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-on-surface">
                      {mayuscula(fechaCorta(c.fecha))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-on-surface-variant">{hora(c.fecha)}</td>
                    <td className="px-5 py-4 text-on-surface">{c.motivo}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-on-surface-variant">{c.doctor}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${TONOS[c.estado] ?? TONO_DESCONOCIDO}`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {puedeActuar(c) ? (
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/citas/${c.id}/reagendar`}
                            aria-label={`Reagendar cita de ${c.motivo} del ${fechaCorta(c.fecha)}`}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface"
                          >
                            <CalendarClock size={14} className="text-primary" aria-hidden="true" />
                            Reagendar
                          </Link>
                          <button
                            type="button"
                            onClick={() => abrirCancelacion(c)}
                            aria-label={`Cancelar cita de ${c.motivo} del ${fechaCorta(c.fecha)}`}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error-container"
                          >
                            <X size={14} aria-hidden="true" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <p className="text-right text-outline" aria-label="Sin acciones disponibles">
                          —
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && !errorCarga && (
          <p className="border-t border-outline-variant px-5 py-3 text-xs text-on-surface-variant">
            {filas.length === 1 ? '1 cita' : `${filas.length} citas`}
          </p>
        )}
      </article>

      {porCancelar && (
        <ConfirmarCancelacion
          cita={porCancelar}
          cancelando={cancelando}
          error={errorCancelar}
          onConservar={() => setPorCancelar(null)}
          onConfirmar={confirmarCancelacion}
        />
      )}
    </section>
  );
}

/* ---------- Filas de carga ---------- */
function FilasCargando() {
  return Array.from({ length: 4 }, (_, i) => (
    <tr key={i} className="border-b border-outline-variant last:border-b-0" aria-hidden="true">
      {[24, 16, 36, 24, 20, 28].map((ancho, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 animate-pulse rounded bg-surface-container" style={{ width: `${ancho * 4}px`, maxWidth: '100%' }} />
        </td>
      ))}
    </tr>
  ));
}

/* ---------- Diálogo de confirmación ---------- */
function ConfirmarCancelacion({ cita, cancelando, error, onConservar, onConfirmar }) {
  const botonConservar = useRef(null);
  const cerrar = useRef(onConservar);
  const ocupado = useRef(cancelando);
  cerrar.current = onConservar;
  ocupado.current = cancelando;

  // Se enfoca el botón seguro una sola vez, al abrir el diálogo.
  useEffect(() => {
    botonConservar.current?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !ocupado.current) cerrar.current();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !cancelando && onConservar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar"
        aria-describedby="detalle-cancelar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-outline-variant bg-on-primary p-6"
      >
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-error">
          <CalendarX size={20} aria-hidden="true" />
        </span>
        <h2 id="titulo-cancelar" className="text-lg font-bold text-on-surface">
          ¿Cancelar esta cita?
        </h2>
        <p id="detalle-cancelar" className="mt-2 text-sm text-on-surface-variant">
          {cita.motivo} con {cita.doctor}, el {fechaLarga(cita.fecha)} a las {hora(cita.fecha)}. Si cambias
          de opinión, tendrás que agendar una nueva cita.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error-container px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={botonConservar}
            type="button"
            onClick={onConservar}
            disabled={cancelando}
            className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-60"
          >
            Conservar cita
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cancelando}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
          >
            {cancelando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {cancelando ? 'Cancelando…' : error ? 'Reintentar' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}