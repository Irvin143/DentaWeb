import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BriefcaseMedical } from 'lucide-react';
import { CatalogoPage } from '../../../components/CatalogoPage';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../../components/avisosFormulario';
import { serviciosApi, clinicasApi } from '../../../services/api.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

// Categorías que acepta el backend
const CATEGORIAS = [
  { valor: 'consulta', etiqueta: 'Consulta', ejemplo: 'Ej. LIMPIEZA DENTAL' },
  { valor: 'estudio', etiqueta: 'Estudio', ejemplo: 'Ej. RADIOGRAFÍA PANORÁMICA' },
];

const CATEGORIA_POR_DEFECTO = 'consulta';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  categoria: CATEGORIA_POR_DEFECTO,
  idsClinicas: [], // arreglo de IDs (números)
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Acepta un arreglo directo o la lista envuelta en un objeto
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Etiqueta legible de una categoría ('estudio' → 'Estudio')
const etiquetaCategoria = (valor) =>
  CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? 'Consulta';

// Obtiene las clínicas de un servicio. Espera `clinicas: [{ id_clinica, nombre }]`
// y mantiene compatibilidad con el formato anterior (una sola clínica).
const clinicasDeServicio = (s) => {
  if (Array.isArray(s.clinicas)) return s.clinicas;
  if (s.id_clinica != null) {
    return [{ id_clinica: s.id_clinica, nombre: s.nombre_clinica }];
  }
  return [];
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearServicio = (s) => ({
  id: s.id_servicio,
  nombre: s.nombre,
  descripcion: s.descripcion,
  categoria: etiquetaCategoria(s.categoria),
  clinica: clinicasDeServicio(s)
    .map((c) => c.nombre)
    .filter(Boolean)
    .join(', '),
  estado: s.activo ? 'Activo' : 'Inactivo',
});

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([]); // datos crudos del backend
  const [clinicas, setClinicas] = useState([]); // para el selector de clínicas
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const formularioRef = useRef(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await serviciosApi.listar();
      setServicios(comoLista(data, 'servicios'));
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los servicios.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Catálogo para el selector (si falla, la página sigue funcionando)
  const cargarCatalogos = useCallback(async () => {
    const [resClinicas] = await Promise.allSettled([clinicasApi.listar()]);
    if (resClinicas.status === 'fulfilled') {
      setClinicas(comoLista(resClinicas.value, 'clinicas'));
    } else {
      console.error('Error al cargar clínicas:', resClinicas.reason);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Clínicas activas (más las que ya tiene seleccionadas el servicio que se edita)
  const opcionesClinica = useMemo(
    () =>
      clinicas.filter(
        (c) => c.activo !== false || form.idsClinicas.includes(Number(c.id_clinica))
      ),
    [clinicas, form.idsClinicas]
  );

  const ejemploNombre =
    CATEGORIAS.find((c) => c.valor === form.categoria)?.ejemplo ?? CATEGORIAS[0].ejemplo;

  const handleChange = (campo) => (e) => {
    const valor = e.target.value.toLocaleUpperCase('es-MX');
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const seleccionarCategoria = (valor) => {
    setForm((prev) => ({ ...prev, categoria: valor }));
    setErroresCampos((prev) => ({ ...prev, categoria: undefined }));
  };

  const toggleClinica = (id) => {
    const idNum = Number(id);
    setForm((prev) => ({
      ...prev,
      idsClinicas: prev.idsClinicas.includes(idNum)
        ? prev.idsClinicas.filter((x) => x !== idNum)
        : [...prev.idsClinicas, idNum],
    }));
    setErroresCampos((prev) => ({ ...prev, idsClinicas: undefined }));
  };

  const todasSeleccionadas =
    opcionesClinica.length > 0 &&
    opcionesClinica.every((c) => form.idsClinicas.includes(Number(c.id_clinica)));

  const toggleTodas = () => {
    setForm((prev) => ({
      ...prev,
      idsClinicas: todasSeleccionadas ? [] : opcionesClinica.map((c) => Number(c.id_clinica)),
    }));
    setErroresCampos((prev) => ({ ...prev, idsClinicas: undefined }));
  };

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
  };

  // Devuelve true si guardó bien (para que el modal pueda cerrarse)
  const handleGuardar = async () => {
    const errores = {};
    if (!CATEGORIAS.some((c) => c.valor === form.categoria)) {
      errores.categoria = 'Selecciona el tipo de servicio';
    }
    if (form.idsClinicas.length === 0) errores.idsClinicas = 'Selecciona al menos una clínica';
    if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length > 100) errores.nombre = 'El nombre no puede exceder 100 caracteres';
    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError(null);
      requestAnimationFrame(() => scrollAlPrimerCampo(formularioRef.current, errores));
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const payload = {
        nombre: mayus(form.nombre),
        descripcion: form.descripcion.trim() ? mayus(form.descripcion) : null,
        categoria: form.categoria,
        idsClinicas: form.idsClinicas,
      };
      if (editandoId) {
        await serviciosApi.actualizar(editandoId, payload);
      } else {
        await serviciosApi.crear(payload);
      }

      resetFormulario();
      cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el servicio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const s = servicios.find((x) => x.id_servicio === id);
    if (!s) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (s.nombre ?? '').toLocaleUpperCase('es-MX'),
      descripcion: (s.descripcion ?? '').toLocaleUpperCase('es-MX'),
      categoria: s.categoria ?? CATEGORIA_POR_DEFECTO,
      idsClinicas: clinicasDeServicio(s).map((c) => Number(c.id_clinica)),
    });
  };

  const handleEliminar = async (id) => {
    await serviciosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await serviciosApi.reactivar(id);
    await cargar();
  };

  const formularioServicio = (
    <>
      <AvisoGeneral mensaje={error} />
      <div ref={formularioRef} className="flex flex-col gap-4">
        <div data-campo="categoria">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tipo de servicio:<span className="ml-0.5 text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de servicio">
            {CATEGORIAS.map(({ valor, etiqueta }) => {
              const activa = form.categoria === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => seleccionarCategoria(valor)}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activa
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {etiqueta}
                </button>
              );
            })}
          </div>
          <AvisoCampo mensaje={erroresCampos.categoria} />
        </div>

        <div data-campo="idsClinicas">
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Clínicas:<span className="ml-0.5 text-red-500">*</span>
            </label>
            {opcionesClinica.length > 1 && (
              <button
                type="button"
                onClick={toggleTodas}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                {todasSeleccionadas ? 'Quitar todas' : 'Seleccionar todas'}
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
            {opcionesClinica.length === 0 ? (
              <p className="p-2 text-sm text-slate-500">No hay clínicas disponibles.</p>
            ) : (
              opcionesClinica.map((c) => {
                const marcada = form.idsClinicas.includes(Number(c.id_clinica));
                return (
                  <label
                    key={c.id_clinica}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal-600"
                      checked={marcada}
                      onChange={() => toggleClinica(c.id_clinica)}
                    />
                    <span className="text-sm text-slate-700">{c.nombre}</span>
                  </label>
                );
              })
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {form.idsClinicas.length === 0
              ? 'Ninguna clínica seleccionada'
              : `${form.idsClinicas.length} seleccionada${form.idsClinicas.length === 1 ? '' : 's'}`}
          </p>
          <AvisoCampo mensaje={erroresCampos.idsClinicas} />
        </div>

        <div data-campo="nombre">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nombre:<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            placeholder={ejemploNombre}
            className={inputClass}
            value={form.nombre}
            onChange={handleChange('nombre')}
          />
          <AvisoCampo mensaje={erroresCampos.nombre} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
          <textarea
            rows={4}
            placeholder="Describe en qué consiste el servicio (opcional)"
            className={`${inputClass} resize-none`}
            value={form.descripcion}
            onChange={handleChange('descripcion')}
          />
        </div>
      </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Servicios"
      subtitulo="Gestiona las consultas y estudios que ofrece cada clínica."
      textoBotonNuevo="Agregar servicio"
      placeholderBusqueda="Buscar por nombre, descripción, tipo o clínica..."
      datos={servicios.map(mapearServicio)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <BriefcaseMedical />,
        titulo: editandoId ? 'Editar Servicio' : 'Nuevo Servicio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Servicio',
        contenido: formularioServicio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}