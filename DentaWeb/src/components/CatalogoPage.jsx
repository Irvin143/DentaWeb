import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { ModalGenerico } from './ModalGenerico';

const BADGE_STYLES = {
  gris: 'bg-slate-100 text-slate-600',
  verde: 'bg-teal-50 text-teal-700',
};

export function CatalogoPage({
  // Encabezado
  titulo,
  // Texto debajo del título (opcional)
  subtitulo,
  // Botón de acción principal
  textoBotonNuevo,
  // Buscador y filtros
  placeholderBusqueda = 'Buscar...',

  filtrosExtra,
  // Tabla
  datos = [],
  cargando = false,
  columnas, // opcional: [{ key, label, render? }]
  // Modal
  modal = {}, // { icono, titulo, textoGuardar, contenido, onGuardar }
}) {
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Columnas: las definidas o las derivadas de los atributos del primer registro
  const cols = useMemo(() => {
    if (columnas) return columnas;
    if (datos.length === 0) return [];
    return Object.keys(datos[0]).map((key) => ({
      key,
      label: key.replaceAll('_', ' '),
    }));
  }, [columnas, datos]);

  // Filtro del buscador (sobre todos los valores de la fila)
  const datosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return datos;
    return datos.filter((fila) =>
      Object.values(fila).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [datos, busqueda]);

  return (
    <MainLayout>
      <section className="flex min-h-screen flex-col gap-6 bg-slate-50/30 p-8">
        {/* Encabezado */}
        <header className="flex items-start justify-between">
          <hgroup className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{titulo}</h1>
            <p className="text-sm text-slate-500">{subtitulo}</p>
          </hgroup>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700"
          >
            <Plus size={18} strokeWidth={2.5} />
            {textoBotonNuevo}
          </button>
        </header>

        {/* Buscador y filtros */}
        <search className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="relative flex-1">
            <span className="sr-only">{placeholderBusqueda}</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={placeholderBusqueda}
              className="w-full rounded-xl bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
          {filtrosExtra && (
            <menu className="m-0 flex items-center gap-2 p-0">{filtrosExtra}</menu>
          )}
        </search>

        {/* Tabla */}
        <main className="flex flex-col gap-4">
          <figure className="m-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <section className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    {cols.map((col) => (
                      <th key={col.key} scope="col" className="px-6 py-4">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargando ? (
                    <tr>
                      <td
                        colSpan={cols.length || 1}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        Ejecutando consulta a la base de datos...
                      </td>
                    </tr>
                  ) : datosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={cols.length || 1}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No se encontraron resultados.
                      </td>
                    </tr>
                  ) : (
                    datosFiltrados.map((fila, rowIndex) => (
                      <tr
                        key={fila.id ?? rowIndex}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        {cols.map((col) => (
                          <td
                            key={col.key}
                            className="whitespace-nowrap px-6 py-4 text-slate-700"
                          >
                            {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </figure>
        </main>
      </section>

      {/* Modal */}
      <ModalGenerico
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        iconoCabecera={modal.icono}
        titulo={modal.titulo}
        textoBotonGuardar={modal.textoGuardar}
        onGuardar={modal.onGuardar}
      >
        {modal.contenido}
      </ModalGenerico>
    </MainLayout>
  );
}