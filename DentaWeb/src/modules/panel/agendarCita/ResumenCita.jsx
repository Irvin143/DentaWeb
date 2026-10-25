import React from 'react';
import {
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  ScanLine,
  Stethoscope,
  User,
} from 'lucide-react';
import { EnlaceMapa } from './SelectorSede.jsx';

// Una fila del resumen (icono, título, valor y, opcionalmente, "Editar")
function FilaResumen({ icono: Icono, titulo, valor, detalle, extra, onEditar }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          valor ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icono size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{titulo}</p>
        {valor ? (
          <>
            <p className="break-words text-sm font-bold text-slate-800">{valor}</p>
            {detalle && <p className="break-words text-xs text-slate-500">{detalle}</p>}
            {extra}
          </>
        ) : (
          <p className="text-sm text-slate-400">Pendiente</p>
        )}
      </div>
      {onEditar && valor && (
        <button
          type="button"
          onClick={onEditar}
          className="shrink-0 cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700"
        >
          Editar
        </button>
      )}
    </div>
  );
}

// Resumen que se va llenando con lo que elige el paciente.
// onEditarPaso(n): si se pasa, cada fila muestra "Editar" y regresa al paso n.
export default function ResumenCita({
  titulo = 'Resumen de tu cita',
  servicio,
  sede,
  fechaTexto,
  hora,
  motivo,
  odontologo,
  mostrarOdontologo = false,
  onEditarPaso,
}) {
  const IconoServicio = servicio?.categoria === 'estudio' ? ScanLine : Stethoscope;
  const editar = (paso) => (onEditarPaso ? () => onEditarPaso(paso) : undefined);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">{titulo}</h2>
      <div className="divide-y divide-slate-100">
        <FilaResumen
          icono={IconoServicio}
          titulo="Servicio"
          valor={servicio?.nombre}
          detalle={servicio?.duracion ? `${servicio.duracion} min` : undefined}
          onEditar={editar(1)}
        />
        <FilaResumen
          icono={Building2}
          titulo="Sede"
          valor={sede?.nombre}
          detalle={sede?.direccion}
          extra={sede ? <EnlaceMapa sede={sede} className="mt-1" /> : undefined}
          onEditar={editar(1)}
        />
        <FilaResumen icono={CalendarIcon} titulo="Fecha" valor={fechaTexto} onEditar={editar(2)} />
        <FilaResumen icono={Clock} titulo="Hora" valor={hora} onEditar={editar(2)} />
        {motivo?.trim() && (
          <FilaResumen icono={MapPin} titulo="Motivo" valor={motivo.trim()} onEditar={editar(2)} />
        )}
        {mostrarOdontologo && (
          <FilaResumen
            icono={User}
            titulo="Odontólogo"
            valor={odontologo?.nombre ?? 'Asignación automática'}
            detalle={
              odontologo ? undefined : 'Según la disponibilidad de la sede, fecha y hora elegidas'
            }
          />
        )}
      </div>
    </aside>
  );
}

// Pantalla final cuando la cita ya quedó agendada
export function CitaConfirmada({ resumen, odontologo, onVolver }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 lg:my-auto">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <CheckCircle2 size={36} />
      </span>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">¡Tu cita está agendada!</h1>
        <p className="mt-1 text-sm text-slate-500">
          Te enviaremos la confirmación por WhatsApp y correo.
        </p>
      </div>
      <div className="w-full">
        <ResumenCita
          titulo="Detalle de tu cita"
          {...resumen}
          odontologo={odontologo}
          mostrarOdontologo
        />
      </div>
      <button
        type="button"
        onClick={onVolver}
        className="w-full cursor-pointer rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl"
      >
        Volver al panel
      </button>
    </div>
  );
}