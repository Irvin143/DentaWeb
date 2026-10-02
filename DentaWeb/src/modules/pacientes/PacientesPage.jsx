import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { pacientesApi } from '../../services/api.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 uppercase outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  correo: '',
};

// '1990-05-12' o '1990-05-12T00:00:00.000Z' -> '12/05/1990'
const formatearFecha = (valor) => {
  if (!valor) return '—';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

const mapearPaciente = (p) => ({
  id: p.id_paciente,
  nombre: (
    p.nombre_completo ??
    [p.nombre, p.ape_pat, p.ape_mat].filter(Boolean).join(' ')
  ).toUpperCase(),
  telefono: p.telefono ?? '—',
  correo: (p.correo ?? '—').toUpperCase(),
  odontologo: p.id_odontologo
    ? String(p.nombre_odontologo).toUpperCase()
    : 'SIN ASIGNAR',
  estado: p.activo ? 'Activo' : 'Inactivo',
});

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Solo letras (incluye acentos y ñ), espacios y guiones. Entre 2 y 50 caracteres.
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Teléfono: 10 dígitos exactos (formato México). Ajusta si necesitas otro.
const REGEX_TELEFONO = /^\d{10}$/;

// Correo: validación estándar razonable.
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Cuenta cuántas palabras tiene un nombre compuesto.
const contarPalabras = (str) =>
  str.trim().split(/\s+/).filter(Boolean).length;

const validarNombre = (valor, etiqueta) => {
  const v = valor.trim();
  if (!v) return `El ${etiqueta} es obligatorio`;
  if (v.length < 2) return `El ${etiqueta} debe tener al menos 2 caracteres`;
  if (v.length > 50) return `El ${etiqueta} no puede exceder 50 caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return `El ${etiqueta} solo puede contener letras, espacios, apóstrofes o guiones`;
  return null;
};

const validarTelefono = (valor) => {
  const v = valor.trim();
  if (!v) return null; // opcional
  const soloDigitos = v.replace(/[\s()-]/g, '');
  if (!/^\d+$/.test(soloDigitos))
    return 'El teléfono solo puede contener números';
  if (!REGEX_TELEFONO.test(soloDigitos))
    return 'El teléfono debe tener exactamente 10 dígitos';
  return null;
};

const validarCorreo = (valor) => {
  const v = valor.trim();
  if (!v) return null; // opcional
  if (v.length > 100) return 'El correo no puede exceder 100 caracteres';
  if (!REGEX_CORREO.test(v)) return 'Ingresa un correo electrónico válido';
  return null;
};

// Devuelve un objeto con errores por campo. Vacío = todo bien.
const validarFormulario = (form) => {
  const errores = {};

  const errNombre = validarNombre(form.nombre, 'nombre');
  if (errNombre) errores.nombre = errNombre;
  else if (contarPalabras(form.nombre) > 4)
    errores.nombre = 'El nombre parece demasiado largo';

  const errApePat = validarNombre(form.ape_pat, 'apellido paterno');
  if (errApePat) errores.ape_pat = errApePat;

  // Apellido materno es opcional, pero si viene, se valida.
  if (form.ape_mat.trim()) {
    const errApeMat = validarNombre(form.ape_mat, 'apellido materno');
    if (errApeMat) errores.ape_mat = errApeMat;
  }

  const errTel = validarTelefono(form.telefono);
  if (errTel) errores.telefono = errTel;

  const errCorreo = validarCorreo(form.correo);
  if (errCorreo) errores.correo = errCorreo;

  // Regla de negocio: al menos un medio de contacto (teléfono o correo).
  if (!form.telefono.trim() && !form.correo.trim()) {
    errores.contacto =
      'Debes registrar al menos un medio de contacto (teléfono o correo)';
  }

  return errores;
};

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await pacientesApi.listar();
      setPacientes(data?.pacientes ?? (Array.isArray(data) ? data : []));
      console.log('Pacientes cargados:', data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pacientes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al cambiar un campo, actualizamos su valor y limpiamos su error puntual.
  const handleChange = (campo) => (e) => {
  // Todo a mayúsculas (los campos numéricos no se ven afectados).
  const valor = e.target.value.toUpperCase();
  setForm((prev) => ({ ...prev, [campo]: valor }));
  setErroresCampos((prev) => {
    if (!prev[campo] && !prev.contacto) return prev;
    const copia = { ...prev };
    delete copia[campo];
    if (campo === 'telefono' || campo === 'correo') {
      const tel = campo === 'telefono' ? valor : form.telefono;
      const correo = campo === 'correo' ? valor : form.correo;
      if (tel.trim() || correo.trim()) delete copia.contacto;
    }
    return copia;
  });
};

  // Validación al salir del campo (blur) para dar feedback inmediato.
  const handleBlur = (campo) => () => {
    const errores = validarFormulario(form);
    setErroresCampos((prev) => {
      const copia = { ...prev };
      if (errores[campo]) copia[campo] = errores[campo];
      else delete copia[campo];
      if (errores.contacto) copia.contacto = errores.contacto;
      else delete copia.contacto;
      return copia;
    });
  };

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
  };

  const handleGuardar = async () => {
    // Validación completa antes de enviar.
    const errores = validarFormulario(form);
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
        nombre: form.nombre.trim().toUpperCase(),
        ape_pat: form.ape_pat.trim().toUpperCase(),
        ape_mat: form.ape_mat.trim().toUpperCase(),
        telefono: form.telefono.trim().replace(/[\s()-]/g, ''),
        correo: form.correo.trim().toUpperCase(),
        id_odontologo: null,
      };

      if (editandoId) {
        await pacientesApi.actualizar(editandoId, payload);
      } else {
        await pacientesApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el paciente');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    if (!p) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (p.nombre ?? '').toUpperCase(),
      ape_pat: (p.ape_pat ?? '').toUpperCase(),
      ape_mat: (p.ape_mat ?? '').toUpperCase(),
      telefono: p.telefono ?? '',
      correo: (p.correo ?? '').toUpperCase(),
      fecha_nacimiento: p.fecha_nacimiento
        ? String(p.fecha_nacimiento).slice(0, 10)
        : '',
    });
  };

  const handleEliminar = async (id) => {
    if (
      !window.confirm(
        '¿Seguro que deseas desactivar este paciente? Podrás reactivarlo después.'
      )
    )
      return;
    try {
      await pacientesApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al desactivar el paciente');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este paciente?')) return;
    try {
      await pacientesApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar el paciente');
    }
  };

  // Clase de input que se pinta en rojo cuando hay error.
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  const formularioPaciente = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre(s):
        </label>
        <input
          type="text"
          placeholder="Ej. María Fernanda"
          className={claseConError('nombre')}
          value={form.nombre}
          onChange={handleChange('nombre')}
          onBlur={handleBlur('nombre')}
          maxLength={50}
        />
        {erroresCampos.nombre && (
          <p className="mt-1 text-xs text-red-600">{erroresCampos.nombre}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Apellido paterno:
          </label>
          <input
            type="text"
            placeholder="Ej. López"
            className={claseConError('ape_pat')}
            value={form.ape_pat}
            onChange={handleChange('ape_pat')}
            onBlur={handleBlur('ape_pat')}
            maxLength={50}
          />
          {erroresCampos.ape_pat && (
            <p className="mt-1 text-xs text-red-600">{erroresCampos.ape_pat}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Apellido materno:
          </label>
          <input
            type="text"
            placeholder="Ej. Ramírez"
            className={claseConError('ape_mat')}
            value={form.ape_mat}
            onChange={handleChange('ape_mat')}
            onBlur={handleBlur('ape_mat')}
            maxLength={50}
          />
          {erroresCampos.ape_mat && (
            <p className="mt-1 text-xs text-red-600">{erroresCampos.ape_mat}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Teléfono:
          </label>
          <input
            type="tel"
            placeholder="Ej. 6671234567"
            className={claseConError('telefono')}
            value={form.telefono}
            onChange={handleChange('telefono')}
            onBlur={handleBlur('telefono')}
            maxLength={15}
            inputMode="numeric"
          />
          {erroresCampos.telefono && (
            <p className="mt-1 text-xs text-red-600">
              {erroresCampos.telefono}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Correo electrónico:
        </label>
        <input
          type="email"
          placeholder="paciente@correo.com"
          className={claseConError('correo')}
          value={form.correo}
          onChange={handleChange('correo')}
          onBlur={handleBlur('correo')}
          maxLength={100}
        />
        {erroresCampos.correo && (
          <p className="mt-1 text-xs text-red-600">{erroresCampos.correo}</p>
        )}
      </div>
      {erroresCampos.contacto && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
          {erroresCampos.contacto}
        </p>
      )}
    </div>
  );

  return (
    <CatalogoPage
      titulo="Pacientes"
      subtitulo="Gestiona el registro de pacientes de la red médica."
      textoBotonNuevo="Agregar paciente"
      placeholderBusqueda="Buscar por nombre, teléfono o correo..."
      datos={pacientes.map(mapearPaciente)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🧑‍⚕️',
        titulo: editandoId ? 'Editar Paciente' : 'Nuevo Paciente',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Paciente',
        contenido: formularioPaciente,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}