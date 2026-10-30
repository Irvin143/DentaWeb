import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BoxSelect,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Link2Off,
  Loader2,
  MapPin,
  PhoneCall,
  Plus,
  ShieldAlert,
  User,
  Zap,
} from 'lucide-react';
// TODO: ajusta la ruta a donde tengas tu api.js
import { urgenciasApi } from '../../services/api.js';
// TODO: ajusta las rutas a donde tengas ToastContainer y useToasts
import { ToastContainer } from '../../components/Toast.jsx';
import { useToasts } from '../../hooks/useToasts.js';

const motivos = [
  { id: 'dolor', titulo: 'Dolor agudo o punzante', desc: 'Sensibilidad extrema', icono: Zap },
  { id: 'roto', titulo: 'Diente roto o fisurado', desc: 'Trauma o golpe', icono: BoxSelect },
  { id: 'bracket', titulo: 'Bracket despegado', desc: 'Arco pinchando', icono: Link2Off },
  { id: 'sangrado', titulo: 'Inflamación / Sangrado', desc: 'Encía hinchada', icono: Droplets },
  { id: 'corona', titulo: 'Pérdida de corona/calza', desc: 'Espacio expuesto', icono: Activity },
  { id: 'otro', titulo: 'Otro incidente', desc: 'Describir abajo', icono: Plus },
];

const MIN_SINTOMAS = 5;
const MAX_SINTOMAS = 1000;

/* ============================================================
   HELPERS
   ============================================================ */

const dosDigitos = (n) => String(n).padStart(2, '0');

