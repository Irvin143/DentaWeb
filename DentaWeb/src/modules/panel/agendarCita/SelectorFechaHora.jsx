import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Plus,
} from 'lucide-react';
import {
  CLASE_TARJETA,
  DIAS_A_CONSULTAR,
  MAX_MOTIVO,
  diaDesdeISO,
  etiquetaMeses,
  formatearFecha,
  formatearHora,
} from './utilidades.js';

// 'oct.' → 'oct'
const mesCorto = (date) => date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');

// diasData: { dias, cargando, error, reintentar } de useDiasDisponibles.
// Solo se ofrecen días con horarios libres; la tira se recorre con scroll o con las flechas.
function SeccionFecha({ fecha, diasData, onSeleccionar }) {
  const { dias: fechas, cargando, error, reintentar } = diasData;

  const franjaRef = useRef(null);
  const activoRef = useRef(null);

  // Si el día elegido quedó fuera del rango (por ejemplo, el próximo día disponible), se agrega
  // para que se vea seleccionado.
  const dias = useMemo(() => {
    const lista = fechas.map(diaDesdeISO);
    if (fecha && !fechas.includes(fecha)) lista.push(diaDesdeISO(fecha));
    return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [fechas, fecha]);

  // Al cambiar el día elegido, la tira se desplaza para que se vea
  useEffect(() => {
    activoRef.current?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [fecha]);

  const desplazar = (sentido) => {
    const franja = franjaRef.current;
    franja?.scrollBy({ left: sentido * franja.clientWidth * 0.8, behavior: 'smooth' });
  };

  const claseFlecha =
    'hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 sm:flex';

  return (
    <section className={CLASE_TARJETA}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <CalendarIcon size={18} className="text-teal-600" />{' '}
        {dias.length > 0 ? etiquetaMeses(dias) : 'Elige un día'}
      </h2>

      {cargando && (
        <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Buscando días disponibles...
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> No pudimos cargar los días disponibles
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

      {!cargando && !error && dias.length === 0 && (
        <p className="py-2 text-sm text-slate-500">
          Esta sede no tiene días con horarios libres en los próximos {DIAS_A_CONSULTAR} días. Intenta
          con otra sede.
        </p>
      )}

      {!cargando && !error && dias.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => desplazar(-1)}
            aria-label="Días anteriores"
            className={claseFlecha}
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={franjaRef}
            className="scrollbar-hide flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth py-1"
          >
            {dias.map((dia) => {
              const activo = fecha === dia.fecha;
              return (
                <button
                  key={dia.fecha}
                  ref={activo ? activoRef : null}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => onSeleccionar(dia.fecha)}
                  className={`flex w-14 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl py-2 transition-colors ${
                    activo
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] leading-tight">{dia.diaSemana}</span>
                  <span className="text-lg font-bold leading-tight">{dia.diaNumero}</span>
                  <span className="text-[10px] uppercase leading-tight opacity-70">
                    {mesCorto(dia.date)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => desplazar(1)}
            aria-label="Días siguientes"
            className={claseFlecha}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

// horariosData: { horas, proximoDia, cargando, error, reintentar } de useHorarios
function SeccionHorario({ fecha, hora, horariosData, onSeleccionar, onProximoDia }) {
  const { horas, proximoDia, cargando, error, reintentar } = horariosData;

  // Con una hora elegida se ocultan las demás; este estado vuelve a mostrarlas
  const [cambiando, setCambiando] = useState(false);
  const horaElegida = Boolean(hora) && !cambiando;

  const seleccionar = (h) => {
    onSeleccionar(h);
    setCambiando(false);
  };

  // 'HH:mm' se compara bien como texto
  const manana = horas.filter((h) => h < '12:00');
  const tarde = horas.filter((h) => h >= '12:00');

  const botonHora = (h) => (
    <button
      key={h}
      type="button"
      onClick={() => seleccionar(h)}
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
          <Clock size={18} className="text-teal-600" />{' '}
          {horaElegida && horas.length > 0 ? 'Horario seleccionado' : 'Horarios disponibles'}
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

      {/* Hora elegida: se quitan las demás y queda solo esta, con opción de cambiarla */}
      {fecha && !cargando && !error && horas.length > 0 && horaElegida && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-600 bg-teal-50 p-3">
          <span className="flex items-center gap-2 text-base font-bold text-teal-800">
            <CheckCircle2 size={20} className="text-teal-600" /> {formatearHora(hora)}
          </span>
          <button
            type="button"
            onClick={() => setCambiando(true)}
            className="shrink-0 cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Sin hora elegida (o al cambiarla): todos los horarios. Móvil: turnos apilados; escritorio: lado a lado */}
      {fecha && !cargando && !error && horas.length > 0 && !horaElegida && (
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
  diasData,
  horariosData,
  onFecha,
  onHora,
  onProximoDia,
  onMotivo,
}) {
  return (
    <>
      <SeccionFecha fecha={fecha} diasData={diasData} onSeleccionar={onFecha} />
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