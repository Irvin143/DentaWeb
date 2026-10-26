import React, { useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react';
import { useAgendarCita } from './agendarCita/useAgendarCita.js';
import SelectorServicio from './agendarCita/SelectorServicio.jsx';
import SelectorSede from './agendarCita/SelectorSede.jsx';
import SelectorFechaHora from './agendarCita/SelectorFechaHora.jsx';
import ResumenCita, { CitaConfirmada } from './agendarCita/ResumenCita.jsx';
import { CLASE_TARJETA, PASOS, SUBTITULOS, TOTAL_PASOS } from './agendarCita/utilidades.js';

/* ============================================================
   PIEZAS PEQUEÑAS DE ESTA VISTA
   ============================================================ */

// Indicador de progreso de los pasos
function Progreso({ paso }) {
  return (
    <ol className="mb-6 flex items-center gap-2 lg:shrink-0" aria-label="Progreso de la cita">
      {PASOS.map(({ n, etiqueta }, i) => {
        const hecho = n < paso;
        const actual = n === paso;
        const claseTexto = actual
          ? 'text-slate-800'
          : hecho
            ? 'hidden text-slate-500 sm:inline'
            : 'hidden text-slate-400 sm:inline';
        return (
          <React.Fragment key={n}>
            <li className="flex items-center gap-2" aria-current={actual ? 'step' : undefined}>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  hecho || actual ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {hecho ? <CheckCircle2 size={14} /> : n}
              </span>
              <span className={`text-sm font-semibold ${claseTexto}`}>{etiqueta}</span>
            </li>
            {i < PASOS.length - 1 && (
              <span className={`h-px flex-1 ${hecho ? 'bg-teal-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

// Paso 3: odontólogo asignado y avisos antes de confirmar
// odontologo: { nombre } cuando el backend ya lo asignó; null mientras es automático
function PasoConfirmar({ odontologo }) {
  return (
    <>
      <section className={CLASE_TARJETA}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <User size={18} /> Tu odontólogo
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
            <User size={30} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800">{odontologo?.nombre ?? 'Asignación automática'}</p>
            <p className="text-sm text-slate-600">
              {odontologo
                ? 'Atenderá tu cita en la sede, fecha y hora elegidas.'
                : 'Te asignaremos al odontólogo disponible en la sede, fecha y hora que elegiste. Verás su nombre al confirmar.'}
            </p>
          </div>
        </div>
      </section>

      <section className={CLASE_TARJETA}>
        <div className="flex gap-3 rounded-xl bg-teal-50 p-4">
          <Bell className="shrink-0 text-teal-600" size={20} />
          <div>
            <p className="text-sm font-bold text-teal-800">RECORDATORIO AUTOMÁTICO</p>
            <p className="text-xs text-teal-700">
              Recibirás confirmación y aviso por WhatsApp y correo 24 horas antes.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500">
          <CheckCircle2 size={14} className="inline text-teal-600" /> Cancelación o reprogramación gratuita hasta 4 horas antes
        </p>
      </section>
    </>
  );
}

// Botones "Atrás", "Continuar" y, en el último paso, "Confirmar cita"
function NavegacionPasos({
  paso,
  puedeContinuar,
  puedeConfirmar,
  cargando,
  onAtras,
  onContinuar,
  onConfirmar,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {paso > 1 ? (
        <button
          type="button"
          onClick={onAtras}
          disabled={cargando}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowLeft size={16} /> Atrás
        </button>
      ) : (
        <span />
      )}

      {paso < TOTAL_PASOS ? (
        <button
          key="continuar"
          type="button"
          onClick={onContinuar}
          disabled={!puedeContinuar}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none sm:min-w-48"
        >
          Continuar <ArrowRight size={16} />
        </button>
      ) : (
        // type="button" + key propia: si fuera submit, el mismo clic que pasa del paso 2 al 3
        // convertiría el botón en submit y enviaría el formulario sin que el paciente confirme.
        <button
          key="confirmar"
          type="button"
          onClick={onConfirmar}
          disabled={cargando || !puedeConfirmar}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none sm:min-w-56"
        >
          {cargando ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <CalendarIcon size={18} /> Confirmar cita
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   VISTA PRINCIPAL
   La lógica vive en agendarCita/useAgendarCita.js
   ============================================================ */

export default function AgendarCitaView({ onVolver }) {
  const cita = useAgendarCita();
  const { paso, confirmada, form } = cita;

  const raizRef = useRef(null);
  const columnaRef = useRef(null);
  const primerRender = useRef(true);

  // Al cambiar de paso (o confirmar) regresa al inicio del contenido
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    columnaRef.current?.scrollTo?.({ top: 0 });
    raizRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [paso, confirmada]);

  /* ---------- Cita confirmada ---------- */
  if (confirmada) {
    return (
      <div
        ref={raizRef}
        className="min-h-full w-full bg-surface p-4 md:p-8 lg:flex lg:h-full lg:flex-col lg:overflow-y-auto lg:px-10 lg:py-8"
      >
        <CitaConfirmada
          resumen={cita.resumen}
          odontologo={cita.odontologoAsignado}
          onVolver={onVolver}
        />
      </div>
    );
  }

  /* ---------- Flujo por pasos ---------- */
  return (
    // w-full + min-h-full: ocupa todo el espacio disponible del contenedor padre
    <div
      ref={raizRef}
      className="min-h-full w-full bg-surface p-4 md:p-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-10 lg:py-8"
    >
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
            <p className="text-sm text-slate-500">{SUBTITULOS[paso]}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <CheckCircle2 size={14} /> Paso {paso} de {TOTAL_PASOS}
        </span>
      </header>

      <Progreso paso={paso} />

      {/* En móvil: una columna. En lg+: contenido del paso a la izquierda y resumen a la derecha */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-1"
      >
        {/* COLUMNA IZQUIERDA: contenido del paso */}
        <div
          ref={columnaRef}
          className="flex flex-col gap-6 lg:col-span-7 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2 xl:col-span-8"
        >
          {paso === 1 && (
            <>
              <SelectorServicio
                catalogo={cita.catalogo}
                servicioActivo={cita.servicioActivo}
                idServicio={form.id_servicio}
                onSeleccionar={cita.seleccionarServicio}
              />
              <SelectorSede
                sedesData={cita.sedesData}
                idServicio={form.id_servicio}
                idSede={form.id_sede}
                onSeleccionar={cita.seleccionarSede}
              />
            </>
          )}

          {paso === 2 && (
            <SelectorFechaHora
              fecha={form.fecha}
              hora={form.hora}
              motivo={form.motivo}
              servicioActivo={cita.servicioActivo}
              horariosData={cita.horariosData}
              onProximoDia={cita.irAProximoDia}
              onFecha={cita.seleccionarFecha}
              onHora={cita.seleccionarHora}
              onMotivo={cita.cambiarMotivo}
            />
          )}

          {paso === 3 && <PasoConfirmar odontologo={cita.odontologoAsignado} />}

          {cita.errorEnvio && (
            <div
              className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {cita.errorEnvio}
            </div>
          )}

          <NavegacionPasos
            paso={paso}
            puedeContinuar={cita.puedeContinuar}
            puedeConfirmar={cita.puedeConfirmar}
            cargando={cita.cargando}
            onAtras={cita.volverPaso}
            onContinuar={cita.continuar}
            onConfirmar={cita.confirmar}
          />
        </div>

        {/* COLUMNA DERECHA: resumen que se va llenando.
            En móvil solo se ve en el último paso (arriba del contenido). */}
        <div
          className={
            paso === TOTAL_PASOS
              ? 'order-first lg:order-none lg:col-span-5 lg:h-full lg:min-h-0 lg:overflow-y-auto xl:col-span-4'
              : 'hidden lg:col-span-5 lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto xl:col-span-4'
          }
        >
          <ResumenCita
            {...cita.resumen}
            onEditarPaso={paso === TOTAL_PASOS ? cita.irAPaso : undefined}
          />
        </div>
      </form>
    </div>
  );
}