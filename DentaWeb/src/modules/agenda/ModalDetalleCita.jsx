import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowRight, Calendar, Clock, Hospital, Stethoscope, User, X } from 'lucide-react';
import { BadgeEstado, OPCIONES_ESTADO_CITA, etiquetaEstado, estadoParaApi, claseEstado } from '../../utils/estadoCita.jsx';
import { citasApi } from '../../services/api.js';
import ModalConfirmacion from '../../components/ModalConfirmacion.jsx';

const LOCALE = 'es-MX';
const ZONA = 'America/Mazatlan';

const horaCorta = (valor) => String(valor ?? '').slice(0, 5);

const capitalizar = (texto) => {
  const t = String(texto ?? '').trim();
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase(LOCALE) + t.slice(1);
};

const parseYmd = (ymd) => {
  const [y, m, d] = String(ymd ?? '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const fechaLarga = (ymd) => {
  const date = parseYmd(ymd);
  if (!date) return '';
  return capitalizar(
    date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
};

const nombreCompleto = (persona, respaldo) =>
  [persona?.nombre, persona?.ape_pat, persona?.ape_mat].filter(Boolean).join(' ').trim() || respaldo;

const textoOpcional = (valor) => {
  const t = String(valor ?? '').trim();
  return t || null;
};

const esUrgencia = (cita) => /urgenc/i.test(String(cita?.tipo ?? ''));

function ahoraEnZona() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}T${valor('hour')}:${valor('minute')}`;
}

function citaYaOcurrio(cita) {
  const fecha = String(cita?.fecha ?? '').slice(0, 10);
  const hora = horaCorta(cita?.hora);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return false;
  return `${fecha}T${hora}` <= ahoraEnZona();
}

// Clases de fondo de píldora por estado (para el selector visual)
const CLASES_PILDORA = {
  PENDIENTE:   'border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  CONFIRMADA:  'border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  ATENDIDA:    'border-teal-300 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  CANCELADA:   'border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  NO_ASISTIO:  'border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

const CLASES_PILDORA_ACTIVA = {
  PENDIENTE:   'ring-2 ring-yellow-400 ring-offset-1',
  CONFIRMADA:  'ring-2 ring-yellow-400 ring-offset-1',
  ATENDIDA:    'ring-2 ring-teal-400 ring-offset-1',
  CANCELADA:   'ring-2 ring-red-400 ring-offset-1',
  NO_ASISTIO:  'ring-2 ring-red-400 ring-offset-1',
};

const ES_DESTRUCTIVO = { CANCELADA: true, NO_ASISTIO: true };

// Estados que solo se pueden aplicar cuando ya pasó la hora de la cita
const SOLO_DESPUES_DE_LA_CITA = { ATENDIDA: true, NO_ASISTIO: true };

function InfoFila({ icono, etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-outline-variant dark:bg-surface-container">
      <span className="mt-0.5 shrink-0 text-on-surface-variant">{icono}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{etiqueta}</p>
        <p className="mt-0.5 text-sm text-on-surface">{valor}</p>
      </div>
    </div>
  );
}

export default function ModalDetalleCita({ cita, onCerrar, onGuardado }) {
  const cerrarRef = useRef(onCerrar);
  const botonCerrar = useRef(null);
  cerrarRef.current = onCerrar;

  const yaOcurrio = citaYaOcurrio(cita);
  const estadoActual = estadoParaApi(cita?.estado);
  const estadoInvalidoPorFecha = Boolean(SOLO_DESPUES_DE_LA_CITA[estadoActual]) && !yaOcurrio;
  const valorInicial = estadoInvalidoPorFecha ? '' : (estadoActual ?? '');

  const [estadoElegido, setEstadoElegido] = useState(valorInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  useEffect(() => {
    setEstadoElegido(valorInicial);
    setError(null);
  }, [cita?.id_cita, valorInicial]);

  useEffect(() => {
    botonCerrar.current?.focus();
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPresionar = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrarRef.current();
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  const opciones = useMemo(
    () =>
      OPCIONES_ESTADO_CITA.map((opcion) => {
        const deshabilitada = Boolean(SOLO_DESPUES_DE_LA_CITA[opcion.valor]) && !yaOcurrio;
        return {
          ...opcion,
          deshabilitada,
          titulo: deshabilitada ? 'Solo cuando ya pasó la hora de la cita' : undefined,
        };
      }),
    [yaOcurrio]
  );

  const puedeGuardar =
    Boolean(estadoElegido) &&
    estadoElegido !== estadoActual &&
    !(SOLO_DESPUES_DE_LA_CITA[estadoElegido] && !yaOcurrio);

  const confirmarGuardar = () => {
    if (!puedeGuardar || guardando) return;
    setConfirmacionAbierta(true);
  };

  const ejecutarGuardar = async () => {
    const id = cita?.id_cita;
    if (id == null) return;
    try {
      setGuardando(true);
      setError(null);
      const actualizada = await citasApi.cambiarEstado(id, estadoElegido);
      onGuardado?.(actualizada);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el estado.');
    } finally {
      setGuardando(false);
    }
  };

  const urgencia = esUrgencia(cita);
  const horario = [horaCorta(cita.hora), horaCorta(cita.hora_fin)].filter(Boolean).join(' – ');
  const fecha = fechaLarga(cita.fecha);
  const servicio = textoOpcional(cita.servicio);
  const tipo = textoOpcional(cita.tipo);
  const observaciones = textoOpcional(cita.observaciones);
  const nombrePaciente = nombreCompleto(cita.paciente, 'Paciente');

  // Texto del modal de confirmación
  const etiquetaActual  = etiquetaEstado(estadoActual)  || estadoActual  || '—';
  const etiquetaNueva   = etiquetaEstado(estadoElegido) || estadoElegido || '—';
  const esDestructivo   = Boolean(ES_DESTRUCTIVO[estadoElegido]);
  const esCancelacion   = estadoElegido === 'CANCELADA';
  const palabraRequerida = esCancelacion ? 'CANCELAR' : '';
  const textoConfirmar  =
    estadoElegido === 'CANCELADA'  ? 'Confirmar cancelación' :
    estadoElegido === 'NO_ASISTIO' ? 'Confirmar inasistencia' :
    'Cambiar estado';

  const mensajeConfirmacion = (
    <span>
      ¿Deseas cambiar el estado de la cita de{' '}
      <strong>{etiquetaActual}</strong> a <strong>{etiquetaNueva}</strong> para el paciente{' '}
      <strong>{nombrePaciente}</strong>?
    </span>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        onClick={onCerrar}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalle-cita"
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant bg-on-primary shadow-xl"
        >
          {/* ── Header ───────────────────────────────── */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-variant px-6 py-5">
            <div className="min-w-0">
              {urgencia && (
                <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 text-xs font-semibold text-error">
                  <AlertTriangle size={11} aria-hidden="true" />
                  Urgencia
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Paciente
              </p>
              <h2
                id="titulo-detalle-cita"
                className="mt-0.5 text-xl font-bold text-on-surface"
              >
                {nombrePaciente}
              </h2>
              {cita.estado ? (
                <div className="mt-2">
                  <BadgeEstado estado={cita.estado} />
                </div>
              ) : null}
            </div>
            <button
              ref={botonCerrar}
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ── Body (scrollable) ─────────────────────── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
            {/* Info de la cita */}
            <div className="grid gap-2 sm:grid-cols-2">
              {(horario || fecha) && (
                <InfoFila
                  icono={<Clock size={15} />}
                  etiqueta="Horario"
                  valor={[horario, fecha].filter(Boolean).join(' · ')}
                />
              )}
              <InfoFila
                icono={<Calendar size={15} />}
                etiqueta="Fecha"
                valor={fecha}
              />
              <InfoFila
                icono={<User size={15} />}
                etiqueta="Odontólogo"
                valor={nombreCompleto(cita.odontologo, null)}
              />
              <InfoFila
                icono={<Hospital size={15} />}
                etiqueta="Clínica"
                valor={textoOpcional(cita.clinica?.nombre)}
              />
              {servicio && (
                <InfoFila
                  icono={<Stethoscope size={15} />}
                  etiqueta="Servicio"
                  valor={servicio}
                />
              )}
              {tipo && (
                <InfoFila
                  icono={<Stethoscope size={15} />}
                  etiqueta="Tipo"
                  valor={tipo}
                />
              )}
            </div>

            {observaciones && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-outline-variant dark:bg-surface-container">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Observaciones
                </p>
                <p className="mt-0.5 text-sm text-on-surface">{observaciones}</p>
              </div>
            )}

            {/* Selector visual de estado */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Cambiar estado
              </p>

              {/* Flecha de transición si hay selección diferente al actual */}
              {puedeGuardar && (
                <div className="mb-3 flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASES_PILDORA[estadoActual] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    {etiquetaActual}
                  </span>
                  <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASES_PILDORA[estadoElegido] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    {etiquetaNueva}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar nuevo estado de la cita">
                {opciones.map((opcion) => {
                  const activa = estadoElegido === opcion.valor;
                  const clasePildora = CLASES_PILDORA[opcion.valor] ?? 'border-slate-200 bg-slate-50 text-slate-700';
                  const claseActiva  = activa ? (CLASES_PILDORA_ACTIVA[opcion.valor] ?? 'ring-2 ring-slate-400 ring-offset-1') : '';
                  return (
                    <button
                      key={opcion.valor}
                      type="button"
                      disabled={opcion.deshabilitada}
                      title={opcion.titulo}
                      aria-pressed={activa}
                      onClick={() => {
                        if (!opcion.deshabilitada) {
                          setEstadoElegido(opcion.valor);
                          setError(null);
                        }
                      }}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2
                        ${clasePildora}
                        ${claseActiva}
                        ${opcion.deshabilitada ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90'}
                      `}
                    >
                      {opcion.etiqueta}
                    </button>
                  );
                })}
              </div>

              {!yaOcurrio && (
                <p className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant">
                  <AlertTriangle size={11} className="shrink-0 text-yellow-600" aria-hidden="true" />
                  «Atendida» y «No asistió» solo estarán disponibles cuando haya pasado la hora de la cita.
                </p>
              )}

              {error && (
                <p className="mt-2 rounded-lg bg-error-container px-3 py-2 text-sm text-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* ── Footer ───────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant px-6 py-4">
            <button
              type="button"
              onClick={onCerrar}
              className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={confirmarGuardar}
              disabled={!puedeGuardar || guardando}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Aplicar cambio'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación (z-[70] para superponerse) */}
      <ModalConfirmacion
        isOpen={confirmacionAbierta}
        onClose={() => setConfirmacionAbierta(false)}
        onConfirm={ejecutarGuardar}
        titulo={esCancelacion ? 'Cancelar cita' : '¿Confirmar cambio de estado?'}
        mensaje={mensajeConfirmacion}
        textoConfirmar={textoConfirmar}
        esPeligro={esDestructivo}
        palabraRequerida={palabraRequerida}
      />
    </>,
    document.body
  );
}