import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Loader2, X } from 'lucide-react';
// TODO: ajusta la ruta al archivo donde tienes apiRequest y las demás APIs
import { agendarCitasApi, citasApi } from '../../../services/api.js';
import { fechaLarga, hora, horaDesdeTexto, hoyISO } from './Utils.js';

/* Acepta ['09:00', ...] o [{ hora: '09:00:00' }, ...] y devuelve ['09:00', ...] sin repetidos */
function normalizarHorarios(datos) {
  const lista = Array.isArray(datos) ? datos : (datos?.horarios ?? datos?.data ?? []);
  const horas = lista
    .filter((h) => h?.disponible !== false)
    .map((h) => String(typeof h === 'string' ? h : (h?.hora ?? h?.hora_inicio ?? '')).slice(0, 5))
    .filter((h) => /^\d{2}:\d{2}$/.test(h));
  return [...new Set(horas)].sort();
}

// Si el día elegido es hoy, se quitan las horas que ya pasaron
function soloFuturos(horas, dia) {
  if (dia !== hoyISO()) return horas;
  const ahora = new Date();
  const actual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  return horas.filter((h) => h > actual);
}

/**
 * Props:
 *  - cita: { id, idSede, fecha: Date, motivo, doctor }
 *  - onReagendada({ fecha: 'AAAA-MM-DD', hora: 'HH:mm' }): el backend confirmó el cambio
 *  - onCerrar(): el usuario cerró el modal sin cambiar nada
 */
export default function ReagendarCitaModal({ cita, onReagendada, onCerrar }) {
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState('');
  const [horaElegida, setHoraElegida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const inputFecha = useRef(null);
  const solicitud = useRef(0);
  const cerrar = useRef(onCerrar);
  const ocupado = useRef(guardando);
  cerrar.current = onCerrar;
  ocupado.current = guardando;

  useEffect(() => {
    inputFecha.current?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !ocupado.current) cerrar.current();
    };
    window.addEventListener('keydown', alPresionar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      solicitud.current += 1; // ignora respuestas que lleguen después de cerrar
    };
  }, []);

  async function cargarHorarios(dia) {
    // Si el usuario cambia de día rápido, solo cuenta la última petición
    const id = ++solicitud.current;
    setCargandoHorarios(true);
    setErrorHorarios('');
    setHorarios([]);
    setHoraElegida('');
    try {
      const datos = await agendarCitasApi.horarios(cita.idSede, dia);
      if (id !== solicitud.current) return;
      setHorarios(soloFuturos(normalizarHorarios(datos), dia));
    } catch (e) {
      if (id !== solicitud.current) return;
      setErrorHorarios(e.message || 'No se pudieron cargar los horarios.');
    } finally {
      if (id === solicitud.current) setCargandoHorarios(false);
    }
  }

  function elegirFecha(valor) {
    setFecha(valor);
    setError('');
    if (valor) {
      cargarHorarios(valor);
    } else {
      solicitud.current += 1;
      setHorarios([]);
      setHoraElegida('');
      setCargandoHorarios(false);
    }
  }

  async function confirmar() {
    setGuardando(true);
    setError('');
    try {
      await citasApi.reagendar(cita.id, { fecha, hora: horaElegida });
      onReagendada({ fecha, hora: horaElegida });
    } catch (e) {
      setError(e.message || 'No se pudo reagendar la cita.');
      // El horario pudo ocuparse mientras decidías: se actualiza la lista
      if (e.status === 409) cargarHorarios(fecha);
      setGuardando(false);
    }
  }

  const nueva = fecha && horaElegida ? new Date(`${fecha}T${horaElegida}`) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !guardando && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reagendar"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant bg-on-primary p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
            <CalendarClock size={20} aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-60"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 id="titulo-reagendar" className="text-lg font-bold text-on-surface">
          Reagendar cita
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {cita.motivo} con {cita.doctor}
        </p>
        <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-sm text-on-surface-variant">
          Cita actual: <span className="font-semibold text-on-surface">{fechaLarga(cita.fecha)}, {hora(cita.fecha)}</span>
        </p>

        {/* Paso 1: fecha */}
        <label htmlFor="nueva-fecha" className="mb-1.5 mt-5 block text-sm font-semibold text-on-surface">
          Nueva fecha
        </label>
        <input
          ref={inputFecha}
          id="nueva-fecha"
          type="date"
          value={fecha}
          min={hoyISO()}
          onChange={(e) => elegirFecha(e.target.value)}
          disabled={guardando}
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />

        {/* Paso 2: horarios */}
        {fecha && (
          <div className="mt-5" aria-live="polite">
            <p className="mb-2 text-sm font-semibold text-on-surface">Horarios disponibles</p>

            {cargandoHorarios ? (
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Buscando horarios…
              </p>
            ) : errorHorarios ? (
              <div role="alert" className="flex flex-col items-start gap-2">
                <p className="text-sm text-error">{errorHorarios}</p>
                <button
                  type="button"
                  onClick={() => cargarHorarios(fecha)}
                  className="cursor-pointer rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                  Reintentar
                </button>
              </div>
            ) : horarios.length === 0 ? (
              <p className="rounded-xl bg-surface px-3 py-3 text-sm text-on-surface-variant">
                No hay horarios disponibles ese día. Prueba con otra fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {horarios.map((h) => {
                  const activo = horaElegida === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setHoraElegida(h)}
                      disabled={guardando}
                      className={`cursor-pointer rounded-xl border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${
                        activo
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline-variant text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {horaDesdeTexto(h)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Resumen del cambio */}
        {nueva && (
          <p className="mt-5 rounded-xl bg-primary-container/10 px-3 py-2 text-sm text-on-surface">
            Tu cita pasará al{' '}
            <span className="font-semibold">
              {fechaLarga(nueva)}, {hora(nueva)}
            </span>
            .
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error-container px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-60"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!nueva || guardando}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
          >
            {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {guardando ? 'Guardando…' : 'Confirmar cambio'}
          </button>
        </div>
      </div>
    </div>
  );
}