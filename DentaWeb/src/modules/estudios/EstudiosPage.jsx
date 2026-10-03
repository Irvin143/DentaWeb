import React, { useState, useEffect, useCallback } from 'react';
import { Scan } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { estudiosApi } from '../../services/api.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Nombre: letras, números, espacios y símbolos comunes (por si es "Rayos X 3D")
const REGEX_NOMBRE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/()-]*$/;

// Descripción: más libre, pero sin caracteres de control raros
const REGEX_DESCRIPCION = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,;:¿?¡!()#°&/+\-–—]*$/;

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/()-]/g;
const LIMPIAR_DESCRIPCION = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,;:¿?¡!()#°&/+\-–—]/g;

// Longitudes máximas
const MAX_NOMBRE = 100;       // varchar(100) en el DER
const MAX_DESCRIPCION = 500;  // text en el DER, pero ponemos un tope razonable

// Cuenta palabras para evitar nombres absurdamente largos
const contarPalabras = (str) =>
  str.trim().split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------------------
   Validadores por campo
   ------------------------------------------------------------ */

const validarNombreEstudio = (valor) => {
  const v = valor.trim();
  if (!v) return 'El nombre es obligatorio';
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > MAX_NOMBRE)
    return `El nombre no puede exceder ${MAX_NOMBRE} caracteres`;
  if (contarPalabras(v) > 8) return 'El nombre parece demasiado largo';
  if (!REGEX_NOMBRE.test(v))
    return 'El nombre contiene caracteres no permitidos';
  return null;
};

const validarDescripcion = (valor) => {
  const v = valor.trim();
  if (!v) return null; // opcional
  if (v.length < 5)
    return 'La descripción debe tener al menos 5 caracteres';
  if (v.length > MAX_DESCRIPCION)
    return `La descripción no puede exceder ${MAX_DESCRIPCION} caracteres`;
  if (!REGEX_DESCRIPCION.test(v))
    return 'La descripción contiene caracteres no permitidos';
  return null;
};

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (form, estudios = [], editandoId = null) => {
  const errores = {};

  const errNombre = validarNombreEstudio(form.nombre);
  if (errNombre) errores.nombre = errNombre;
  else {
    // Unicidad local: no permitir nombres duplicados
    const normalizado = form.nombre.trim().toLowerCase();
    const duplicado = estudios.some(
      (e) =>
        e.id_estudio !== editandoId &&
        (e.nombre ?? '').trim().toLowerCase() === normalizado
    );
    if (duplicado) errores.nombre = 'Ya existe un estudio con ese nombre';
  }

  const errDesc = validarDescripcion(form.descripcion);
  if (errDesc) errores.descripcion = errDesc;

  return errores;
};

/* ============================================================
   HELPERS
   ============================================================ */

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const mapearEstudio = (e) => ({
  id: e.id_estudio,
  nombre: e.nombre,
  descripcion: e.descripcion,
  estado: e.activo ? 'Activo' : 'Inactivo',
});

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function EstudiosPage() {
  const [estudios, setEstudios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await estudiosApi.listar();
      setEstudios(data?.estudios ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los estudios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtros en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'descripcion':
        // En descripción permitimos mayúsculas/minúsculas y puntos, pero sin
        // caracteres raros. La normalizamos a mayúsculas también.
        valor = valor.replace(LIMPIAR_DESCRIPCION, '').toUpperCase();
        break;
      default:
        break;
    }

    setForm((prev) => ({ ...prev, [campo]: valor }));

    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  /* ------------------------------------------------------------
     HANDLE BLUR
     ------------------------------------------------------------ */
  const handleBlur = (campo) => () => {
    const todos = validarFormulario(form, estudios, editandoId);
    setErroresCampos((prev) => {
      const copia = { ...prev };
      if (todos[campo]) copia[campo] = todos[campo];
      else delete copia[campo];
      return copia;
    });
  };

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
  };

  /* ------------------------------------------------------------
     GUARDAR
     ------------------------------------------------------------ */
  const handleGuardar = async () => {
    const errores = validarFormulario(form, estudios, editandoId);

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError('Revisa los campos marcados antes de continuar');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const payload = {
        nombre: mayus(form.nombre),
        descripcion: form.descripcion.trim()
          ? mayus(form.descripcion)
          : null,
      };

      if (editandoId) {
        await estudiosApi.actualizar(editandoId, payload);
      } else {
        await estudiosApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el estudio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (id) => {
    const e = estudios.find((x) => x.id_estudio === id);
    if (!e) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (e.nombre ?? '').toUpperCase(),
      descripcion: (e.descripcion ?? '').toUpperCase(),
    });
  };

  const handleEliminar = async (id) => {
    try {
      await estudiosApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar el estudio');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await estudiosApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar el estudio');
    }
  };

  // Clase para marcar el input en rojo si tiene error
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  /* ------------------------------------------------------------
     FORMULARIO (misma vista, solo agregamos clases y mensajes)
     ------------------------------------------------------------ */
  const formularioEstudio = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre:
        </label>
        <input
          type="text"
          maxLength={MAX_NOMBRE}
          placeholder="Ej. RADIOGRAFÍA PANORÁMICA"
          className={claseConError('nombre')}
          value={form.nombre}
          onChange={handleChange('nombre')}
          onBlur={handleBlur('nombre')}
        />
        {erroresCampos.nombre && (
          <p className="mt-1 text-xs text-red-600">{erroresCampos.nombre}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Descripción:
        </label>
        <textarea
          rows={4}
          maxLength={MAX_DESCRIPCION}
          placeholder="Describe en qué consiste el estudio (opcional)"
          className={`${claseConError('descripcion')} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
          onBlur={handleBlur('descripcion')}
        />
        <div className="mt-1 flex items-center justify-between">
          {erroresCampos.descripcion ? (
            <p className="text-xs text-red-600">{erroresCampos.descripcion}</p>
          ) : (
            <span className="text-xs text-slate-400">
              Opcional · máx {MAX_DESCRIPCION} caracteres
            </span>
          )}
          <span
            className={`text-xs ${
              form.descripcion.length > MAX_DESCRIPCION * 0.9
                ? 'text-amber-600'
                : 'text-slate-400'
            }`}
          >
            {form.descripcion.length} / {MAX_DESCRIPCION}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Estudios"
      subtitulo="Gestiona los estudios clínicos disponibles en la red médica."
      textoBotonNuevo="Agregar estudio"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={estudios.map(mapearEstudio)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Scan />,
        titulo: editandoId ? 'Editar Estudio' : 'Nuevo Estudio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Estudio',
        contenido: formularioEstudio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}