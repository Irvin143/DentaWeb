import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { BadgeEstado } from '../../utils/estadoCita.jsx';

const LOCALE = 'es-MX';

const etiquetaClase = 'text-xs font-semibold uppercase tracking-wide text-on-surface-variant';

const horaCorta = (valor) => String(valor ?? '').slice(0, 5);

const capitalizar = (texto) => {
  const t = String(texto ?? '').trim();
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase(LOCALE) + t.slice(1);
};

const parseYmd = (ymd) => {
  const [y, m, d] = String(ymd ?? '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const fechaLarga = (ymd) => {
  const date = parseYmd(ymd);
  if (!date) return '';
  return capitalizar(
    date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
};

const nombreCompleto = (persona, respaldo) =>
  [persona?.nombre, persona?.ape_pat, persona?.ape_mat].filter(Boolean).join(' ').trim() || respaldo;

const textoOpcional = (valor) => {
  const t = String(valor ?? '').trim();
  return t || null;
};

const esUrgencia = (cita) => /urgenc/i.test(String(cita?.tipo ?? ''));

function Campo({ etiqueta, children }) {
  if (!children) return null;
  return (
    <div>
      <p className={etiquetaClase}>{etiqueta}</p>
      <p className="mt-1 text-sm wrap-break-word text-on-surface">{children}</p>
    </div>
  );
}

export default function ModalDetalleCita({ cita, onCerrar }) {
  const cerrarRef = useRef(onCerrar);
  const botonCerrar = useRef(null);
  cerrarRef.current = onCerrar;

  useEffect(() => {
    botonCerrar.current?.focus();
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPresionar = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrarRef.current();
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  const urgencia = esUrgencia(cita);
  const horario = [horaCorta(cita.hora), horaCorta(cita.hora_fin)].filter(Boolean).join(' – ');
  const fecha = fechaLarga(cita.fecha);
  const servicio = textoOpcional(cita.servicio);
  const tipo = textoOpcional(cita.tipo);
  const observaciones = textoOpcional(cita.observaciones);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-cita"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-on-primary p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={etiquetaClase}>Paciente</p>
            <h2
              id="titulo-detalle-cita"
              className="mt-1 text-xl font-bold wrap-break-word text-on-surface"
            >
              {nombreCompleto(cita.paciente, 'Paciente')}
            </h2>
          </div>
          <button
            ref={botonCerrar}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {urgencia ? (
          <p className="mb-4 inline-block rounded-full bg-error-container px-2.5 py-1 text-xs font-medium text-error">
            Urgencia
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {cita.estado ? <BadgeEstado estado={cita.estado} /> : null}
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Horario">
            {[horario, fecha].filter(Boolean).join(' · ') || null}
          </Campo>
          <Campo etiqueta="Odontólogo">{nombreCompleto(cita.odontologo, 'Odontólogo')}</Campo>
          <Campo etiqueta="Clínica">{textoOpcional(cita.clinica?.nombre) || 'Clínica'}</Campo>
          <Campo etiqueta="Servicio">{servicio}</Campo>
          <Campo etiqueta="Tipo">{tipo}</Campo>
          {observaciones ? (
            <div className="sm:col-span-2">
              <p className={etiquetaClase}>Observaciones</p>
              <p className="mt-1 text-sm wrap-break-word text-on-surface">{observaciones}</p>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="cursor-pointer rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
