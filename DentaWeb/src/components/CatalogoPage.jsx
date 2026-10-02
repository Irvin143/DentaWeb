import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, CircleOff, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { ModalGenerico } from './ModalGenerico';
import ModalConfirmacion from './ModalConfirmacion';

const REGISTROS_POR_PAGINA = 10;

// Ordena por id (numérico, ascendente). Si no hay id, conserva el orden original.
const porId = (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0);
const estaInactiva = (fila) => /^inactiv[oa]$/i.test(String(fila.estado ?? '').trim());
const ambosNumeros = (a, b) =>
  typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b);

const compararValores = (a, b) =>
  ambosNumeros(a, b)
    ? a - b
    : String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' });

const etiquetaColumna = (label) =>
  label ? label.charAt(0).toUpperCase() + label.slice(1) : '';

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
  // Acciones por fila (opcionales: si no se pasan, no se muestra la columna)
  onEditar, // (id) => void
  onEliminar, // (id) => void
  onReactivar, // (id) => void
  // Modal
  modal = {}, // { icono, titulo, textoGuardar, contenido, onGuardar, onCerrar }
}) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [orden, setOrden] = useState({ columna: 'id', direccion: 'asc' });
  const [confirmacion, setConfirmacion] = useState({
    isOpen: false,
    id: null,
    accion: null,
  });
  
  const hayAcciones = Boolean(onEditar || onEliminar || onReactivar);

  // Columnas: las definidas o las derivadas de los atributos del primer registro
  const cols = useMemo(() => {
    if (columnas) return columnas;
    if (datos.length === 0) return [];
    return Object.keys(datos[0]).map((key) => ({
      key,
      label: key.replaceAll('_', ' '),
    }));
  }, [columnas, datos]);

  const totalColumnas = cols.length + (hayAcciones ? 1 : 0);

  // Filtro del buscador y, después, orden de la lista ya cargada
  const datosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = q
      ? datos.filter((fila) =>
          Object.values(fila).some((v) => String(v).toLowerCase().includes(q))
        )
      : datos;
    const factor = orden.direccion === 'desc' ? -1 : 1;
    return [...filtrados].sort((a, b) => {
      const resultado = compararValores(a[orden.columna], b[orden.columna]) * factor;
      return resultado !== 0 ? resultado : porId(a, b);
    });
  }, [datos, busqueda, orden]);

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

  const ordenarPor = (key) => {
    setOrden((prev) =>
      prev.columna === key
        ? { columna: key, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' }
        : { columna: key, direccion: 'asc' }
    );
    setPagina(1);
  };

  const elegirColumna = (key) => {
    setOrden((prev) => (prev.columna === key ? prev : { columna: key, direccion: 'asc' }));
    setPagina(1);
  };

  const alternarDireccion = () => {
    setOrden((prev) => ({
      ...prev,
      direccion: prev.direccion === 'asc' ? 'desc' : 'asc',
    }));
    setPagina(1);
  };

  // ---- Modal ----
  const cerrarModal = () => {
    setModalAbierto(false);
    modal.onCerrar?.(); // la página limpia su formulario
  };

  // La página devuelve true si guardó bien: entonces se cierra el modal
  const handleGuardar = async () => {
    if (!modal.onGuardar) {
      cerrarModal(); // mismo comportamiento que antes: sin onGuardar, solo cierra
      return;
    }
    const ok = await modal.onGuardar();
    if (ok) setModalAbierto(false);
    return ok;
  };

  // ---- Acciones de fila ----
  const handleEditar = (fila) => {
    onEditar?.(fila.id); // la página carga los datos en el formulario
    setModalAbierto(true);
  };

  const handleEliminar = (fila) => {
    setConfirmacion({ isOpen: true, id: fila.id, accion: 'eliminar' });
  };

  const handleReactivar = (fila) => {
    setConfirmacion({ isOpen: true, id: fila.id, accion: 'reactivar' });
  };

  const procesarConfirmacion = () => {
    if (confirmacion.accion === 'eliminar') {
      onEliminar?.(confirmacion.id);
    } else {
      onReactivar?.(confirmacion.id);
    }
  };

  const botonIcono =
    'rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors';

  return (
    <div>
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
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700"
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

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <select
              aria-label="Ordenar por"
              value={cols.some((col) => col.key === orden.columna) ? orden.columna : ''}
              onChange={(e) => elegirColumna(e.target.value)}
              className="cursor-pointer rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
            >
              {cols.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={alternarDireccion}
              aria-label={orden.direccion === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
              className="cursor-pointer rounded-xl bg-slate-50 p-2.5 text-slate-500 outline-none transition-all hover:text-slate-700 focus:ring-2 focus:ring-teal-500/20"
            >
              {orden.direccion === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
        </search>

        {/* Tabla */}
        <main className="flex flex-col gap-4">
          <figure className="m-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Escritorio: tabla */}
            <section className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    {cols.map((col) => {
                      const activa = orden.columna === col.key;
                      const siguiente =
                        activa && orden.direccion === 'asc' ? 'descendente' : 'ascendente';
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={
                            !activa ? 'none' : orden.direccion === 'asc' ? 'ascending' : 'descending'
                          }
                          className="p-0"
                        >
                          <button
                            type="button"
                            onClick={() => ordenarPor(col.key)}
                            aria-label={`${etiquetaColumna(col.label)}, orden ${siguiente}`}
                            className="flex w-full cursor-pointer items-center gap-1.5 px-5 py-3 text-left uppercase transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            {col.label}
                            {activa &&
                              (orden.direccion === 'asc' ? (
                                <ArrowUp size={14} className="shrink-0 text-slate-500" />
                              ) : (
                                <ArrowDown size={14} className="shrink-0 text-slate-500" />
                              ))}
                          </button>
                        </th>
                      );
                    })}
                    {totalRegistros >= 1 && (
                      <th scope="col" className="px-5 py-3 text-right">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargando ? (
                    <tr>
                      <td colSpan={totalColumnas || 1} className="px-5 py-12 text-center text-slate-500">
                        Ejecutando consulta a la base de datos...
                      </td>
                    </tr>
                  ) : totalRegistros === 0 ? (
                    <tr>
                      <td colSpan={totalColumnas || 1} className="px-5 py-12 text-center text-slate-500">
                        No se encontraron resultados.
                      </td>
                    </tr>
                  ) : (
                    datosPagina.map((fila, rowIndex) => (
                      <tr
                        key={fila.id ?? rowIndex}
                        className={
                          estaInactiva(fila)
                            ? 'bg-slate-50 transition-colors'
                            : 'transition-colors hover:bg-slate-50/50'
                        }
                      >
                        {cols.map((col) => (
                          <td
                            key={col.key}
                            className={`px-5 py-3 align-top ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-700'}`}
                          >
                            {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                          </td>
                        ))}
                        {hayAcciones && (
                          <td className="px-5 py-3 align-top">
                            <div className="flex items-center justify-end gap-2">
                              {onEditar && (
                                <button
                                  type="button"
                                  onClick={() => handleEditar(fila)}
                                  title="Editar"
                                  aria-label="Editar"
                                  className={`${botonIcono} hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600 cursor-pointer transition-colors`}
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {onEliminar && (
                                <button
                                  type="button"
                                  onClick={() => handleEliminar(fila)}
                                  title="Desactivar"
                                  aria-label="Desactivar"
                                  className={`${botonIcono} hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors`}
                                >
                                  <CircleOff size={16} />
                                </button>
                              )}
                              {onReactivar && estaInactiva(fila) && (
                                <button
                                  type="button"
                                  onClick={() => handleReactivar(fila)}
                                  title="Reactivar"
                                  aria-label="Reactivar"
                                  className={`${botonIcono} cursor-pointer transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600`}
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
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
                  <li
                    key={fila.id ?? rowIndex}
                    className={estaInactiva(fila) ? 'bg-slate-50 px-4 py-4' : 'px-4 py-4'}
                  >
                    <dl className="m-0 grid gap-2">
                      {cols.map((col) => (
                        <div key={col.key} className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
                          <dt
                            className={`text-xs font-semibold uppercase tracking-wider ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-500'}`}
                          >
                            {col.label}
                          </dt>
                          <dd className={`m-0 break-words ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-700'}`}>
                            {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    {hayAcciones && (
                      <div className="mt-3 flex justify-end gap-2">
                        {onEditar && (
                          <button
                            type="button"
                            onClick={() => handleEditar(fila)}
                            className={`${botonIcono} flex cursor-pointer items-center gap-1.5 px-3 text-xs font-medium hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600`}
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        )}
                        {onEliminar && (
                          <button
                            type="button"
                            onClick={() => handleEliminar(fila)}
                            aria-label="Desactivar"
                            className={`${botonIcono} flex cursor-pointer items-center gap-1.5 px-3 text-xs font-medium hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
                          >
                            <CircleOff size={14} />
                            Desactivar
                          </button>
                        )}
                        {onReactivar && estaInactiva(fila) && (
                          <button
                            type="button"
                            onClick={() => handleReactivar(fila)}
                            aria-label="Reactivar"
                            className={`${botonIcono} flex cursor-pointer items-center gap-1.5 px-3 text-xs font-medium hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600`}
                          >
                            <RotateCcw size={14} />
                            Reactivar
                          </button>
                        )}
                      </div>
                    )}
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
                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
        onClose={cerrarModal}
        iconoCabecera={modal.icono}
        titulo={modal.titulo}
        textoBotonGuardar={modal.textoGuardar}
        onGuardar={handleGuardar}
      >
        {modal.contenido}
      </ModalGenerico>
      {/*MODAL DE CONFIRMACIÓN */}
      <ModalConfirmacion
        isOpen={confirmacion.isOpen}
        onClose={() => setConfirmacion({ isOpen: false, id: null, accion: null })}
        onConfirm={procesarConfirmacion}
        titulo={confirmacion.accion === 'eliminar' ? 'Desactivar registro' : 'Reactivar registro'}
        mensaje={
          confirmacion.accion === 'eliminar'
            ? '¿Seguro que deseas desactivar este elemento? Esta acción requiere validación.'
            : '¿Seguro que deseas reactivar este elemento?'
        }
        textoConfirmar={confirmacion.accion === 'eliminar' ? 'Desactivar' : 'Reactivar'}
        esPeligro={confirmacion.accion === 'eliminar'}
        palabraRequerida={confirmacion.accion === 'eliminar' ? 'DESACTIVAR' : ''} 
      />
    </div>
  );
}