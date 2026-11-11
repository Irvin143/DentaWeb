import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';

import { citasApi } from '../../services/api.js';
import AgendarCitaView from './AgendarCitaView';
import ModalConfirmacion from '../../components/ModalConfirmacion.jsx';
import ReagendarCitaModal from './misCita/ModalReagendar.jsx';
import { ToastContainer } from '../../components/Toast.jsx';
import { fechaCorta, fechaLarga, hora, mayuscula } from './misCita/Utils.js';
import { BadgeEstado, etiquetaEstado } from '../../utils/estadoCita.jsx';

/* ---------- Constantes ---------- */

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'proximas', etiqueta: 'Próximas' },
  { id: 'pasadas', etiqueta: 'Pasadas' },
];

const REGISTROS_POR_PAGINA = 10;
const MOSTRAR_ACCIONES_PACIENTE = false;

const claseBotonAccion =
  'flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium whitespace-normal transition-colors';

// Solo las citas pendientes se pueden reagendar o cancelar
const ESTADOS_ACCIONABLES = ['Pendiente'];

const esPendienteFutura = (c) => c.fecha >= new Date() && ESTADOS_ACCIONABLES.includes(c.estado);

// Cancelar: cualquier cita pendiente futura (incluidas las de urgencia)
const puedeCancelar = (c) => esPendienteFutura(c);

// Reagendar: pendiente futura y que NO sea de urgencia
const puedeReagendar = (c) => esPendienteFutura(c) && !c.esUrgencia;

const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function adaptarCita(c) {
  const fecha = new Date(`${c.fecha}T${c.hora}`);
  if (Number.isNaN(fecha.getTime())) return null;
  console.log('adaptarCita', { c, fecha });

  return {
    id: c.id,
    idSede: c.id_sede,
    idOdontologo: c.id_odontologo ?? c.odontologo?.id_odontologo ?? null,
    idServicio: c.id_servicio ?? c.servicio?.id_servicio ?? null,
    fecha,
    motivo: c.motivo ?? 'Consulta',
    doctor: c.doctor ?? '—',
    estado: etiquetaEstado(c.estado) || 'Sin estado',
    esUrgencia: normalizar(c.tipo).includes('urgencia') || normalizar(c.motivo).includes('urgencia'),
  };
}

/* ---------- Toasts (para tu ToastContainer) ---------- */
// Cada toast: { id, tipo: 'exito' | 'error', mensaje, visible }
// Entra con visible=false y pasa a true en el siguiente cuadro para que se anime;
// al cerrarse vuelve a false y se quita cuando termina la animación.
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(0);
  const temporizadores = useRef(new Set());

  const programar = useCallback((fn, ms) => {
    const t = setTimeout(() => {
      temporizadores.current.delete(t);
      fn();
    }, ms);
    temporizadores.current.add(t);
  }, []);

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const cerrar = useCallback(
    (id) => {
      setToasts((actuales) => actuales.map((t) => (t.id === id ? { ...t, visible: false } : t)));
      programar(() => setToasts((actuales) => actuales.filter((t) => t.id !== id)), 300);
    },
    [programar],
  );

  const mostrar = useCallback(
    (tipo, mensaje, duracion = 5000) => {
      const id = ++siguienteId.current;
      setToasts((actuales) => [...actuales, { id, tipo, mensaje, visible: false }]);
      programar(() => setToasts((actuales) => actuales.map((t) => (t.id === id ? { ...t, visible: true } : t))), 20);
      programar(() => cerrar(id), duracion);
    },
    [programar, cerrar],
  );

  return { toasts, mostrar, cerrar };
}

function ResumenCitaCancelar({ cita }) {
  return (
    <>
      <p className="text-sm font-medium text-error">Vas a cancelar esta cita.</p>
      <div className="mt-3 rounded-xl border border-slate-200 dark:border-outline-variant bg-slate-50 dark:bg-surface-container p-4">
        <p className="text-base font-semibold text-slate-800 dark:text-on-surface">{cita.motivo}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-on-surface-variant">
          <User size={16} className="shrink-0 text-slate-400 dark:text-outline" aria-hidden="true" />
          {cita.doctor}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-on-surface-variant">
          <CalendarClock size={16} className="shrink-0 text-slate-400 dark:text-outline" aria-hidden="true" />
          {fechaLarga(cita.fecha)}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-on-surface-variant">
          <Clock size={16} className="shrink-0 text-slate-400 dark:text-outline" aria-hidden="true" />
          {hora(cita.fecha)}
        </p>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-on-surface-variant">
        Si cambias de opinión, tendrás que agendar una nueva cita.
      </p>
    </>
  );
}

