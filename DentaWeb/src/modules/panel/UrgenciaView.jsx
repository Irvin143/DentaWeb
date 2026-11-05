import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Link2Off,
  Loader2,
  MapPin,
  Plus,
  ShieldAlert,
  Split,
  User,
  Zap,
} from 'lucide-react';
import { urgenciasApi } from '../../services/api.js';
import { ToastContainer } from '../../components/Toast.jsx';
import { useToasts } from '../../hooks/useToasts.js';

const motivos = [
  { id: 'dolor', titulo: 'Dolor agudo o punzante', desc: 'Sensibilidad extrema', icono: Zap },
  { id: 'roto', titulo: 'Diente roto o fisurado', desc: 'Trauma o golpe', icono: Split },
  { id: 'bracket', titulo: 'Bracket despegado', desc: 'Arco pinchando', icono: Link2Off },
  { id: 'sangrado', titulo: 'Inflamación / Sangrado', desc: 'Encía hinchada', icono: Droplets },
  { id: 'corona', titulo: 'Pérdida de corona/calza', desc: 'Espacio expuesto', icono: Activity },
  { id: 'otro', titulo: 'Otro incidente', desc: 'Describir abajo', icono: Plus },
];

const MIN_SINTOMAS = 5;
const MAX_SINTOMAS = 1000;

const botonPrimario =
  'flex cursor-pointer justify-center items-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-outline disabled:shadow-none';

const claseSeleccion = (activo) =>
  activo
    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950'
    : 'border-outline-variant bg-on-primary hover:bg-surface-container';

/* ============================================================
   HELPERS
   ============================================================ */

const dosDigitos = (n) => String(n).padStart(2, '0');

