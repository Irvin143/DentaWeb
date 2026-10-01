import React from 'react';
import { Search, Plus } from 'lucide-react';

export function LayoutCatalogo({
  titulo,
  badgeTitulo,
  subtitulo,
  textoBotonNuevo,
  onNuevoClick,
  placeholderBusqueda,
  filtrosExtra,
  textoResultados,
  estadisticas,
  children
}) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50/30 p-8">
      {/* Encabezado */}
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{titulo}</h1>
            {/* Burbuja verde */}
            {badgeTitulo && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {badgeTitulo}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{subtitulo}</p>
        </div>
        
        {/* Boton Agregar */}
        <button
          onClick={onNuevoClick}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700"
        >
          <Plus size={18} strokeWidth={2.5} />
          {textoBotonNuevo}
        </button>
      </header>

      {/* Buscador y Filtros*/}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={placeholderBusqueda || "Buscar..."}
            className="w-full rounded-xl bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        
        {/* Espacio para Filtros */}
        {filtrosExtra && (
          <div className="flex items-center gap-2">
            {filtrosExtra}
          </div>
        )}

        {/* Indicador de Activos */}
        {textoResultados && (
          <div className="flex items-center gap-2 border-l border-slate-100 pl-4 pr-2">
            <span className="flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <div className="h-2 w-2 rounded-full bg-teal-500"></div>
              {textoResultados}
            </span>
          </div>
        )}
      </div>

      {/* Contenido Dinamico */}
      <main className="flex flex-col gap-4">
        {children}
      </main>

      {/* Estadisticas */}
      <footer className="mt-2 grid grid-cols-3 gap-6">
        {estadisticas.map((stat, index) => (
          <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Icono de la estadistica */}
              {stat.icono && (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  {stat.icono}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h4 className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {stat.label}
                </h4>
                <p className="text-xl font-bold text-slate-800">{stat.valor}</p>
              </div>
            </div>
            
            {/* Burbuja estadistica */}
            {stat.badgeTexto && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                stat.badgeTipo === 'verde' ? 'border-teal-100 bg-teal-50 text-teal-700' :
                stat.badgeTipo === 'naranja' ? 'border-amber-100 bg-amber-50 text-amber-700' :
                'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                {stat.badgeTexto}
              </span>
            )}
          </div>
        ))}
      </footer>
    </div>
  );
}