function AccionesCita({ cita, onReagendar, onCancelar }) {
  const reagendar = puedeReagendar(cita);
  const cancelar = puedeCancelar(cita);

  if (!reagendar && !cancelar) {
    return (
      <p className="text-right text-outline" aria-label="Sin acciones disponibles">
        —
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {reagendar && (
        <button
          type="button"
          onClick={() => onReagendar(cita)}
          aria-label={`Reagendar cita de ${cita.motivo} del ${fechaCorta(cita.fecha)}`}
          className={`${claseBotonAccion} text-on-surface hover:bg-surface-container`}
        >
          <CalendarClock size={14} className="shrink-0 text-teal-700 dark:text-teal-400" aria-hidden="true" />
          Reagendar
        </button>
      )}
      {cancelar && (
        <button
          type="button"
          onClick={() => onCancelar(cita)}
          aria-label={`Cancelar cita de ${cita.motivo} del ${fechaCorta(cita.fecha)}`}
          className={`${claseBotonAccion} text-error hover:bg-error-container`}
        >
          <X size={14} className="shrink-0" aria-hidden="true" />
          Cancelar
        </button>
      )}
      {cita.esUrgencia && cancelar && (
        <p className="w-full text-right text-xs text-on-surface-variant">
          Las citas de urgencia no se pueden reagendar.
        </p>
      )}
    </div>
  );
}

function EstadoLista({ errorCarga, hayBusqueda, filtro, onReintentar }) {
  if (errorCarga) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-error">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-on-surface">No pudimos cargar tus citas</p>
        <p className="text-sm text-on-surface-variant">{errorCarga}</p>
        <button
          type="button"
          onClick={onReintentar}
          className="mt-2 cursor-pointer rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
        <CalendarX size={22} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-on-surface">
        {hayBusqueda ? 'Ninguna cita coincide con la búsqueda.' : 'No hay citas para mostrar'}
      </p>
      {!hayBusqueda && (
        <p className="text-sm text-on-surface-variant">
          {filtro === 'pasadas'
            ? 'Las citas que ya pasaron aparecerán aquí.'
            : 'Agenda una nueva cita para verla aquí.'}
        </p>
      )}
    </div>
  );
}

function TarjetaCita({ cita, onReagendar, onCancelar, mostrarAcciones }) {
  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-on-surface">{mayuscula(fechaCorta(cita.fecha))}</p>
        <p className="text-sm text-on-surface-variant">{hora(cita.fecha)}</p>
      </div>
      <p className="mt-2 text-sm text-on-surface">{cita.motivo}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{cita.doctor}</p>
      <div className="mt-2">
        <BadgeEstado estado={cita.estado} />
      </div>
      {mostrarAcciones && (
        <div className="mt-3">
          <AccionesCita cita={cita} onReagendar={onReagendar} onCancelar={onCancelar} />
        </div>
      )}
    </li>
  );
}

function PieTabla({ total, paginaActual, totalPaginas, onPagina }) {
  const etiqueta = total === 1 ? '1 cita' : `${total} citas`;
  const hayPaginas = total > REGISTROS_POR_PAGINA;
  const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * REGISTROS_POR_PAGINA, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-5 py-3">
      <p className="text-xs text-on-surface-variant">
        {hayPaginas ? `Mostrando ${inicio}–${fin} de ${etiqueta}` : etiqueta}
      </p>
      {hayPaginas ? (
        <nav aria-label="Paginación">
          <menu className="m-0 flex items-center gap-2 p-0">
            <button
              type="button"
              onClick={() => onPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              aria-label="Página anterior"
              className="cursor-pointer rounded-lg border border-outline-variant p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="text-xs font-medium text-on-surface-variant">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => onPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              aria-label="Página siguiente"
              className="cursor-pointer rounded-lg border border-outline-variant p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </menu>
        </nav>
      ) : null}
    </div>
  );
}

