import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { ModalGenerico } from './ModalGenerico';

const REGISTROS_POR_PAGINA = 10;

export function CatalogoPage({
  // Encabezado
  titulo,
  // Texto debajo del título (opcional)
  subtitulo,
  // Botón de acción principal
  textoBotonNuevo,
  // Buscador y filtros
  placeholderBusqueda = 'Buscar...',
  // Tabla
  datos = [],
  cargando = false,
  columnas, // opcional: [{ key, label, render? }]
  // Modal
  modal = {}, // { icono, titulo, textoGuardar, contenido, onGuardar }
}) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
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

  // Paginación
  const totalRegistros = datosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const datosPagina = datosFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  return (
    <MainLayout>
      <section className="flex min-h-screen flex-col gap-6 bg-slate-50/30 p-4 md:p-8">
        {/* Encabezado */}
        <header className="flex flex-wrap items-start justify-between gap-4">
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
        <search className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="relative min-w-0 flex-1 basis-48">
            <span className="sr-only">{placeholderBusqueda}</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={busqueda}
              onChange={handleBusqueda}
              placeholder={placeholderBusqueda}
              className="w-full rounded-xl bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
        </search>

        {/* Tabla */}
        <main className="flex flex-col gap-4">
          <figure className="m-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Escritorio: tabla */}
            <section className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    {cols.map((col) => (
                      <th key={col.key} scope="col" className="px-5 py-3">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargando ? (
                    <tr>
                      <td colSpan={cols.length || 1} className="px-5 py-12 text-center text-slate-500">
                        Ejecutando consulta a la base de datos...
                      </td>
                    </tr>
                  ) : totalRegistros === 0 ? (
                    <tr>
                      <td colSpan={cols.length || 1} className="px-5 py-12 text-center text-slate-500">
                        No se encontraron resultados.
                      </td>
                    </tr>
                  ) : (
                    datosPagina.map((fila, rowIndex) => (
                      <tr key={fila.id ?? rowIndex} className="transition-colors hover:bg-slate-50/50">
                        {cols.map((col) => (
                          <td key={col.key} className="px-5 py-3 align-top text-slate-700">
                            {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            {/* Mobile: tarjetas */}
            <ul className="m-0 list-none divide-y divide-slate-100 p-0 md:hidden">
              {cargando ? (
                <li className="px-4 py-12 text-center text-sm text-slate-500">
                  Ejecutando consulta a la base de datos...
                </li>
              ) : totalRegistros === 0 ? (
                <li className="px-4 py-12 text-center text-sm text-slate-500">
                  No se encontraron resultados.
                </li>
              ) : (
                datosPagina.map((fila, rowIndex) => (
                  <li key={fila.id ?? rowIndex} className="px-4 py-4">
                    <dl className="m-0 grid gap-2">
                      {cols.map((col) => (
                        <div key={col.key} className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {col.label}
                          </dt>
                          <dd className="m-0 break-words text-slate-700">
                            {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))
              )}
            </ul>

            {/* Paginación */}
            {!cargando && totalRegistros > 0 && (
              <nav
                aria-label="Paginación"
                className="flex items-center justify-end border-t border-slate-200 px-5 py-3"
              >
                <menu className="m-0 flex items-center gap-2 p-0">
                  <button
                    type="button"
                    onClick={() => setPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    aria-label="Página anterior"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="text-xs font-medium text-slate-600">
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    aria-label="Página siguiente"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </menu>
              </nav>
            )}
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