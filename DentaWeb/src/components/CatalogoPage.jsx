import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { ModalGenerico } from './ModalGenerico';
import ModalConfirmacion from './ModalConfirmacion';
import { ToastContainer } from './Toast';

const REGISTROS_POR_PAGINA = 10;

// Duración total de cada notificación y tiempo que tarda en salir
const DURACION_TOAST = 3000;
const DURACION_SALIDA = 300;

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

function Interruptor({ activo, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={activo ? 'Desactivar' : 'Reactivar'}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${activo ? 'bg-teal-600' : 'bg-slate-300'}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${activo ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

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
  // onEliminar y onReactivar: si lanzan un error o devuelven false, se muestra una notificación de error
  onEditar, // (id) => void
  onEliminar, // (id) => void | Promise
  onReactivar, // (id) => void | Promise
  // Modal
  modal = {}, // { icono, titulo, textoGuardar, contenido, onGuardar, onCerrar }
}) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // para el texto de la notificación
  const [orden, setOrden] = useState({ columna: null, direccion: 'asc' });
  const [confirmacion, setConfirmacion] = useState({
    isOpen: false,
    id: null,
    accion: null,
  });

  const [guardando, setGuardando] = useState(false);
  const modalVista = useRef(modal);
  if (!guardando) modalVista.current = modal;
  const [toasts, setToasts] = useState([]);

  const hayAcciones = Boolean(onEditar || onEliminar || onReactivar);

  // ---- Notificaciones ----
  const cerrarToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // tipo: 'exito' | 'error'. Entra, se queda ~3 s en total y sale con animación
  const mostrarToast = useCallback((tipo, mensaje) => {
    const id = `${Date.now()}-${Math.random()}`;

    // Se agrega fuera de pantalla y en el siguiente cuadro pasa a visible (animación de entrada)
    setToasts((prev) => [...prev, { id, tipo, mensaje, visible: false }]);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)))
      )
    );

    // Animación de salida y retiro del DOM
    setTimeout(
      () => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t))),
      DURACION_TOAST - DURACION_SALIDA
    );
    setTimeout(() => cerrarToast(id), DURACION_TOAST);
  }, [cerrarToast]);

  // Columnas visibles: las definidas o las derivadas del primer registro, sin el id real
  const cols = useMemo(() => {
    const base = columnas
      ? columnas
      : datos.length === 0
        ? []
        : Object.keys(datos[0]).map((key) => ({
            key,
            label: key.replaceAll('_', ' '),
          }));
    return base.filter((col) => col.key !== 'id');
  }, [columnas, datos]);

  const columnaOrden = cols.some((col) => col.key === orden.columna)
    ? orden.columna
    : cols[0]?.key;

  const totalColumnas = cols.length + 1 + (hayAcciones ? 1 : 0);

  // Filtro del buscador y, después, orden de la lista ya cargada
  const datosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = q
      ? datos.filter((fila) =>
          Object.entries(fila).some(
            ([clave, valor]) => clave !== 'id' && String(valor).toLowerCase().includes(q)
          )
        )
      : datos;
    const factor = orden.direccion === 'desc' ? -1 : 1;
    return [...filtrados].sort((a, b) => {
      const resultado = columnaOrden
        ? compararValores(a[columnaOrden], b[columnaOrden]) * factor
        : 0;
      return resultado !== 0 ? resultado : porId(a, b);
    });
  }, [datos, busqueda, orden, columnaOrden]);

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
    setOrden((prev) => {
      const actual = cols.some((col) => col.key === prev.columna) ? prev.columna : cols[0]?.key;
      return actual === key
        ? { columna: key, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' }
        : { columna: key, direccion: 'asc' };
    });
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
  const abrirNuevo = () => {
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    modal.onCerrar?.(); // la página limpia su formulario
  };

  // La página devuelve true si guardó bien: entonces se cierra el modal y se avisa.
  // Si devuelve false (o un texto con el motivo), se avisa del error y el modal sigue abierto.
  const handleGuardar = async () => {
    if (!modal.onGuardar) {
      cerrarModal();
      return;
    }

    setGuardando(true); // congela título y contenido

    try {
      const resultado = await modal.onGuardar();

      if (resultado === true) {
        setModalAbierto(false);
        mostrarToast(
          'exito',
          modoEdicion ? 'Registro actualizado correctamente' : 'Registro creado correctamente'
        );
        return true;
      }

      mostrarToast(
        'error',
        typeof resultado === 'string' ? resultado : 'No se pudo guardar. Revisa los datos.'
      );
      return false;
    } catch (err) {
      mostrarToast('error', err?.message || 'No se pudo guardar el registro');
      return false;
    } finally {
      setGuardando(false); // el modal ya está cerrado (o sigue abierto tras un error)
    }
  };

  // ---- Acciones de fila ----
  const handleEditar = (fila) => {
    onEditar?.(fila.id); // la página carga los datos en el formulario
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const handleEliminar = (fila) => {
    setConfirmacion({ isOpen: true, id: fila.id, accion: 'eliminar' });
  };

  const handleReactivar = (fila) => {
    setConfirmacion({ isOpen: true, id: fila.id, accion: 'reactivar' });
  };

  const procesarConfirmacion = async () => {
    const { id, accion } = confirmacion;
    const esEliminar = accion === 'eliminar';
    const ejecutar = esEliminar ? onEliminar : onReactivar;

    try {
      const resultado = await ejecutar?.(id);
      if (resultado === false) {
        mostrarToast(
          'error',
          esEliminar ? 'No se pudo desactivar el registro' : 'No se pudo reactivar el registro'
        );
        return;
      }
      mostrarToast(
        'exito',
        esEliminar ? 'Registro desactivado correctamente' : 'Registro reactivado correctamente'
      );
    } catch (err) {
      mostrarToast(
        'error',
        err?.message ||
          (esEliminar ? 'No se pudo desactivar el registro' : 'No se pudo reactivar el registro')
      );
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
            onClick={abrirNuevo}
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
              value={columnaOrden ?? ''}
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
                    {cols.length > 0 && (
                      <th scope="col" className="px-5 py-3 normal-case">
                        No.
                      </th>
                    )}
                    {cols.map((col) => {
                      const activa = columnaOrden === col.key;
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
                        <td
                          className={`px-5 py-3 align-top ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-700'}`}
                        >
                          {inicio + rowIndex + 1}
                        </td>
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
                                  className={`${botonIcono} hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-colors`}
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {(onEliminar || onReactivar) && (
                                <Interruptor
                                  activo={!estaInactiva(fila)}
                                  onClick={() =>
                                    estaInactiva(fila) ? handleReactivar(fila) : handleEliminar(fila)
                                  }
                                />
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
                      <div className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
                        <dt
                          className={`text-xs font-semibold tracking-wider normal-case ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-500'}`}
                        >
                          No.
                        </dt>
                        <dd className={`m-0 break-words ${estaInactiva(fila) ? 'text-slate-400' : 'text-slate-700'}`}>
                          {inicio + rowIndex + 1}
                        </dd>
                      </div>
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
                            className={`${botonIcono} flex cursor-pointer items-center gap-1.5 px-3 text-xs font-medium hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800`}
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        )}
                        {(onEliminar || onReactivar) && (
                          <Interruptor
                            activo={!estaInactiva(fila)}
                            onClick={() =>
                              estaInactiva(fila) ? handleReactivar(fila) : handleEliminar(fila)
                            }
                          />
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

      {/* MODAL DE CONFIRMACIÓN */}
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

      {/* Notificaciones */}
      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />
    </div>
  );
}