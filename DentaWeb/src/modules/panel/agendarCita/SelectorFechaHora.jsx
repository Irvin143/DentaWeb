import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
} from 'lucide-react';
import {
  CLASE_TARJETA,
  DIAS_A_MOSTRAR,
  MAX_MOTIVO,
  diaDesdeISO,
  etiquetaMeses,
  formatearFecha,
  formatearHora,
  generarDias,
} from './utilidades.js';

function SeccionFecha({ fecha, onSeleccionar }) {
  const diasBase = useMemo(() => generarDias(DIAS_A_MOSTRAR), []);

  // Si el próximo día disponible queda fuera de la tira, se agrega al final
  const dias = useMemo(
    () =>
      !fecha || diasBase.some((d) => d.fecha === fecha)
        ? diasBase
        : [...diasBase, diaDesdeISO(fecha)],
    [diasBase, fecha]
  );

  return (
    <section className={CLASE_TARJETA}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <CalendarIcon size={18} className="text-teal-600" /> {etiquetaMeses(dias)}
      </h2>
      {/* Móvil: scroll horizontal. Escritorio: los días se reparten todo el ancho */}
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:overflow-visible lg:pb-0">
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

// horariosData: { horas, proximoDia, cargando, error, reintentar } de useHorarios
function SeccionHorario({ fecha, hora, horariosData, onSeleccionar, onProximoDia }) {
  const { horas, proximoDia, cargando, error, reintentar } = horariosData;

  // 'HH:mm' se compara bien como texto
  const manana = horas.filter((h) => h < '12:00');
  const tarde = horas.filter((h) => h >= '12:00');

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
      {formatearHora(h)}
    </button>
  );

  const turno = (titulo, lista) => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{titulo}</p>
      {lista.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">{lista.map(botonHora)}</div>
      ) : (
        <p className="text-sm text-slate-400">Sin horarios en este turno</p>
      )}
    </div>
  );

  return (
    <section className={CLASE_TARJETA}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Clock size={18} className="text-teal-600" /> Horarios disponibles
        </h2>
      </div>

      {!fecha && <p className="py-2 text-sm text-slate-500">Elige un día para ver los horarios.</p>}

      {fecha && cargando && (
        <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Buscando horarios...
        </p>
      )}

      {fecha && error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> No pudimos cargar los horarios
          </p>
          <button
            type="button"
            onClick={reintentar}
            className="mt-1 cursor-pointer text-xs font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Día sin espacios: se ofrece saltar al próximo día disponible */}
      {fecha && !cargando && !error && horas.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">No hay horarios disponibles este día.</p>
          {proximoDia ? (
            <button
              type="button"
              onClick={onProximoDia}
              className="mt-2 cursor-pointer font-semibold text-teal-600 hover:text-teal-700"
            >
              Ver próximo día disponible: {formatearFecha(proximoDia)} →
            </button>
          ) : (
            <p className="mt-1">
              Tampoco encontramos espacios en los próximos días en esta sede. Intenta con otra sede.
            </p>
          )}
        </div>
      )}

      {/* Móvil: turnos apilados. Escritorio: mañana y tarde lado a lado */}
      {fecha && !cargando && !error && horas.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {turno('Turno mañana', manana)}
          {turno('Turno tarde', tarde)}
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
  horariosData,
  onFecha,
  onHora,
  onProximoDia,
  onMotivo,
}) {
  return (
    <>
      <SeccionFecha fecha={fecha} onSeleccionar={onFecha} />
      <SeccionHorario
        fecha={fecha}
        hora={hora}
        horariosData={horariosData}
        onSeleccionar={onHora}
        onProximoDia={onProximoDia}
      />
      <SeccionMotivo
        valor={motivo}
        onChange={onMotivo}
        esEstudio={servicioActivo?.categoria === 'estudio'}
      />
    </>
  );
}