const hora12 = (fecha) => {
  const h = fecha.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dosDigitos(h12)}:${dosDigitos(fecha.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

const hhmmA12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return hora12(new Date(2000, 0, 1, h, m));
};

function opcionesHoraLlegada(ahora, cantidad = 6) {
  const base = new Date(ahora.getTime() + 60 * 60000);
  base.setSeconds(0, 0);
  const resto = base.getMinutes() % 30;
  if (resto !== 0) base.setMinutes(base.getMinutes() + (30 - resto));

  const opciones = [];
  for (let i = 0; i < cantidad; i += 1) {
    const t = new Date(base.getTime() + i * 30 * 60000);
    if (t.getDate() !== ahora.getDate()) break;
    opciones.push({ valor: `${dosDigitos(t.getHours())}:${dosDigitos(t.getMinutes())}`, etiqueta: hora12(t) });
  }
  return opciones;
}

const urlMapa = (direccion) =>
  direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
    : null;

const FORM_INICIAL = {
  motivo: '',
  sintomas: '',
  sede: '',
  llegada: 'inmediato',
  hora: '',
};

/* ============================================================
   VISTA
   ============================================================ */

export default function UrgenciaView({ onVolver }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroresCampos, setErroresCampos] = useState({});
  const [cargando, setCargando] = useState(false);
  const toasts = useToasts();
  const [resultado, setResultado] = useState(null);
  const formularioRef = useRef(null);
  const [confirmando, setConfirmando] = useState(false);

  const [sedes, setSedes] = useState([]);
  const [cargandoSedes, setCargandoSedes] = useState(true);
  const [errorSedes, setErrorSedes] = useState(false);
  const [intentoSedes, setIntentoSedes] = useState(0);

  useEffect(() => {
    let cancelado = false;

    urgenciasApi
      .sedes()
      .then((res) => {
        if (cancelado) return;
        const lista = Array.isArray(res) ? res : res?.data ?? res?.sedes ?? [];
        const normalizadas = lista.map((s) => ({
          id: String(s.id_sede ?? s.id),
          nombre: s.nombre,
          direccion: s.direccion ?? '',
        }));
        setSedes(normalizadas);
        if (normalizadas.length === 1) {
          setForm((f) => ({ ...f, sede: normalizadas[0].id }));
        }
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar las sedes de urgencia:', err);
        setErrorSedes(true);
      })
      .finally(() => {
        if (!cancelado) setCargandoSedes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [intentoSedes]);

  const ahora = new Date();
  const horasLlegada = opcionesHoraLlegada(ahora);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const validar = () => {
    const errores = {};
    if (!form.motivo) errores.motivo = 'Elige el motivo de tu urgencia';
    const sintomas = form.sintomas.trim();
    if (sintomas.length < MIN_SINTOMAS) errores.sintomas = 'Describe brevemente tus síntomas';
    else if (sintomas.length > MAX_SINTOMAS)
      errores.sintomas = `La descripción no puede exceder ${MAX_SINTOMAS} caracteres`;
    if (!form.sede) errores.sede = 'Elige la sede a la que acudirás';
    if (form.llegada === 'hora' && !form.hora) errores.hora = 'Elige a qué hora llegarás';
    return errores;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errores = validar();
    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      requestAnimationFrame(() => {
        const primero = Object.keys(errores)[0];
        formularioRef.current
          ?.querySelector(`[data-campo="${primero}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setConfirmando(true);
    window.scrollTo({ top: 0 });
  };

  const confirmarCita = async () => {
    if (cargando) return;
    setCargando(true);
    try {
      const urgencia = await urgenciasApi.crear({
        id_sede: Number(form.sede),
        motivo: form.motivo,
        sintomas: form.sintomas.trim(),
        hora_llegada: form.llegada === 'hora' ? form.hora : null,
      });
      setResultado(urgencia);
      toasts.exito(`Urgencia registrada: te esperamos hoy a las ${hhmmA12(urgencia.hora)}.`);
      onVolver();
    } catch (err) {
      toasts.error(err.message || 'No pudimos registrar tu urgencia. Intenta de nuevo o llama a la clínica.');
    } finally {
      setCargando(false);
    }
  };

  const claseCampo = (campo) =>
    `w-full rounded-xl border bg-on-primary p-3 text-base leading-5 text-on-surface outline-none focus:ring-2 ${
      erroresCampos[campo]
        ? 'border-error focus:border-error focus:ring-error/20'
        : 'border-outline-variant focus:border-teal-600 focus:ring-teal-500/20'
    }`;

  const avisoCampo = (campo) =>
    erroresCampos[campo] && <p className="mt-2 text-xs text-error">{erroresCampos[campo]}</p>;

  if (confirmando) {
    const sedeElegida = sedes.find((s) => s.id === form.sede);
    const motivoElegido = motivos.find((m) => m.id === form.motivo);
    const IconoMotivo = motivoElegido?.icono ?? Plus;
    const mapa = urlMapa(sedeElegida?.direccion);
    const textoLlegada =
      form.llegada === 'hora'
        ? `Hoy desde las ${hhmmA12(form.hora)}`
        : `En 30-45 min (desde las ${hora12(new Date(ahora.getTime() + 30 * 60000))})`;

    return (
      <div className="min-h-full w-full bg-surface p-4 md:p-8 lg:px-10 lg:py-8">
        <ToastContainer toasts={toasts.toasts} onCerrar={toasts.cerrar} />
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <ShieldAlert size={36} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-on-surface">¿Confirmas tu cita de urgencia?</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Revisa los datos. Al confirmar, registraremos tu urgencia de inmediato.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-outline-variant bg-on-primary p-5">
            <div className="divide-y divide-outline-variant">
              <div className="flex items-start gap-3 pb-3">
                <IconoMotivo size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wider text-outline uppercase">Motivo</p>
                  <p className="break-words text-sm font-bold text-on-surface">{motivoElegido?.titulo}</p>
                  <p className="mt-1 line-clamp-3 break-words text-xs text-on-surface-variant">
                    {form.sintomas.trim()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <Building2 size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wider text-outline uppercase">Sede</p>
                  <p className="break-words text-sm font-bold text-on-surface">{sedeElegida?.nombre}</p>
                  {sedeElegida?.direccion && (
                    <p className="break-words text-xs text-on-surface-variant">{sedeElegida.direccion}</p>
                  )}
                  {mapa && (
                    <a
                      href={mapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                    >
                      <MapPin size={14} /> Ver en mapa
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-xs font-semibold tracking-wider text-outline uppercase">Llegada</p>
                  <p className="text-sm font-bold text-on-surface">{textoLlegada}</p>
                  <p className="text-xs text-on-surface-variant">
                    Tu cita queda registrada como «Odontólogo Urgencia». Al llegar, te atiende el primer
                    odontólogo disponible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={confirmarCita}
              disabled={cargando}
              className={`${botonPrimario} w-full`}
            >
              {cargando ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Confirmando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar cita
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={cargando}
              className="cursor-pointer rounded-xl border border-outline-variant px-5 py-3.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              Editar datos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-surface p-4 md:p-8 lg:px-10 lg:py-8">
      <ToastContainer toasts={toasts.toasts} onCerrar={toasts.cerrar} />
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver al panel"
            className="cursor-pointer rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Urgencia dental</h1>
            <p className="text-sm text-on-surface-variant">
              Atención el mismo día: te atiende el primer odontólogo disponible al llegar
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant md:inline">
          Hoy
        </span>
      </header>

      <form
        ref={formularioRef}
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
      >
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="flex gap-3 rounded-2xl border border-outline-variant bg-error-container p-4">
            <ShieldAlert className="shrink-0 text-error" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-error">Guía de seguridad vital</h3>
              <p className="mt-1 text-xs leading-relaxed text-error">
                Si presentas traumatismo craneofacial severo o dificultad respiratoria, acude a urgencias hospitalarias. Para dolor agudo, hemorragias locales y fracturas dentales, nuestro equipo de guardia está listo.
              </p>
            </div>
          </div>

          <section data-campo="motivo">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">1</span>
                Motivo principal de urgencia
              </span>
              <span className="text-xs font-normal text-on-surface-variant">Obligatorio</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {motivos.map((m) => {
                const Icono = m.icono;
                const activo = form.motivo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => cambiar('motivo', m.id)}
                    className={`relative cursor-pointer rounded-xl border p-4 text-left transition-colors ${claseSeleccion(activo)}`}
                  >
                    <Icono size={24} className={`mb-2 ${activo ? 'text-teal-600 dark:text-teal-400' : 'text-outline'}`} />
                    <p className="text-sm font-bold text-on-surface">{m.titulo}</p>
                    <p className="text-xs text-on-surface-variant">{m.desc}</p>
                    <div
                      className={`absolute top-3 right-3 h-4 w-4 rounded-full border-2 ${
                        activo ? 'border-teal-600 bg-teal-600' : 'border-outline-variant'
                      }`}
                    >
                      {activo && <div className="m-[2px] h-2 w-2 rounded-full bg-on-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {avisoCampo('motivo')}
          </section>

          <section data-campo="sintomas">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">2</span>
              Describe brevemente tus síntomas
            </h2>
            <textarea
              className={`${claseCampo('sintomas')} resize-none`}
              rows="4"
              maxLength={MAX_SINTOMAS}
              placeholder="¿Cuándo inició el dolor? ¿Aumenta con frío, calor o al masticar?..."
              value={form.sintomas}
              onChange={(e) => cambiar('sintomas', e.target.value)}
            />
            {avisoCampo('sintomas')}
            <button
              type="button"
              disabled
              className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container py-3 text-sm font-semibold text-outline"
            >
              <Camera size={18} /> Subir foto de la molestia (próximamente)
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <section data-campo="sede">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">3</span>
                ¿A qué sede acudirás?
              </span>
              <span className="text-xs font-normal text-on-surface-variant">Obligatorio</span>
            </h2>

            {cargandoSedes && (
              <p className="flex items-center gap-2 py-2 text-sm text-on-surface-variant">
                <Loader2 size={16} className="animate-spin" /> Buscando sedes...
              </p>
            )}
            {errorSedes && (
              <div className="rounded-xl bg-error-container p-3 text-sm text-error">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} /> No pudimos cargar las sedes
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCargandoSedes(true);
                    setErrorSedes(false);
                    setIntentoSedes((n) => n + 1);
                  }}
                  className="mt-1 cursor-pointer text-xs font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            )}
            {!cargandoSedes && !errorSedes && sedes.length === 0 && (
              <p className="rounded-xl bg-surface-container p-3 text-sm text-on-surface-variant">
                Por ahora ninguna sede puede recibir urgencias en línea. Llama directamente a la clínica.
              </p>
            )}

            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
              {sedes.map((sede) => {
                const activa = form.sede === sede.id;
                const mapa = urlMapa(sede.direccion);
                return (
                  <div
                    key={sede.id}
                    className={`flex items-center gap-2 rounded-xl border pr-3 transition-colors ${claseSeleccion(activa)}`}
                  >
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => cambiar('sede', sede.id)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left"
                    >
                      <Building2 size={20} className={`shrink-0 ${activa ? 'text-teal-600 dark:text-teal-400' : 'text-outline'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-on-surface">{sede.nombre}</span>
                        {sede.direccion && (
                          <span className="block truncate text-xs text-on-surface-variant">{sede.direccion}</span>
                        )}
                      </span>
                      {activa && <CheckCircle2 size={18} className="shrink-0 text-teal-600 dark:text-teal-400" />}
                    </button>
                    {mapa && (
                      <a
                        href={mapa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver ${sede.nombre} en Google Maps`}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                      >
                        <MapPin size={14} /> Mapa
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            {avisoCampo('sede')}
          </section>

          <section data-campo="hora">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">4</span>
                Estimación de llegada
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${claseSeleccion(form.llegada === 'inmediato')}`}
              >
                <div className="flex items-center gap-3">
                  <Zap size={20} className={form.llegada === 'inmediato' ? 'text-teal-600 dark:text-teal-400' : 'text-outline'} />
                  <div>
                    <p className="font-bold text-on-surface">
                      En 30-45 min{' '}
                      <span className="ml-1 rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Inmediato
                      </span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Llegada estimada desde las {hora12(new Date(ahora.getTime() + 30 * 60000))}
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="llegada"
                  value="inmediato"
                  checked={form.llegada === 'inmediato'}
                  onChange={() => cambiar('llegada', 'inmediato')}
                  className="h-4 w-4 accent-teal-600"
                />
              </label>

              <label
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  horasLlegada.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${claseSeleccion(form.llegada === 'hora')}`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={20} className={form.llegada === 'hora' ? 'text-teal-600 dark:text-teal-400' : 'text-outline'} />
                  <div>
                    <p className="font-bold text-on-surface">Llegaré más tarde hoy</p>
                    <p className="text-xs text-on-surface-variant">
                      {horasLlegada.length === 0
                        ? 'Ya no hay horarios disponibles para hoy'
                        : 'Te atendemos al llegar, a partir de esa hora'}
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="llegada"
                  value="hora"
                  checked={form.llegada === 'hora'}
                  disabled={horasLlegada.length === 0}
                  onChange={() => cambiar('llegada', 'hora')}
                  className="h-4 w-4 accent-teal-600"
                />
              </label>

              {form.llegada === 'hora' && horasLlegada.length > 0 && (
                <select
                  value={form.hora}
                  onChange={(e) => cambiar('hora', e.target.value)}
                  aria-label="Hora de llegada"
                  className={claseCampo('hora')}
                >
                  <option value="">Selecciona la hora</option>
                  {horasLlegada.map((h) => (
                    <option key={h.valor} value={h.valor}>
                      Hoy a las {h.etiqueta}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {avisoCampo('hora')}
          </section>

          <div>
            <button type="submit" disabled={cargando} className={`${botonPrimario} w-full`}>
              {cargando ? 'Agendando…' : 'Agendar urgencia'}
            </button>
            <p className="mt-4 text-center text-xs font-medium text-on-surface-variant">
              <ShieldAlert size={14} className="inline text-teal-600 dark:text-teal-400" /> Tu urgencia se registra para
              hoy y te atiende el primer odontólogo disponible al llegar.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}