import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CalendarX,
  ChevronRight,
  MapPin,
  Plus,
  Siren,
  User,
} from 'lucide-react';
import { getAuth } from '../../config/permisos.js';
import { citasApi } from '../../services/api.js';
import AgendarCitaView from './AgendarCitaView';
import UrgenciaView from './UrgenciaView';
import { fechaCorta, hora, mayuscula } from './misCita/Utils.js';
import { BadgeEstado, etiquetaEstado } from '../../utils/estadoCita.jsx';

const botonPrimario =
  'flex cursor-pointer justify-center items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700';

const claseAtajo =
  'flex cursor-pointer items-center justify-between rounded-2xl border border-outline-variant bg-on-primary p-5 text-left transition-colors hover:bg-surface-container';

function fechaHoy() {
  const texto = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function presentarPalabra(texto) {
  const palabra = String(texto ?? '').trim().split(/\s+/)[0] ?? '';
  if (!palabra) return '';
  const minusculas = palabra.toLocaleLowerCase('es-MX');
  return minusculas.charAt(0).toLocaleUpperCase('es-MX') + minusculas.slice(1);
}

function saludoPorHora(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function esCancelada(estado) {
  return etiquetaEstado(estado) === 'Cancelada';
}

function adaptarCita(c) {
  const fecha = new Date(`${c.fecha}T${c.hora}`);
  if (Number.isNaN(fecha.getTime())) return null;

  return {
    id: c.id,
    idSede: c.id_sede,
    fecha,
    motivo: c.motivo ?? 'Consulta',
    doctor: c.doctor ?? '—',
    sede: String(c.sede ?? '').trim() || '—',
    estado: etiquetaEstado(c.estado) || 'Sin estado',
  };
}

function etiquetaRecordatorio(fecha) {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioCita = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dias = Math.round((inicioCita - inicioHoy) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

function mesCorto(fecha) {
  return fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
}

function KpiCargando() {
  return (
    <article className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-on-primary p-5" aria-hidden="true">
      <span className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-surface-container" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
        <div className="h-3 w-32 animate-pulse rounded bg-surface-container" />
      </div>
    </article>
  );
}

function HeroCargando() {
  return (
    <article className="rounded-2xl border border-outline-variant bg-on-primary p-6" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
        <div className="flex gap-5">
          <div className="h-16 w-16 animate-pulse rounded-xl bg-surface-container" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-surface-container" />
            <div className="h-3 w-32 animate-pulse rounded bg-surface-container" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PanelPacientePage() {
  const usuario = getAuth()?.usuario;
  const primerNombre = presentarPalabra(usuario?.nombre);
  const saludo = saludoPorHora();
  const navigate = useNavigate();

  const [vista, setVista] = useState('panel');
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const cargar = useCallback(async (signal) => {
    try {
      const datos = await citasApi.listar({ signal });
      const lista = Array.isArray(datos) ? datos : [];
      setCitas(lista.map(adaptarCita).filter(Boolean));
      setErrorCarga('');
    } catch (error) {
      if (error.name === 'AbortError') return;
      setCitas([]);
      setErrorCarga(error.message || 'No se pudieron cargar tus citas.');
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al montar
    void cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  function volverAlPanel() {
    setVista('panel');
    setCargando(true);
    setErrorCarga('');
    cargar();
  }

  const ahoraMs = new Date().getTime();
  const vigentes = useMemo(
    () => citas.filter((c) => !esCancelada(c.estado)),
    [citas],
  );
  const proximas = useMemo(
    () =>
      vigentes
        .filter((c) => c.fecha.getTime() >= ahoraMs)
        .sort((a, b) => a.fecha - b.fecha),
    [vigentes, ahoraMs],
  );
  const proxima = proximas[0] ?? null;
  const ultima = useMemo(() => {
    const pasadas = vigentes
      .filter((c) => c.fecha.getTime() < ahoraMs)
      .sort((a, b) => b.fecha - a.fecha);
    return pasadas[0] ?? null;
  }, [vigentes, ahoraMs]);

  if (vista === 'agendar') {
    return <AgendarCitaView onVolver={volverAlPanel} />;
  }

  if (vista === 'urgencia') {
    return <UrgenciaView onVolver={volverAlPanel} />;
  }

  return (
    <section className="flex min-w-0 flex-col gap-6 bg-surface p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            {primerNombre ? `${saludo}, ${primerNombre}` : saludo}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{fechaHoy()}</p>
        </div>
        <button type="button" className={botonPrimario} onClick={() => setVista('agendar')}>
          <Plus size={18} aria-hidden="true" />
          Agendar cita
        </button>
      </header>

      {errorCarga ? (
        <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl border border-outline-variant bg-on-primary p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-error">
            <AlertTriangle size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-on-surface">No pudimos cargar tus citas</p>
          <p className="text-sm text-on-surface-variant">{errorCarga}</p>
          <button
            type="button"
            onClick={() => {
              setCargando(true);
              setErrorCarga('');
              cargar();
            }}
            className="mt-1 cursor-pointer rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {cargando ? (
            <HeroCargando />
          ) : proxima ? (
            <button
              type="button"
              onClick={() => navigate('/mis-citas')}
              className="w-full cursor-pointer rounded-2xl border border-outline-variant bg-on-primary p-6 text-left transition-colors hover:bg-surface-container"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-sm font-bold text-on-surface">Tu próxima visita</h2>
                  <BadgeEstado estado={proxima.estado} />
                </div>
                <p className="text-xs font-medium text-outline">{etiquetaRecordatorio(proxima.fecha)}</p>
              </header>

              <div className="mt-6 flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-outline-variant bg-surface-container text-center">
                  <span className="text-[11px] font-bold tracking-wide text-outline uppercase">
                    {mesCorto(proxima.fecha)}
                  </span>
                  <span className="text-xl leading-none font-bold text-on-surface">{proxima.fecha.getDate()}</span>
                </div>
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-teal-50 text-teal-600">
                    <User size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface">{proxima.doctor}</p>
                    <p className="text-xs text-on-surface-variant">
                      {hora(proxima.fecha)} · {proxima.motivo}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-outline">
                      <MapPin size={14} aria-hidden="true" />
                      {proxima.sede}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <article className="rounded-2xl border border-outline-variant bg-on-primary p-6">
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                  <CalendarX size={22} aria-hidden="true" />
                </span>
                <h2 className="text-sm font-bold text-on-surface">Tu próxima visita</h2>
                <p className="text-sm text-on-surface-variant">
                  No tienes una visita próxima. Agenda una para verla aquí.
                </p>
                <button type="button" className={`${botonPrimario} mt-2`} onClick={() => setVista('agendar')}>
                  <Plus size={18} aria-hidden="true" />
                  Agendar cita
                </button>
              </div>
            </article>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cargando ? (
              <>
                <KpiCargando />
                <KpiCargando />
              </>
            ) : (
              <>
                <article className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-on-primary p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <CalendarClock size={22} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-outline uppercase">Citas próximas</p>
                    <p className="mt-0.5 truncate text-base font-bold text-on-surface">{proximas.length}</p>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                      {proximas.length === 0
                        ? 'Ninguna cita próxima'
                        : proximas.length === 1
                          ? '1 cita agendada'
                          : `${proximas.length} citas agendadas`}
                    </p>
                  </div>
                </article>

                <article className="flex items-start gap-4 rounded-2xl border border-outline-variant bg-on-primary p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Calendar size={22} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-outline uppercase">Última cita</p>
                    {ultima ? (
                      <>
                        <p className="mt-0.5 truncate text-base font-bold text-on-surface">
                          {mayuscula(fechaCorta(ultima.fecha))}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                          {ultima.motivo} · {ultima.doctor}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-0.5 truncate text-base font-bold text-on-surface">Sin citas anteriores</p>
                        <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                          Cuando asistas, aparecerá aquí.
                        </p>
                      </>
                    )}
                  </div>
                </article>
              </>
            )}
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-outline uppercase">Accesos directos</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setVista('urgencia')}
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

          <button type="button" onClick={() => navigate('/mis-citas')} className={claseAtajo}>
            <span className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                <Calendar size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-on-surface">Ver mis citas</span>
                <span className="block text-xs text-on-surface-variant">Consulta, reagenda o cancela</span>
              </span>
            </span>
            <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-outline" />
          </button>
        </div>
      </div>
    </section>
  );
}
