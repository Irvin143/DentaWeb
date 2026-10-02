import React from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ESTILOS = {
  exito: {
    caja: 'border-teal-200 bg-white',
    icono: 'text-teal-600',
    barra: 'bg-teal-500',
    Icono: CheckCircle2,
  },
  error: {
    caja: 'border-red-200 bg-white',
    icono: 'text-red-600',
    barra: 'bg-red-500',
    Icono: XCircle,
  },
};

// Tarjetas arriba a la derecha. Cada toast: { id, tipo: 'exito' | 'error', mensaje, visible }
// "visible" controla la animación: false = fuera de pantalla, true = en pantalla.
export function ToastContainer({ toasts = [], onCerrar }) {
  return (
    <div
      className="pointer-events-none fixed right-4 z-[100] flex flex-col gap-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      aria-live="polite"
    >
      {toasts.map(({ id, tipo, mensaje, visible }) => {
        const { caja, icono, barra, Icono } = ESTILOS[tipo] ?? ESTILOS.exito;
        return (
          <div
            key={id}
            role={tipo === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto relative flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border p-3 pl-4 shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none ${caja} ${
              visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${barra}`} aria-hidden="true" />
            <Icono size={20} className={`mt-0.5 shrink-0 ${icono}`} aria-hidden="true" />
            <p className="m-0 flex-1 text-sm font-medium text-slate-700">{mensaje}</p>
            <button
              type="button"
              onClick={() => onCerrar?.(id)}
              aria-label="Cerrar notificación"
              className="shrink-0 cursor-pointer rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}