/* ---------- Página ---------- */
export default function CitasTablaPage() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [descendente, setDescendente] = useState(true);

  const [porCancelar, setPorCancelar] = useState(null);
  const [porReagendar, setPorReagendar] = useState(null);
  const [vista, setVista] = useState('lista');
  const { toasts, mostrar, cerrar: cerrarToast } = useToasts();

  const cargar = useCallback(async (signal) => {
    try {
      const datos = await citasApi.listar({ signal });
      setCitas(datos.map(adaptarCita).filter(Boolean));
      setErrorCarga('');
    } catch (error) {
      if (error.name === 'AbortError') return;
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

  const ahora = new Date();
  const ahoraMs = ahora.getTime();
  const conteo = {
    todas: citas.length,
    proximas: citas.filter((c) => c.fecha.getTime() >= ahoraMs).length,
    pasadas: citas.filter((c) => c.fecha.getTime() < ahoraMs).length,
  };

  const filas = useMemo(() => {
    const q = normalizar(busqueda);
    return citas
      .filter((c) =>
        filtro === 'todas' ? true : filtro === 'proximas' ? c.fecha.getTime() >= ahoraMs : c.fecha.getTime() < ahoraMs,
      )
      .filter((c) => {
        if (!q) return true;
        return normalizar(c.motivo).includes(q) || normalizar(c.doctor).includes(q);
      })
      .sort((a, b) => (descendente ? b.fecha - a.fecha : a.fecha - b.fecha));
  }, [citas, filtro, busqueda, descendente, ahoraMs]);

  const totalFilas = filas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalFilas / REGISTROS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const datosPagina = filas.slice(
    (paginaActual - 1) * REGISTROS_POR_PAGINA,
    paginaActual * REGISTROS_POR_PAGINA,
  );

  function elegirFiltro(id) {
    setFiltro(id);
    setPagina(1);
  }

  function alBuscar(valor) {
    setBusqueda(valor);
    setPagina(1);
  }

  function reintentar() {
    setCargando(true);
    setErrorCarga('');
    cargar();
  }

  async function confirmarCancelacion() {
    const cita = porCancelar;
    if (!cita) return;
    try {
      await citasApi.cancelar(cita.id);
      setCitas((actuales) => actuales.map((c) => (c.id === cita.id ? { ...c, estado: 'Cancelada' } : c)));
      mostrar('exito', 'Tu cita fue cancelada.');
    } catch (e) {
      mostrar('error', e.message || 'No se pudo cancelar la cita.');
    }
  }

  function alReagendar({ fecha, hora: horaNueva }) {
    const nueva = new Date(`${fecha}T${horaNueva}`);
    setCitas((actuales) => actuales.map((c) => (c.id === porReagendar.id ? { ...c, fecha: nueva } : c)));
    setPorReagendar(null);
    mostrar('exito', `Tu cita se reagendó para el ${fechaLarga(nueva)} a las ${hora(nueva)}.`);
  }

  const IconoOrden = descendente ? ArrowDown : ArrowUp;
  const hayBusqueda = Boolean(normalizar(busqueda));
  const mostrarPie = !cargando && !errorCarga && totalFilas > 0;
  const listaVacia = !cargando && (errorCarga || totalFilas === 0);

  if (vista === 'agendar') {
    return (
      <AgendarCitaView
        onVolver={() => {
          setVista('lista');
          reintentar();
        }}
      />
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-6 overflow-x-hidden bg-surface p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mis citas</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Todas tus citas en un solo lugar.</p>
        </div>
        <button
          type="button"
          onClick={() => setVista('agendar')}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700"
        >
          <Plus size={18} aria-hidden="true" />
          Agendar cita
        </button>
      </header>

      <search className="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant bg-on-primary p-2.5 shadow-sm sm:gap-4">
        <label className="relative min-w-0 flex-1 basis-48">
          <span className="sr-only">Buscar por motivo o odontólogo</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => alBuscar(e.target.value)}
            placeholder="Buscar por motivo o odontólogo…"
            className="w-full rounded-xl bg-surface py-2.5 pr-4 pl-10 text-base leading-5 text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <select
          aria-label="Filtrar citas"
          value={filtro}
          onChange={(e) => elegirFiltro(e.target.value)}
          disabled={cargando}
          className="h-10 w-auto min-w-[10rem] shrink-0 cursor-pointer rounded-xl border border-outline-variant bg-surface px-3 text-base leading-5 text-on-surface focus:ring-2 focus:ring-teal-500/20 focus:outline-none disabled:cursor-default disabled:opacity-60"
        >
          {FILTROS.map((f) => (
            <option key={f.id} value={f.id}>
              {cargando ? f.etiqueta : `${f.etiqueta} (${conteo[f.id]})`}
            </option>
          ))}
        </select>
      </search>

      <figure className="m-0 overflow-hidden rounded-2xl border border-outline-variant bg-on-primary shadow-sm">
        <section className="hidden overflow-x-hidden md:block" aria-busy={cargando}>
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface text-xs font-semibold tracking-wider text-outline uppercase">
              <tr>
                <th scope="col" className="w-[16%] p-0" aria-sort={descendente ? 'descending' : 'ascending'}>
                  <button
                    type="button"
                    onClick={() => setDescendente((d) => !d)}
                    aria-label={`Ordenar por fecha ${descendente ? 'ascendente' : 'descendente'}`}
                    className="flex w-full cursor-pointer items-center gap-1 px-5 py-3 uppercase tracking-wider transition-colors hover:text-on-surface"
                  >
                    Fecha
                    <IconoOrden size={13} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="w-[10%] px-5 py-3">
                  Hora
                </th>
                <th scope="col" className="w-[18%] min-w-0 px-5 py-3">
                  Motivo
                </th>
                <th scope="col" className="w-[16%] min-w-0 px-5 py-3">
                  Doctor
                </th>
                <th scope="col" className="w-[14%] min-w-0 px-5 py-3">
                  Estado
                </th>
                {MOSTRAR_ACCIONES_PACIENTE && (
                  <th scope="col" className="w-[26%] min-w-0 px-5 py-3 text-right">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <FilasCargando />
              ) : listaVacia ? (
                <tr>
                    <td colSpan={MOSTRAR_ACCIONES_PACIENTE ? 6 : 5} className="px-5 py-12">
                    <EstadoLista
                      errorCarga={errorCarga}
                      hayBusqueda={hayBusqueda}
                      filtro={filtro}
                      onReintentar={reintentar}
                    />
                  </td>
                </tr>
              ) : (
                datosPagina.map((c) => (
                  <tr
                    key={c.id}
                    className="group border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container"
                  >
                    <td className="px-5 py-3 font-medium whitespace-nowrap text-on-surface">
                      {mayuscula(fechaCorta(c.fecha))}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-on-surface-variant">{hora(c.fecha)}</td>
                    <td className="min-w-0 px-5 py-3 break-words text-on-surface">{c.motivo}</td>
                    <td className="min-w-0 px-5 py-3 break-words text-on-surface-variant">{c.doctor}</td>
                    <td className="min-w-0 px-5 py-3">
                      <BadgeEstado estado={c.estado} />
                    </td>
                    {MOSTRAR_ACCIONES_PACIENTE && (
                      <td className="min-w-0 px-5 py-3">
                        <AccionesCita
                          cita={c}
                          onReagendar={setPorReagendar}
                          onCancelar={setPorCancelar}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <ul className="m-0 list-none divide-y divide-outline-variant p-0 md:hidden" aria-busy={cargando}>
          {cargando ? (
            <TarjetasCargando />
          ) : listaVacia ? (
            <li className="px-4 py-12">
              <EstadoLista
                errorCarga={errorCarga}
                hayBusqueda={hayBusqueda}
                filtro={filtro}
                onReintentar={reintentar}
              />
            </li>
          ) : (
            datosPagina.map((c) => (
              <TarjetaCita
                key={c.id}
                cita={c}
                onReagendar={setPorReagendar}
                onCancelar={setPorCancelar}
                mostrarAcciones={MOSTRAR_ACCIONES_PACIENTE}
              />
            ))
          )}
        </ul>

        {mostrarPie && (
          <PieTabla
            total={totalFilas}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onPagina={setPagina}
          />
        )}
      </figure>

      <ModalConfirmacion
        isOpen={Boolean(porCancelar)}
        onClose={() => setPorCancelar(null)}
        onConfirm={confirmarCancelacion}
        titulo="Cancelar cita"
        mensaje={porCancelar ? <ResumenCitaCancelar cita={porCancelar} /> : null}
        textoConfirmar="Cancelar cita"
        esPeligro
        palabraRequerida="CANCELAR"
      />
      {porReagendar && (
        <ReagendarCitaModal cita={porReagendar} onReagendada={alReagendar} onCerrar={() => setPorReagendar(null)} />
      )}

      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />
    </section>
  );
}

function FilasCargando() {
  return Array.from({ length: 4 }, (_, i) => (
    <tr key={i} className="border-b border-outline-variant last:border-b-0" aria-hidden="true">
      {[24, 16, 36, 24, 20, 28].map((ancho, j) => (
        <td key={j} className="px-5 py-3">
          <div
            className="h-4 max-w-full animate-pulse rounded bg-surface-container"
            style={{ width: `${ancho * 4}px` }}
          />
        </td>
      ))}
    </tr>
  ));
}

function TarjetasCargando() {
  return Array.from({ length: 4 }, (_, i) => (
    <li key={i} className="space-y-2 px-4 py-4" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      <div className="h-4 w-56 animate-pulse rounded bg-surface-container" />
      <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
    </li>
  ));
}