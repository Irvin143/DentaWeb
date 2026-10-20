import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, Zap, BoxSelect, Link2Off, Droplets, Activity, Plus, Camera, Clock, PhoneCall, User } from 'lucide-react';

export default function UrgenciaView({ onVolver }) {
  const [form, setForm] = useState({
    motivo: 'bracket',
    sintomas: '',
    llegada: 'inmediato'
  });
  const [cargando, setCargando] = useState(false);

  const motivos = [
    { id: 'dolor', titulo: 'Dolor agudo o punzante', desc: 'Sensibilidad extrema', icono: Zap },
    { id: 'roto', titulo: 'Diente roto o fisurado', desc: 'Trauma o golpe', icono: BoxSelect },
    { id: 'bracket', titulo: 'Bracket despegado', desc: 'Arco pinchando', icono: Link2Off },
    { id: 'sangrado', titulo: 'Inflamación / Sangrado', desc: 'Encía hinchada', icono: Droplets },
    { id: 'corona', titulo: 'Pérdida de corona/calza', desc: 'Espacio expuesto', icono: Activity },
    { id: 'otro', titulo: 'Otro incidente', desc: 'Describir abajo', icono: Plus },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    console.log("Datos de urgencia listos para BD:", form);
    // TODO: Conectar con api.js
    setTimeout(() => {
      setCargando(false);
      alert("Alerta enviada. El especialista te espera.");
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
            <h1 className="text-2xl font-bold text-slate-800">Reportar Emergencia</h1>
            <p className="text-sm text-slate-500">Atención prioritaria y triaje clínico inmediato</p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 md:flex">
          * Protocolo de Urgencia
        </span>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Guía de seguridad vital */}
        <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <ShieldAlert className="shrink-0 text-red-500" size={24} />
          <div>
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
        <section>
          <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
            <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">1</span> Motivo principal de urgencia</span>
            <span className="text-xs font-normal text-slate-500">Obligatorio</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {motivos.map((m) => {
              const Icono = m.icono;
              const activo = form.motivo === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setForm({ ...form, motivo: m.id })}
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                    activo ? 'border-red-500 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Icono size={24} className={`mb-2 ${activo ? 'text-red-500' : 'text-slate-400'}`} />
                  <p className="text-sm font-bold text-slate-800">{m.titulo}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                  <div className={`absolute right-3 top-3 h-4 w-4 rounded-full border-2 ${activo ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                    {activo && <div className="m-[2px] h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Descripción y foto */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">2</span> Describe brevemente tus síntomas
          </h2>
          <textarea
            required
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
            rows="3"
            placeholder="¿Cuándo inició el dolor? ¿Aumenta con frío, calor o al masticar?..."
            value={form.sintomas}
            onChange={(e) => setForm({ ...form, sintomas: e.target.value })}
          ></textarea>
          <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal-300 bg-teal-50 py-3 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100">
            <Camera size={18} /> Subir foto de la molestia (Opcional)
          </button>
        </section>

        {/* Especialista en guardia */}
        <section>
          <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
            <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">3</span> Especialista en guardia hoy</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> En guardia</span>
          </h2>
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
               <User size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Dra. Andrea Sámano <span className="text-xs font-normal text-slate-500">D.M.D.</span></p>
              <p className="text-sm font-medium text-teal-600">Especialista en Turno de Urgencia</p>
              <p className="text-xs text-slate-500">Miraflores Centro • Gabinete 02</p>
            </div>
          </div>
        </section>

        {/* Llegada prioritaria */}
        <section>
          <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
            <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">4</span> Estimación de llegada</span>
          </h2>
          <div className="flex flex-col gap-3">
            <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${form.llegada === 'inmediato' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Zap size={20} className={form.llegada === 'inmediato' ? 'text-red-500' : 'text-slate-400'} />
                <div>
                  <p className="font-bold text-slate-800">En 30-45 min <span className="ml-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Inmediato</span></p>
                  <p className="text-xs text-slate-500">Ventana estimada: 11:15 AM - Prioritario</p>
                </div>
              </div>
              <input type="radio" name="llegada" value="inmediato" checked={form.llegada === 'inmediato'} onChange={(e) => setForm({ ...form, llegada: e.target.value })} className="h-4 w-4 accent-red-600" />
            </label>
            
            <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${form.llegada === '12:30' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Clock size={20} className={form.llegada === '12:30' ? 'text-red-500' : 'text-slate-400'} />
                <div>
                  <p className="font-bold text-slate-800">Hoy 12:30 PM</p>
                  <p className="text-xs text-slate-500">Gabinete de guardia reservado</p>
                </div>
              </div>
              <input type="radio" name="llegada" value="12:30" checked={form.llegada === '12:30'} onChange={(e) => setForm({ ...form, llegada: e.target.value })} className="h-4 w-4 accent-red-600" />
            </label>
          </div>
        </section>

        {/* Botón de envío */}
        <div className="mt-4">
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-red-700 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-800 hover:shadow-xl disabled:bg-slate-400"
          >
            {cargando ? 'Enviando alerta...' : <><PhoneCall size={18} className="mr-2 inline" /> Solicitar Atención Prioritaria</>}
          </button>
          <p className="mt-4 text-center text-xs font-medium text-slate-500">
            <ShieldAlert size={14} className="inline text-teal-600" /> Un asesor clínico y la doctora de guardia te contactarán de inmediato para coordinar el ingreso.
          </p>
        </div>
      </form>
    </div>
  );
}