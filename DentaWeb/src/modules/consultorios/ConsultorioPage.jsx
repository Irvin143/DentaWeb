import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DoorOpen } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { consultoriosApi, clinicasApi } from '../../services/api.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Nombre: letras, números, espacios y símbolos comunes (por si es "Consultorio 1-A")
const REGEX_NOMBRE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;

// Filtro en tiempo real: bloquea caracteres inválidos mientras se escribe
const LIMPIAR_NOMBRE = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]/g;

// Longitud máxima según el DER (varchar(100))
const MAX_NOMBRE = 100;

/* ------------------------------------------------------------
   Validadores por campo
   ------------------------------------------------------------ */

const validarNombreConsultorio = (valor) => {
  const v = valor.trim();
  if (!v) return 'El nombre es obligatorio';
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > MAX_NOMBRE)
    return `El nombre no puede exceder ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return 'El nombre contiene caracteres no permitidos';
  return null;
};

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (form) => {
  const errores = {};

  const errNombre = validarNombreConsultorio(form.nombre);
  if (errNombre) errores.nombre = errNombre;

  return errores;
};

/* ============================================================
   HELPERS
   ============================================================ */

const FORM_INICIAL = {
  nombre: '',
  id_clinica: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function ConsultoriosPage() {
  const [consultorios, setConsultorios] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const formularioRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const [dataConsultorios, dataClinicas] = await Promise.all([
        consultoriosApi.listar(),
        clinicasApi.listar(),
      ]);
      setConsultorios(
        dataConsultorios?.consultorios ??
          (Array.isArray(dataConsultorios) ? dataConsultorios : [])
      );
      setClinicas(
        dataClinicas?.clinicas ??
          (Array.isArray(dataClinicas) ? dataClinicas : [])
      );
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los consultorios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mapearConsultorio = (c) => {
    const clinica = clinicas.find((x) => x.id_clinica === c.id_clinica);
    return {
      id: c.id_consultorio,
      nombre: c.nombre,
      clinica: c.id_clinica ? c.nombre_clinica ?? clinica?.nombre : null,
      estado: c.activo ? 'Activo' : 'Inactivo',
    };
  };

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtro en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'id_clinica':
        // select: no se filtra, es un id numérico
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
    const todos = validarFormulario(form);
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
    const errores = validarFormulario(form);

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
        idclinica: form.id_clinica ? Number(form.id_clinica) : null,
      };

      if (editandoId) {
        await consultoriosApi.actualizar(editandoId, payload);
      } else {
        await consultoriosApi.crear(payload);
      }

      resetFormulario();
      cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el consultorio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (id) => {
    const c = consultorios.find((x) => x.id_consultorio === id);
    if (!c) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (c.nombre ?? '').toUpperCase(),
      id_clinica: c.id_clinica ? String(c.id_clinica) : '',
    });
  };

  const handleEliminar = async (id) => {
    await consultoriosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await consultoriosApi.reactivar(id);
    await cargar();
  };

  // Clase para marcar el input en rojo si tiene error
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  /* ------------------------------------------------------------
     FORMULARIO (misma vista, solo agregamos clases y mensajes)
     ------------------------------------------------------------ */
  const formularioConsultorio = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex flex-col gap-4">
      <div data-campo="nombre">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre:
        </label>
        <input
          type="text"
          maxLength={MAX_NOMBRE}
          placeholder="Ej. CONSULTORIO 1"
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
          Clínica:
        </label>
        <select
          className={inputClass}
          value={form.id_clinica}
          onChange={handleChange('id_clinica')}
        >
          <option value="">Sin asignar</option>
          {clinicas.map((c) => (
            <option key={c.id_clinica} value={c.id_clinica}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Consultorios"
      subtitulo="Gestiona los consultorios de cada clínica."
      textoBotonNuevo="Agregar consultorio"
      placeholderBusqueda="Buscar por nombre o clínica..."
      datos={consultorios.map(mapearConsultorio)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <DoorOpen />,
        titulo: editandoId ? 'Editar Consultorio' : 'Nuevo Consultorio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Consultorio',
        contenido: formularioConsultorio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}