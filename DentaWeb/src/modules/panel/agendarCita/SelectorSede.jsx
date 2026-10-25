import React from 'react';
import { AlertCircle, Building2, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { CLASE_TARJETA, urlMapa } from './utilidades.js';

// Enlace "Ver en mapa": abre la dirección de la sede en Google Maps en otra pestaña
export function EnlaceMapa({ sede, className = '' }) {
  const url = urlMapa(sede);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver ${sede.nombre} en Google Maps`}
      className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 ${className}`}
    >
      <MapPin size={14} /> Ver en mapa
    </a>
  );
}

// sedesData: lo que devuelve useSedes() dentro de useAgendarCita
export default function SelectorSede({ sedesData, idServicio, idSede, onSeleccionar }) {
  const { sedes, cargando, error, reintentar } = sedesData;

  return (
    <section className={CLASE_TARJETA}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Building2 size={18} /> Sede de atención
        </h2>
        <span className="text-xs text-slate-400">Según el servicio</span>
      </div>

      {!idServicio && (
        <p className="py-2 text-sm text-slate-500">Elige un servicio para ver las sedes disponibles.</p>
      )}
      {cargando && (
        <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Buscando sedes...
        </p>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> No pudimos cargar las sedes
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
      {idServicio && !cargando && !error && sedes.length === 0 && (
        <p className="py-2 text-sm text-slate-500">Por ahora ninguna sede ofrece este servicio.</p>
      )}

      <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
        {sedes.map((sede) => {
          const activa = idSede === sede.id;
          return (
            // El enlace al mapa va fuera del botón de selección: un enlace dentro de un botón no es HTML válido
            <div
              key={sede.id}
              className={`flex items-center gap-2 rounded-xl border pr-3 transition-colors ${
                activa ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                aria-pressed={activa}
                onClick={() => onSeleccionar(sede.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">{sede.nombre}</span>
                  {sede.direccion && (
                    <span className="block truncate text-xs text-slate-500">{sede.direccion}</span>
                  )}
                </span>
                {activa && <CheckCircle2 size={18} className="shrink-0 text-teal-600" />}
              </button>
              <EnlaceMapa sede={sede} />
            </div>
          );
        })}
      </div>
    </section>
  );
}