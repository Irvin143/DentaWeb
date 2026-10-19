import React, { useState } from 'react';
import { ArrowLeft, Building2, Calendar as CalendarIcon, CheckCircle2, ChevronDown, MapPin, User, Bell } from 'lucide-react';

export default function AgendarCitaView({ onVolver }) {
  // Estado del formulario listo para conectarse a la API
  const [form, setForm] = useState({
    id_sede: '1',
    id_especialista: '1',
    fecha: '2024-10-30',
    hora: '10:30',
    motivo: ''
  });

  const [cargando, setCargando] = useState(false);

  // Días estáticos para el prototipo (Luego se pueden generar dinámicamente)
  const dias = [
    { fecha: '2024-10-28', diaSemana: 'Lun', diaNumero: '28' },
    { fecha: '2024-10-29', diaSemana: 'Mar', diaNumero: '29' },
    { fecha: '2024-10-30', diaSemana: 'Mié', diaNumero: '30' },
    { fecha: '2024-10-31', diaSemana: 'Jue', diaNumero: '31' },
    { fecha: '2024-11-01', diaSemana: 'Vie', diaNumero: '01' },
  ];

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

  return (
    <div className="mx-auto max-w-3xl bg-surface p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onVolver} className="rounded-full p-2 transition-colors hover:bg-slate-100">
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500 overflow-hidden">
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
            <button type="button" className="font-semibold text-teal-600 hover:text-teal-700">Cambiar especialista →</button>
          </div>
        </section>

        {/* Calendario (Fechas) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <CalendarIcon size={18} className="text-teal-600" /> Octubre - Noviembre 2024
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dias.map((dia) => (
              <button
                key={dia.fecha}
                type="button"
                onClick={() => setForm({ ...form, fecha: dia.fecha })}
                className={`flex min-w-[70px] flex-col items-center justify-center rounded-2xl py-3 transition-colors ${
                  form.fecha === dia.fecha ? 'bg-teal-600 text-white shadow-md' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs">{dia.diaSemana}</span>
                <span className="text-xl font-bold">{dia.diaNumero}</span>
                {form.fecha === dia.fecha && <span className="mt-1 h-1 w-1 rounded-full bg-white"></span>}
              </button>
            ))}
          </div>
        </section>

        {/* Horarios */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Clock size={18} className="text-teal-600" /> Horarios disponibles
            </h2>
            <span className="text-xs text-slate-500">Duración: 45 min</span>
          </div>

          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Turno mañana</p>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {horasManana.map((hora) => (
              <button
                key={hora}
                type="button"
                onClick={() => setForm({ ...form, hora: hora })}
                className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                  form.hora === hora ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {form.hora === hora && <CheckCircle2 size={14} className="mr-1 inline" />}
                {hora}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Turno tarde</p>
          <div className="grid grid-cols-3 gap-3">
            {horasTarde.map((hora) => (
              <button
                key={hora}
                type="button"
                onClick={() => setForm({ ...form, hora: hora })}
                className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                  form.hora === hora ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {form.hora === hora && <CheckCircle2 size={14} className="mr-1 inline" />}
                {hora}
              </button>
            ))}
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            rows="3"
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

        {/* Botón de envío */}
        <div className="mt-2 text-center">
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:bg-slate-400"
          >
            {cargando ? 'Procesando...' : <><CalendarIcon size={18} className="mr-2 inline" /> Confirmar cita</>}
          </button>
          <p className="mt-4 text-xs font-medium text-slate-500">
            <CheckCircle2 size={14} className="inline text-teal-600" /> Cancelación o reprogramación gratuita hasta 4 horas antes
          </p>
        </div>
      </form>
    </div>
  );
}