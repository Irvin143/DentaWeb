import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Stethoscope,
  User,
} from 'lucide-react';
// TODO: ajusta la ruta a donde tengas tu api.js
import { serviciosApi } from '../../services/api.js';

// Adapta la respuesta del backend a lo que usa la vista.
// Si tus campos se llaman distinto, solo cambia esta función.
function normalizarServicio(s) {
  return {
    id: String(s.id_servicio ?? s.id),
    nombre: s.nombre,
    desc: s.descripcion ?? '',
    duracion: s.duracion_minutos ?? s.duracion ?? null,
    activo: s.activo ?? true,
  };
}

export default function AgendarCitaView({ onVolver }) {
  // Estado del formulario listo para conectarse a la API
  const [form, setForm] = useState({
    id_servicio: '',
    id_sede: '1',
    id_especialista: '1',
    fecha: '2024-10-30',
    hora: '10:30 AM',
    motivo: ''
  });

  const [cargando, setCargando] = useState(false);

  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    let cancelado = false;
    setCargandoServicios(true);
    setErrorServicios(false);

    serviciosApi
      .listar()
      .then((res) => {
        if (cancelado) return;
        // Acepta un arreglo directo o { data: [...] } / { servicios: [...] }
        const lista = Array.isArray(res) ? res : res?.data ?? res?.servicios ?? [];
        setServicios(lista.map(normalizarServicio).filter((s) => s.activo));
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar servicios:', err);
        setErrorServicios(true);
      })
      .finally(() => {
        if (!cancelado) setCargandoServicios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [intento]);

  // Días estáticos para el prototipo (Luego se pueden generar dinámicamente)
  const dias = [
    { fecha: '2024-10-28', diaSemana: 'Lun', diaNumero: '28' },
    { fecha: '2024-10-29', diaSemana: 'Mar', diaNumero: '29' },
    { fecha: '2024-10-30', diaSemana: 'Mié', diaNumero: '30' },
    { fecha: '2024-10-31', diaSemana: 'Jue', diaNumero: '31' },
    { fecha: '2024-11-01', diaSemana: 'Vie', diaNumero: '01' },
  ];

  const servicioActivo = servicios.find((s) => s.id === form.id_servicio);

  const horasManana = ['09:00 AM', '10:30 AM', '11:45 AM'];
  const horasTarde = ['03:30 PM', '04:30 PM', '05:15 PM'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    console.log("Datos listos para enviar a la BD:", form);
    // TODO: Conectar con api.js -> await citasApi.crear(form);
    setTimeout(() => {
      setCargando(false);
      alert("Cita agendada exitosamente (Simulación)");
      onVolver();
    }, 1000);
  };

  const botonHora = (hora) => (
    <button
      key={hora}
      type="button"
      onClick={() => setForm({ ...form, hora })}
      className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        form.hora === hora ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {form.hora === hora && <CheckCircle2 size={14} className="mr-1 inline" />}
      {hora}
    </button>
  );

  return (
    // w-full + min-h-full: ocupa todo el espacio disponible del contenedor padre
    <div className="min-h-full w-full bg-surface p-4 md:p-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-10 lg:py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between lg:shrink-0">
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
            <h1 className="text-2xl font-bold text-slate-800">Agendar Cita</h1>
            <p className="text-sm text-slate-500">¿Cuándo deseas tu próxima consulta?</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <CheckCircle2 size={14} /> Paso 1 de 3
        </span>
      </header>

      {/* En móvil: una columna. En lg+: dos columnas a todo el ancho */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-1"
      >
        {/* COLUMNA IZQUIERDA: sede, especialista, motivo */}
        <div className="flex flex-col gap-6 lg:col-span-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2 xl:col-span-4">
          {/* Servicio */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Stethoscope size={18} /> Servicio
              </h2>
              <span className="text-xs text-slate-400">Obligatorio</span>
            </div>
            {cargandoServicios && (
              <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Cargando servicios...
              </p>
            )}
            {errorServicios && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} /> No pudimos cargar los servicios
                </p>
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className="mt-1 cursor-pointer text-xs font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            )}
            {!cargandoServicios && !errorServicios && servicios.length === 0 && (
              <p className="py-2 text-sm text-slate-500">No hay servicios disponibles por ahora.</p>
            )}
            <div className="flex flex-col gap-2">
              {servicios.map((s) => {
                const Icono = Stethoscope;
                const activo = form.id_servicio === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setForm({ ...form, id_servicio: s.id })}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      activo ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        activo ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icono size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800">{s.nombre}</span>
                      <span className="block truncate text-xs text-slate-500">{s.desc}</span>
                    </span>
                    {s.duracion && (
                      <span className="shrink-0 text-xs font-medium text-slate-500">{s.duracion} min</span>
                    )}
                    {activo && <CheckCircle2 size={18} className="shrink-0 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sede de atención */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Building2 size={18} /> Sede de atención
              </h2>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">Tu sede habitual</span>
            </div>
            <div className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <div>
                <p className="font-bold text-slate-800">DentalWeb Miraflores Centro</p>
                <p className="text-xs text-slate-500">Gabinete 02 • Av. José Larco 743, Piso 4</p>
              </div>
              <ChevronDown size={20} className="text-slate-400" />
            </div>
          </section>

          {/* Especialista */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <User size={18} /> Especialista y Tratamiento
              </h2>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">Tu dentista asignada</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                {/* Simulación de foto de perfil */}
                <User size={30} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">Dra. Andrea Sámano <span className="text-xs font-normal text-slate-500">D.M.D.</span></p>
                <p className="text-sm text-slate-600">Ortodoncia y Ortopedia Maxilar</p>
                <p className="text-xs font-medium text-amber-500">★ 4.9 <span className="text-slate-500">(128 reseñas)</span></p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <p className="text-teal-700"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-teal-500"></span> Próxima disponibilidad: Hoy</p>
              <button type="button" className="cursor-pointer font-semibold text-teal-600 hover:text-teal-700">Cambiar especialista →</button>
            </div>
          </section>

          {/* Motivo */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <MapPin size={18} /> Motivo o molestia
              </h2>
              <span className="text-xs text-slate-400">Opcional</span>
            </div>
            <textarea
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              rows="4"
              placeholder="¿Tienes alguna molestia o motivo específico para tu consulta? (ej. ajuste de arco, molestia en molar)"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            ></textarea>

            <div className="mt-4 flex gap-3 rounded-xl bg-teal-50 p-4">
              <Bell className="shrink-0 text-teal-600" size={20} />
              <div>
                <p className="text-sm font-bold text-teal-800">RECORDATORIO AUTOMÁTICO</p>
                <p className="text-xs text-teal-700">Recibirás confirmación y aviso por WhatsApp y correo 24 horas antes.</p>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: fecha, horarios, confirmar */}
        <div className="flex flex-col gap-6 lg:col-span-7 lg:h-full lg:min-h-0 lg:overflow-y-auto xl:col-span-8">
          {/* Calendario (Fechas) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <CalendarIcon size={18} className="text-teal-600" /> Octubre - Noviembre 2024
            </h2>
            {/* Móvil: scroll horizontal. Escritorio: los 5 días se reparten todo el ancho */}
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
              {dias.map((dia) => (
                <button
                  key={dia.fecha}
                  type="button"
                  onClick={() => setForm({ ...form, fecha: dia.fecha })}
                  className={`flex min-w-[70px] cursor-pointer flex-col items-center justify-center rounded-2xl py-3 transition-colors lg:min-w-0 lg:py-5 ${
                    form.fecha === dia.fecha ? 'bg-teal-600 text-white shadow-md' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs lg:text-sm">{dia.diaSemana}</span>
                  <span className="text-xl font-bold lg:text-2xl">{dia.diaNumero}</span>
                  {form.fecha === dia.fecha && <span className="mt-1 h-1 w-1 rounded-full bg-white"></span>}
                </button>
              ))}
            </div>
          </section>

          {/* Horarios */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Clock size={18} className="text-teal-600" /> Horarios disponibles
              </h2>
              {servicioActivo?.duracion && (
                <span className="text-xs text-slate-500">Duración: {servicioActivo.duracion} min</span>
              )}
            </div>

            {/* Móvil: turnos apilados. Escritorio: mañana y tarde lado a lado */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Turno mañana</p>
                <div className="grid grid-cols-3 gap-3">
                  {horasManana.map(botonHora)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Turno tarde</p>
                <div className="grid grid-cols-3 gap-3">
                  {horasTarde.map(botonHora)}
                </div>
              </div>
            </div>
          </section>

          {/* Botón de envío */}
          <div className="text-center">
            <button
              type="submit"
              disabled={cargando || !form.id_servicio}
              className="w-full cursor-pointer rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {cargando ? 'Procesando...' : <><CalendarIcon size={18} className="mr-2 inline" /> Confirmar cita</>}
            </button>
            <p className="mt-4 text-xs font-medium text-slate-500">
              <CheckCircle2 size={14} className="inline text-teal-600" /> Cancelación o reprogramación gratuita hasta 4 horas antes
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}