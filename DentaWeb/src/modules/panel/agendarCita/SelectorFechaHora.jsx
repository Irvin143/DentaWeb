import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, Plus } from 'lucide-react';
import {
  CLASE_TARJETA,
  DIAS_A_MOSTRAR,
  HORAS_MANANA,
  HORAS_TARDE,
  MAX_MOTIVO,
  etiquetaMeses,
  generarDias,
} from './utilidades.js';

function SeccionFecha({ fecha, onSeleccionar }) {
  const dias = useMemo(() => generarDias(DIAS_A_MOSTRAR), []);

  return (
    <section className={CLASE_TARJETA}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <CalendarIcon size={18} className="text-teal-600" /> {etiquetaMeses(dias)}
      </h2>
      {/* Móvil: scroll horizontal. Escritorio: los días se reparten todo el ancho */}
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {dias.map((dia) => {
          const activo = fecha === dia.fecha;
          return (
            <button
              key={dia.fecha}
              type="button"
              onClick={() => onSeleccionar(dia.fecha)}
              className={`flex min-w-[70px] cursor-pointer flex-col items-center justify-center rounded-2xl py-3 transition-colors lg:min-w-0 lg:py-5 ${
                activo
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs lg:text-sm">{dia.diaSemana}</span>
              <span className="text-xl font-bold lg:text-2xl">{dia.diaNumero}</span>
              {activo && <span className="mt-1 h-1 w-1 rounded-full bg-white"></span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SeccionHorario({ fecha, hora, duracion, onSeleccionar }) {
  const botonHora = (h) => (
    <button
      key={h}
      type="button"
      onClick={() => onSeleccionar(h)}
      className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        hora === h ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {hora === h && <CheckCircle2 size={14} className="mr-1 inline" />}
      {h}
    </button>
  );

  return (
    <section className={CLASE_TARJETA}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Clock size={18} className="text-teal-600" /> Horarios disponibles
        </h2>
        {duracion && <span className="text-xs text-slate-500">Duración: {duracion} min</span>}
      </div>

      {!fecha ? (
        <p className="py-2 text-sm text-slate-500">Elige un día para ver los horarios.</p>
      ) : (
        /* Móvil: turnos apilados. Escritorio: mañana y tarde lado a lado */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Turno mañana</p>
            <div className="grid grid-cols-3 gap-3">{HORAS_MANANA.map(botonHora)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Turno tarde</p>
            <div className="grid grid-cols-3 gap-3">{HORAS_TARDE.map(botonHora)}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// Motivo opcional: el cuadro solo se despliega si el paciente lo pide
function SeccionMotivo({ valor, onChange, esEstudio }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <section className={CLASE_TARJETA}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <MapPin size={18} /> Motivo o molestia
        </h2>
        <span className="text-xs text-slate-400">Opcional</span>
      </div>

      {mostrar || valor ? (
        <textarea
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          rows="4"
          maxLength={MAX_MOTIVO}
          placeholder={
            esEstudio
              ? '¿Tienes alguna indicación u orden médica que debamos saber?'
              : '¿Tienes alguna molestia o motivo específico para tu consulta? (ej. ajuste de arco, molestia en molar)'
          }
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        ></textarea>
      ) : (
        <button
          type="button"
          onClick={() => setMostrar(true)}
          className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          <Plus size={16} /> Agregar motivo o molestia
        </button>
      )}
    </section>
  );
}

// Paso 2: cuándo, y un motivo opcional
export default function SelectorFechaHora({
  fecha,
  hora,
  motivo,
  servicioActivo,
  onFecha,
  onHora,
  onMotivo,
}) {
  return (
    <>
      <SeccionFecha fecha={fecha} onSeleccionar={onFecha} />
      <SeccionHorario
        fecha={fecha}
        hora={hora}
        duracion={servicioActivo?.duracion}
        onSeleccionar={onHora}
      />
      <SeccionMotivo
        valor={motivo}
        onChange={onMotivo}
        esEstudio={servicioActivo?.categoria === 'estudio'}
      />
    </>
  );
}