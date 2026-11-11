import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Clock, Loader2, X } from 'lucide-react';
import { agendarCitasApi, citasApi } from '../../../services/api.js';
import { fechaLarga, hora, horaDesdeTexto, hoyISO, mesDeHoy, moverMes, parseYmd, primerDiaMes } from './Utils.js';
import CalendarioMes from './CalendarioMes.jsx';

const DIAS_A_CONSULTAR = 30;
const etiquetaSeccion = 'text-sm font-semibold text-on-surface';
const etiquetaTurno = 'mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant';

/* Acepta ['09:00', ...] o [{ hora: '09:00:00' }, ...] y devuelve ['09:00', ...] sin repetidos */
function normalizarHorarios(datos) {
  const lista = Array.isArray(datos)
    ? datos
    : (datos?.horas ?? datos?.horarios ?? datos?.data ?? []);
  const horas = lista
    .filter((h) => h?.disponible !== false)
    .map((h) => String(typeof h === 'string' ? h : (h?.hora ?? h?.hora_inicio ?? '')).slice(0, 5))
    .filter((h) => /^\d{2}:\d{2}$/.test(h));
  return [...new Set(horas)].sort();
}

function extraerProximoDia(datos) {
  const valor = datos?.proximo_dia ?? datos?.proximoDia ?? null;
  return /^\d{4}-\d{2}-\d{2}$/.test(valor ?? '') ? valor : null;
}

