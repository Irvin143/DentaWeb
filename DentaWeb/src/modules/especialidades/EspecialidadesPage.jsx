import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { especialidadesApi } from '../../services/api.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Nombre: solo letras (con acentos/ñ), espacios, apóstrofes, guiones y puntos
const REGEX_NOMBRE =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'.-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Filtro en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;

// Longitud máxima según el DER (varchar(100))
const MAX_NOMBRE = 100;

// Cuenta palabras para evitar nombres absurdamente largos
const contarPalabras = (str) =>
  str.trim().split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------------------
   Validador
   ------------------------------------------------------------ */

const validarNombreEspecialidad = (valor) => {
  const v = valor.trim();
  if (!v) return 'El nombre es obligatorio';
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > MAX_NOMBRE)
    return `El nombre no puede exceder ${MAX_NOMBRE} caracteres`;
  if (contarPalabras(v) > 6)
    return 'El nombre parece demasiado largo';
  if (!REGEX_NOMBRE.test(v))
    return 'El nombre solo puede contener letras, espacios, apóstrofes, puntos o guiones';
  return null;
};

const validarFormulario = (form, especialidades = [], editandoId = null) => {
  const errores = {};

  const errNombre = validarNombreEspecialidad(form.nombre);
  if (errNombre) errores.nombre = errNombre;
  else {
    // Unicidad local: no permitir nombres duplicados entre especialidades
    const normalizado = form.nombre.trim().toLowerCase();
    const duplicado = especialidades.some(
      (e) =>
        e.id_especialidad !== editandoId &&
        (e.nombre ?? '').trim().toLowerCase() === normalizado
    );
    if (duplicado) errores.nombre = 'Ya existe una especialidad con ese nombre';
  }

  return errores;
};

/* ============================================================
   HELPERS
   ============================================================ */

const FORM_INICIAL = {
  nombre: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const mapearEspecialidad = (e) => ({
  id: e.id_especialidad,
  nombre: e.nombre,
  estado: e.activo ? 'Activo' : 'Inactivo',
});

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await especialidadesApi.listar();
      setEspecialidades(
        data?.especialidades ?? (Array.isArray(data) ? data : [])
      );
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las especialidades');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtro en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
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
    const todos = validarFormulario(form, especialidades, editandoId);
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
    const errores = validarFormulario(form, especialidades, editandoId);

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
      };

      if (editandoId) {
        await especialidadesApi.actualizar(editandoId, payload);
      } else {
        await especialidadesApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar la especialidad');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (id) => {
    const e = especialidades.find((x) => x.id_especialidad === id);
    if (!e) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (e.nombre ?? '').toUpperCase(),
    });
  };

  const handleEliminar = async (id) => {
    try {
      await especialidadesApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar la especialidad');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await especialidadesApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar la especialidad');
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
  const formularioEspecialidad = (
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
          placeholder="Ej. Ortodoncia"
          className={claseConError('nombre')}
          value={form.nombre}
          onChange={handleChange('nombre')}
          onBlur={handleBlur('nombre')}
        />
        {erroresCampos.nombre && (
          <p className="mt-1 text-xs text-red-600">{erroresCampos.nombre}</p>
        )}
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Especialidades"
      subtitulo="Gestiona las especialidades disponibles en la red médica."
      textoBotonNuevo="Agregar especialidad"
      placeholderBusqueda="Buscar por nombre..."
      datos={especialidades.map(mapearEspecialidad)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <GraduationCap />,
        titulo: editandoId ? 'Editar Especialidad' : 'Nueva Especialidad',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Especialidad',
        contenido: formularioEspecialidad,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}