// Date → '02:30 PM'
const hora12 = (fecha) => {
  const h = fecha.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dosDigitos(h12)}:${dosDigitos(fecha.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

// '14:30' → '02:30 PM'
const hhmmA12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return hora12(new Date(2000, 0, 1, h, m));
};

// Horas de llegada para "más tarde hoy": cada 30 minutos, desde dentro de 1 hora y sin pasar de hoy
function opcionesHoraLlegada(ahora, cantidad = 6) {
  const base = new Date(ahora.getTime() + 60 * 60000);
  base.setSeconds(0, 0);
  const resto = base.getMinutes() % 30;
  if (resto !== 0) base.setMinutes(base.getMinutes() + (30 - resto));

  const opciones = [];
  for (let i = 0; i < cantidad; i += 1) {
    const t = new Date(base.getTime() + i * 30 * 60000);
    if (t.getDate() !== ahora.getDate()) break; // no se pasa a mañana
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
  llegada: 'inmediato', // 'inmediato' | 'hora'
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
  const [resultado, setResultado] = useState(null); // respuesta del servidor cuando ya se envió
  const formularioRef = useRef(null);

  // Sedes que reciben urgencias
  const [sedes, setSedes] = useState([]);
  const [cargandoSedes, setCargandoSedes] = useState(true);
  const [errorSedes, setErrorSedes] = useState(false);
  const [intentoSedes, setIntentoSedes] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    let cancelado = false;
    setCargandoSedes(true);
    setErrorSedes(false);

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
        // Si solo hay una sede, queda seleccionada
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
  const sedeElegida = sedes.find((s) => s.id === form.sede);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

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

    setCargando(true);
    try {
      const urgencia = await urgenciasApi.crear({
        id_sede: Number(form.sede),
        motivo: form.motivo,
        sintomas: form.sintomas.trim(),
        hora_llegada: form.llegada === 'hora' ? form.hora : null,
      });
      setResultado(urgencia);
      toasts.exito(`Urgencia agendada: te esperamos hoy a las ${hhmmA12(urgencia.hora)}.`);
    } catch (err) {
      toasts.error(err.message || 'No pudimos enviar tu alerta. Intenta de nuevo o llama a la clínica.');
    } finally {
      setCargando(false);
    }
  };

  const claseTextarea = (campo) =>
    `w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none focus:ring-1 ${
      erroresCampos[campo]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-200 focus:border-red-400 focus:ring-red-400'
    }`;

  const avisoCampo = (campo) =>
    erroresCampos[campo] && <p className="mt-2 text-xs text-red-600">{erroresCampos[campo]}</p>;

  /* ------------------------------------------------------------
     ALERTA ENVIADA
     ------------------------------------------------------------ */
  if (resultado) {
    const sede = resultado.sede;
    const mapa = urlMapa(sede?.direccion);
    return (
      <div className="min-h-full w-full bg-surface p-4 md:p-8 lg:px-10 lg:py-8">
        <ToastContainer toasts={toasts.toasts} onCerrar={toasts.cerrar} />
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CheckCircle2 size={36} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">Tu cita de urgencia está confirmada</h1>
            <p className="mt-1 text-sm text-slate-500">
              Te esperamos hoy a las {hhmmA12(resultado.hora)}. También te enviamos los datos por correo.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-5">
            <div className="divide-y divide-slate-100">
              <div className="flex items-start gap-3 pb-3">
                <Building2 size={18} className="mt-0.5 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sede</p>
                  <p className="break-words text-sm font-bold text-slate-800">{sede?.nombre}</p>
                  {sede?.direccion && (
                    <p className="break-words text-xs text-slate-500">{sede.direccion}</p>
                  )}
                  {mapa && (
                    <a
                      href={mapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      <MapPin size={14} /> Ver en mapa
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hora</p>
                  <p className="text-sm font-bold text-slate-800">Hoy a las {hhmmA12(resultado.hora)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3">
                <User size={18} className="mt-0.5 shrink-0 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Odontólogo</p>
                  <p className="break-words text-sm font-bold text-slate-800">
                    {resultado.odontologo?.nombre ?? 'Asignación automática'}
                  </p>
                  {resultado.odontologo?.cedula && (
                    <p className="text-xs text-slate-500">
                      Cédula profesional: {resultado.odontologo.cedula}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">
            Si tu situación empeora o tienes dificultad para respirar, acude a urgencias hospitalarias.
          </p>

          <button
            type="button"
            onClick={onVolver}
            className="w-full cursor-pointer rounded-xl bg-red-700 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-800 hover:shadow-xl"
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------
     FORMULARIO
     ------------------------------------------------------------ */
  return (
    // w-full + min-h-full: ocupa todo el espacio disponible del contenedor padre
    <div className="min-h-full w-full bg-surface p-4 md:p-8 lg:px-10 lg:py-8">
      <ToastContainer toasts={toasts.toasts} onCerrar={toasts.cerrar} />
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver al panel"
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reportar Emergencia</h1>
            <p className="text-sm text-slate-500">Atención prioritaria y triaje clínico inmediato</p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 md:flex">
          * Protocolo de Urgencia
        </span>
      </header>

      {/* En móvil: una columna. En lg+: dos columnas a todo el ancho */}
      <form
        ref={formularioRef}
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
      >
        {/* COLUMNA IZQUIERDA: guía, pasos 1 y 2 (qué te pasa) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Guía de seguridad vital */}
          <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <ShieldAlert className="shrink-0 text-red-500" size={24} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-red-800">Guía de Seguridad Vital</h3>
                <span className="rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700">Hoy Activo</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                Si presentas traumatismo craneofacial severo o dificultad respiratoria, acude a urgencias hospitalarias. Para dolor agudo, hemorragias locales y fracturas dentales, nuestro equipo de guardia está listo.
              </p>
            </div>
          </div>

          {/* Motivo Principal */}
          <section data-campo="motivo">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">1</span> Motivo principal de urgencia</span>
              <span className="text-xs font-normal text-slate-500">Obligatorio</span>
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
                    className={`relative cursor-pointer rounded-xl border p-4 text-left transition-all ${
                      activo ? 'border-red-500 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Icono size={24} className={`mb-2 ${activo ? 'text-red-500' : 'text-slate-400'}`} />
                    <p className="text-sm font-bold text-slate-800">{m.titulo}</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                    <div className={`absolute right-3 top-3 h-4 w-4 rounded-full border-2 ${activo ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                      {activo && <div className="m-[2px] h-2 w-2 rounded-full bg-white"></div>}
                    </div>
                  </button>
                );
              })}
            </div>
            {avisoCampo('motivo')}
          </section>

          {/* Descripción y foto */}
          <section data-campo="sintomas">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">2</span> Describe brevemente tus síntomas
            </h2>
            <textarea
              className={claseTextarea('sintomas')}
              rows="4"
              maxLength={MAX_SINTOMAS}
              placeholder="¿Cuándo inició el dolor? ¿Aumenta con frío, calor o al masticar?..."
              value={form.sintomas}
              onChange={(e) => cambiar('sintomas', e.target.value)}
            ></textarea>
            {avisoCampo('sintomas')}
            {/* La foto necesita un servicio donde guardar archivos; por ahora está deshabilitada */}
            <button
              type="button"
              disabled
              className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold text-slate-400"
            >
              <Camera size={18} /> Subir foto de la molestia (próximamente)
            </button>
          </section>
        </div>

        {/* COLUMNA DERECHA: pasos 3 y 4 (dónde y cuándo) + enviar */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Sede */}
          <section data-campo="sede">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">3</span> ¿A qué sede acudirás?</span>
              <span className="text-xs font-normal text-slate-500">Obligatorio</span>
            </h2>

            {cargandoSedes && (
              <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Buscando sedes...
              </p>
            )}
            {errorSedes && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} /> No pudimos cargar las sedes
                </p>
                <button
                  type="button"
                  onClick={() => setIntentoSedes((n) => n + 1)}
                  className="mt-1 cursor-pointer text-xs font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            )}
            {!cargandoSedes && !errorSedes && sedes.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
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
                    className={`flex items-center gap-2 rounded-xl border pr-3 transition-colors ${
                      activa ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => cambiar('sede', sede.id)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left"
                    >
                      <Building2 size={20} className={`shrink-0 ${activa ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-800">{sede.nombre}</span>
                        {sede.direccion && (
                          <span className="block truncate text-xs text-slate-500">{sede.direccion}</span>
                        )}
                      </span>
                      {activa && <CheckCircle2 size={18} className="shrink-0 text-red-500" />}
                    </button>
                    {mapa && (
                      <a
                        href={mapa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver ${sede.nombre} en Google Maps`}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
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

          {/* Llegada prioritaria */}
          <section data-campo="hora">
            <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">4</span> Estimación de llegada</span>
            </h2>
            <div className="flex flex-col gap-3">
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${form.llegada === 'inmediato' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <Zap size={20} className={form.llegada === 'inmediato' ? 'text-red-500' : 'text-slate-400'} />
                  <div>
                    <p className="font-bold text-slate-800">En 30-45 min <span className="ml-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Inmediato</span></p>
                    <p className="text-xs text-slate-500">Primer espacio disponible desde las {hora12(new Date(ahora.getTime() + 30 * 60000))}</p>
                  </div>
                </div>
                <input type="radio" name="llegada" value="inmediato" checked={form.llegada === 'inmediato'} onChange={() => cambiar('llegada', 'inmediato')} className="h-4 w-4 accent-red-600" />
              </label>

              <label className={`flex items-center justify-between rounded-xl border p-4 ${horasLlegada.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${form.llegada === 'hora' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <Clock size={20} className={form.llegada === 'hora' ? 'text-red-500' : 'text-slate-400'} />
                  <div>
                    <p className="font-bold text-slate-800">Llegaré más tarde hoy</p>
                    <p className="text-xs text-slate-500">
                      {horasLlegada.length === 0
                        ? 'Ya no hay horarios disponibles para hoy'
                        : 'Se te asigna el primer espacio desde esa hora'}
                    </p>
                  </div>
                </div>
                <input type="radio" name="llegada" value="hora" checked={form.llegada === 'hora'} disabled={horasLlegada.length === 0} onChange={() => cambiar('llegada', 'hora')} className="h-4 w-4 accent-red-600" />
              </label>

              {form.llegada === 'hora' && horasLlegada.length > 0 && (
                <select
                  value={form.hora}
                  onChange={(e) => cambiar('hora', e.target.value)}
                  aria-label="Hora de llegada"
                  className={`w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-1 ${
                    erroresCampos.hora
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-red-400 focus:ring-red-400'
                  }`}
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

          {/* Botón de envío */}
          <div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full cursor-pointer rounded-xl bg-red-700 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-800 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {cargando ? 'Enviando alerta...' : <><PhoneCall size={18} className="mr-2 inline" /> Solicitar Atención Prioritaria</>}
            </button>
            <p className="mt-4 text-center text-xs font-medium text-slate-500">
              <ShieldAlert size={14} className="inline text-teal-600" /> Tu urgencia se agenda en el primer espacio disponible de hoy con un odontólogo de la sede.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}