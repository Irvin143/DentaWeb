import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ScanLine, Search, Stethoscope } from 'lucide-react';
import { CLASE_TARJETA, FILTROS_CATEGORIA } from './utilidades.js';

// Tarjeta de un servicio (se usa en la lista y en el resumen plegado)
function TarjetaServicio({ servicio, activo, onClick, accion }) {
  const Icono = servicio.categoria === 'estudio' ? ScanLine : Stethoscope;
  const Contenedor = onClick ? 'button' : 'div';

  return (
    <Contenedor
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': activo } : {})}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${activo ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          activo ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icono size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-800">{servicio.nombre}</span>
        {servicio.desc && (
          <span className="block truncate text-xs text-slate-500">{servicio.desc}</span>
        )}
      </span>
      {servicio.duracion && (
        <span className="shrink-0 text-xs font-medium text-slate-500">{servicio.duracion} min</span>
      )}
      {accion ?? (activo && <CheckCircle2 size={18} className="shrink-0 text-teal-600" />)}
    </Contenedor>
  );
}

// catalogo: lo que devuelve useServicios() dentro de useAgendarCita
export default function SelectorServicio({ catalogo, servicioActivo, idServicio, onSeleccionar }) {
  const {
    servicios,
    cargando,
    error,
    reintentar,
    filtroCategoria,
    setFiltroCategoria,
    busqueda,
    setBusqueda,
    conteos,
    serviciosFiltrados,
    mostrarFiltros,
    mostrarBuscador,
  } = catalogo;

  // Con un servicio elegido la lista se pliega; este estado la vuelve a abrir
  const [cambiando, setCambiando] = useState(false);
  const listaAbierta = !servicioActivo || cambiando;

  const seleccionar = (id) => {
    onSeleccionar(id);
    setCambiando(false);
  };

  return (
    <section className={CLASE_TARJETA}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Stethoscope size={18} /> Servicio
        </h2>
        <span className="text-xs text-slate-400">Obligatorio</span>
      </div>

      {cargando && (
        <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Cargando servicios...
        </p>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> No pudimos cargar los servicios
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
      {!cargando && !error && servicios.length === 0 && (
        <p className="py-2 text-sm text-slate-500">No hay servicios disponibles por ahora.</p>
      )}

      {/* Servicio elegido: tarjeta compacta con opción de cambiarlo */}
      {!listaAbierta && servicioActivo && (
        <TarjetaServicio
          servicio={servicioActivo}
          activo
          accion={
            <button
              type="button"
              onClick={() => setCambiando(true)}
              className="shrink-0 cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Cambiar
            </button>
          }
        />
      )}

      {/* Lista completa: filtros, buscador y lista con scroll propio */}
      {listaAbierta && servicios.length > 0 && (
        <>
          {mostrarFiltros && (
            <div
              className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
              role="group"
              aria-label="Filtrar por tipo de servicio"
            >
              {FILTROS_CATEGORIA.map(({ valor, etiqueta }) => {
                const activo = filtroCategoria === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroCategoria(valor)}
                    className={`cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                      activo ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {etiqueta}
                    <span className="ml-1 font-normal text-slate-400">{conteos[valor]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {mostrarBuscador && (
            <div className="relative mb-3">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar servicio..."
                aria-label="Buscar servicio"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          <div className="max-h-80 overflow-y-auto pr-1">
            {serviciosFiltrados.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">Ningún servicio coincide con tu búsqueda.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {serviciosFiltrados.map((s) => (
                  <TarjetaServicio
                    key={s.id}
                    servicio={s}
                    activo={idServicio === s.id}
                    onClick={() => seleccionar(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}