function extraerDias(datos) {
  const lista = Array.isArray(datos) ? datos : (datos?.dias ?? []);
  return lista
    .map((d) => String(d).slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}

// Si el día elegido es hoy, se quitan las horas que ya pasaron
function soloFuturos(horas, dia) {
  if (dia !== hoyISO()) return horas;
  const ahora = new Date();
  const actual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  return horas.filter((h) => h > actual);
}

function ChipHora({ horaValor, activo, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-xl border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${
        activo
          ? 'border-teal-600 bg-teal-600 text-white'
          : 'border-outline-variant text-on-surface hover:bg-surface-container'
      }`}
    >
      {horaDesdeTexto(horaValor)}
    </button>
  );
}

function Turno({ titulo, horas, horaElegida, disabled, onElegir }) {
  return (
    <div>
      <p className={etiquetaTurno}>{titulo}</p>
      {horas.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {horas.map((h) => (
            <ChipHora
              key={h}
              horaValor={h}
              activo={horaElegida === h}
              disabled={disabled}
              onClick={() => onElegir(h)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">Sin horarios en este turno.</p>
      )}
    </div>
  );
}

/**
 * Props:
 *  - cita: { id, idSede, fecha: Date, motivo, doctor }
 *  - onReagendada({ fecha: 'AAAA-MM-DD', hora: 'HH:mm' }): el backend confirmó el cambio
 *  - onCerrar(): el usuario cerró el modal sin cambiar nada
 */
export default function ReagendarCitaModal({ cita, onReagendada, onCerrar }) {
  const [mesVisible, setMesVisible] = useState(mesDeHoy);
  const [diasLibres, setDiasLibres] = useState([]);
  const [cargandoDias, setCargandoDias] = useState(true);
  const [errorDias, setErrorDias] = useState('');
  const [intentoDias, setIntentoDias] = useState(0);

  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [proximoDia, setProximoDia] = useState(null);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState('');
  const [horaElegida, setHoraElegida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');

  const botonHoy = useRef(null);
  const primerClicable = useRef(null);
  const yaEnfoco = useRef(false);
  const solicitud = useRef(0);
  const cerrar = useRef(onCerrar);
  const ocupado = useRef(guardando);
  const confirmandoRef = useRef(false);

  useEffect(() => {
    cerrar.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    ocupado.current = guardando;
  }, [guardando]);

  useEffect(() => {
    confirmandoRef.current = confirmando;
  }, [confirmando]);

  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonHoy.current?.focus();

    const alPresionar = (e) => {
      if (e.key === 'Escape' && !ocupado.current) {
        e.preventDefault();
        if (confirmandoRef.current) {
          setConfirmando(false); // solo cierra la confirmación
        } else {
          cerrar.current();
        }
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
      solicitud.current += 1; // ignora respuestas que lleguen después de cerrar
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    agendarCitasApi
      .dias(cita.idSede, DIAS_A_CONSULTAR)
      .then((datos) => {
        if (cancelado) return;
        setDiasLibres(extraerDias(datos));
        setErrorDias('');
      })
      .catch((e) => {
        if (cancelado) return;
        setDiasLibres([]);
        setErrorDias(e.message || 'No se pudieron cargar los días disponibles.');
      })
      .finally(() => {
        if (!cancelado) setCargandoDias(false);
      });

    return () => {
      cancelado = true;
    };
  }, [cita.idSede, intentoDias]);

  useEffect(() => {
    if (cargandoDias || yaEnfoco.current) return;
    if (primerClicable.current) {
      primerClicable.current.focus();
    } else {
      botonHoy.current?.focus();
    }
    yaEnfoco.current = true;
  }, [cargandoDias, diasLibres]);

  const disponibles = useMemo(() => new Set(diasLibres), [diasLibres]);

  const { puedeAnterior, puedeSiguiente } = useMemo(() => {
    const mesHoy = mesDeHoy();
    if (diasLibres.length === 0) {
      return { puedeAnterior: false, puedeSiguiente: false };
    }
    const ultimo = parseYmd(diasLibres[diasLibres.length - 1]);
    const mesMax = ultimo ? primerDiaMes(ultimo) : mesHoy;
    return {
      puedeAnterior: mesVisible > mesHoy,
      puedeSiguiente: mesVisible < mesMax,
    };
  }, [diasLibres, mesVisible]);

  async function cargarHorarios(dia) {
    const id = ++solicitud.current;
    setCargandoHorarios(true);
    setErrorHorarios('');
    setHorarios([]);
    setHoraElegida('');
    setProximoDia(null);
    try {
      const datos = await agendarCitasApi.horarios(cita.idSede, dia);
      if (id !== solicitud.current) return;
      setHorarios(soloFuturos(normalizarHorarios(datos), dia));
      setProximoDia(extraerProximoDia(datos));
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
      const date = parseYmd(valor);
      if (date) setMesVisible(primerDiaMes(date));
      cargarHorarios(valor);
    } else {
      solicitud.current += 1;
      setHorarios([]);
      setHoraElegida('');
      setProximoDia(null);
      setCargandoHorarios(false);
    }
  }

  function reintentarDias() {
    setCargandoDias(true);
    setErrorDias('');
    setIntentoDias((n) => n + 1);
  }

  async function confirmar() {
    setGuardando(true);
    setError('');
    try {
      await citasApi.reagendar(cita.id, { fecha, hora: horaElegida });
      onReagendada({ fecha, hora: horaElegida });
    } catch (e) {
      setConfirmando(false); // regresa al modal principal para mostrar el error
      setError(e.message || 'No se pudo reagendar la cita.');
      if (e.status === 409) cargarHorarios(fecha);
      setGuardando(false);
    }
  }

  const nueva = fecha && horaElegida ? new Date(`${fecha}T${horaElegida}`) : null;
  const manana = horarios.filter((h) => h < '12:00');
  const tarde = horarios.filter((h) => h >= '12:00');
  const proximoClicable = proximoDia && disponibles.has(proximoDia) ? proximoDia : null;
  const proximoDate = proximoClicable ? parseYmd(proximoClicable) : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={() => !guardando && !confirmando && onCerrar()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reagendar"
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-on-primary p-6 shadow-xl"
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
            Cita actual:{' '}
            <span className="font-semibold text-on-surface">
              {fechaLarga(cita.fecha)}, {hora(cita.fecha)}
            </span>
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant bg-on-primary p-3 sm:p-4">
              <p className={`${etiquetaSeccion} mb-3`}>Nueva fecha</p>
              <CalendarioMes
                mesVisible={mesVisible}
                fechaSeleccionada={fecha}
                disponibles={disponibles}
                onSeleccionar={elegirFecha}
                onMesAnterior={() => setMesVisible((mes) => moverMes(mes, -1))}
                onMesSiguiente={() => setMesVisible((mes) => moverMes(mes, 1))}
                onHoy={() => setMesVisible(mesDeHoy())}
                puedeAnterior={puedeAnterior}
                puedeSiguiente={puedeSiguiente}
                disabled={guardando}
                botonHoyRef={botonHoy}
                primerClicableRef={primerClicable}
              />
              {cargandoDias ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Buscando días disponibles…
                </p>
              ) : errorDias ? (
                <div role="alert" className="mt-3 flex flex-col items-start gap-2">
                  <p className="text-sm text-error">{errorDias}</p>
                  <button
                    type="button"
                    onClick={reintentarDias}
                    className="cursor-pointer rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container"
                  >
                    Reintentar
                  </button>
                </div>
              ) : diasLibres.length === 0 ? (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <p className="rounded-xl bg-surface px-3 py-3 text-sm text-on-surface-variant">
                    No hay días con horarios libres en los próximos 30 días.
                  </p>
                  <button
                    type="button"
                    onClick={reintentarDias}
                    className="cursor-pointer rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-outline-variant bg-on-primary p-3 sm:p-4" aria-live="polite">
              <p className={`${etiquetaSeccion} mb-3 flex items-center gap-2`}>
                <Clock size={16} aria-hidden="true" />
                Horarios disponibles
              </p>

              {!fecha ? (
                <p className="text-sm text-on-surface-variant">Elige un día para ver los horarios.</p>
              ) : cargandoHorarios ? (
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
                <div className="rounded-xl bg-surface px-3 py-3 text-sm text-on-surface-variant">
                  <p>No hay horarios disponibles ese día. Prueba con otra fecha.</p>
                  {proximoDate ? (
                    <button
                      type="button"
                      onClick={() => elegirFecha(proximoClicable)}
                      disabled={guardando}
                      className="mt-2 cursor-pointer text-sm font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:text-teal-400 disabled:cursor-default disabled:opacity-60"
                    >
                      Ver próximo día disponible: {fechaLarga(proximoDate)} →
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Turno
                    titulo="Mañana"
                    horas={manana}
                    horaElegida={horaElegida}
                    disabled={guardando}
                    onElegir={setHoraElegida}
                  />
                  <Turno
                    titulo="Tarde"
                    horas={tarde}
                    horaElegida={horaElegida}
                    disabled={guardando}
                    onElegir={setHoraElegida}
                  />
                </div>
              )}
            </div>
          </div>

          {nueva && (
            <p className="mt-5 rounded-xl bg-teal-50 dark:bg-teal-950 px-3 py-2 text-sm text-teal-800 dark:text-teal-400">
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
              onClick={() => setConfirmando(true)}
              disabled={!nueva || guardando}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-default disabled:opacity-50"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </div>

      {confirmando && nueva && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !guardando && setConfirmando(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-reagendar"
            aria-describedby="desc-confirmar-reagendar"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-outline-variant bg-on-primary p-6 shadow-xl"
          >
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
              <CalendarClock size={20} aria-hidden="true" />
            </span>

            <h2 id="titulo-confirmar-reagendar" className="text-lg font-bold text-on-surface">
              ¿Seguro que quieres reagendar?
            </h2>

            <div id="desc-confirmar-reagendar" className="mt-3 flex flex-col gap-2 text-sm">
              <p className="rounded-xl bg-surface px-3 py-2 text-on-surface-variant">
                Cita actual:{' '}
                <span className="font-semibold text-on-surface">
                  {fechaLarga(cita.fecha)}, {hora(cita.fecha)}
                </span>
              </p>
              <p className="rounded-xl bg-teal-50 dark:bg-teal-950 px-3 py-2 text-teal-800 dark:text-teal-400">
                Nueva fecha:{' '}
                <span className="font-semibold">
                  {fechaLarga(nueva)}, {hora(nueva)}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmando(false)}
                disabled={guardando}
                className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-60"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={guardando}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-default disabled:opacity-50"
              >
                {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                {guardando ? 'Guardando…' : 'Sí, reagendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}