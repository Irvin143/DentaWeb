import { useEffect, useRef, useState } from 'react';
import { CalendarX, Loader2 } from 'lucide-react';
// TODO: ajusta la ruta al archivo donde tienes apiRequest y las demás APIs
import { citasApi } from '../../../services/api.js';
import { fechaLarga, hora } from './Utils.js';

/**
 * Props:
 *  - cita: { id, fecha: Date, motivo, doctor }
 *  - onCancelada(cita): se llama cuando el backend confirmó la cancelación
 *  - onCerrar(): el usuario decidió conservar la cita
 */
export default function CancelarCitaModal({ cita, onCancelada, onCerrar }) {
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');

  const botonConservar = useRef(null);
  const cerrar = useRef(onCerrar);
  const ocupado = useRef(cancelando);
  cerrar.current = onCerrar;
  ocupado.current = cancelando;

  // Se enfoca el botón seguro una sola vez, al abrir el modal.
  useEffect(() => {
    botonConservar.current?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !ocupado.current) cerrar.current();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  async function confirmar() {
    setCancelando(true);
    setError('');
    try {
      await citasApi.cancelar(cita.id);
      onCancelada(cita);
    } catch (e) {
      // El modal se queda abierto para que puedas reintentar.
      setError(e.message || 'No se pudo cancelar la cita.');
      setCancelando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !cancelando && onCerrar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar"
        aria-describedby="detalle-cancelar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-outline-variant bg-on-primary p-6"
      >
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-error">
          <CalendarX size={20} aria-hidden="true" />
        </span>
        <h2 id="titulo-cancelar" className="text-lg font-bold text-on-surface">
          ¿Cancelar esta cita?
        </h2>
        <p id="detalle-cancelar" className="mt-2 text-sm text-on-surface-variant">
          <strong className="font-semibold text-on-surface">{cita.motivo}</strong> con{' '}
          <strong className="font-semibold text-on-surface">{cita.doctor}</strong>, el{' '}
          <strong className="font-semibold text-on-surface">{fechaLarga(cita.fecha)}</strong> a las{' '}
          <strong className="font-semibold text-on-surface">{hora(cita.fecha)}</strong>. Si cambias de opinión,
          tendrás que agendar una nueva cita.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error-container px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={botonConservar}
            type="button"
            onClick={onCerrar}
            disabled={cancelando}
            className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-60"
          >
            Conservar cita
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={cancelando}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
          >
            {cancelando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {cancelando ? 'Cancelando…' : error ? 'Reintentar' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}