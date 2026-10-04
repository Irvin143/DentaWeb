import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChecklistContrasena, errorContrasena } from '../../components/ChecklistContrasena';
import { clinicasApi } from '../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre / dirección: letras, números, espacios y signos comunes de dirección
const REGEX_NOMBRE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;
const REGEX_DIRECCION = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;

// RFC / NIT / RUC: alfanumérico con guiones y puntos
const REGEX_RFC = /^[A-Z0-9][A-Z0-9.-]*$/;

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]/g;
const LIMPIAR_DIRECCION = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]/g;
const LIMPIAR_RFC = /[^A-Za-z0-9.-]/g;
const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;

// Longitudes máximas según el DER
const MAX_NOMBRE = 150;
const MAX_DIRECCION = 300;
const MAX_RFC = 50;
const MAX_CORREO = 150;

/* ------------------------------------------------------------
   Validadores por campo (devuelven string o null)
   ------------------------------------------------------------ */

const validarNombreClinica = (valor) => {
  const v = valor.trim();
  if (!v) return 'El nombre de la clínica es obligatorio';
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > MAX_NOMBRE)
    return `El nombre no puede exceder ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return 'El nombre contiene caracteres no permitidos';
  return null;
};

const validarDireccion = (valor) => {
  const v = valor.trim();
  if (!v) return null; // opcional
  if (v.length > MAX_DIRECCION)
    return `La dirección no puede exceder ${MAX_DIRECCION} caracteres`;
  if (!REGEX_DIRECCION.test(v))
    return 'La dirección contiene caracteres no permitidos';
  return null;
};

const validarRFC = (valor) => {
  const v = valor.trim();
  if (!v) return null; // opcional
  if (v.length < 12) return 'La identificación fiscal debe tener al menos 12 caracteres';
  if (v.length > MAX_RFC)
    return `La identificación fiscal no puede exceder ${MAX_RFC} caracteres`;
  if (!REGEX_RFC.test(v))
    return 'La identificación fiscal solo puede contener letras, números, guiones y puntos';
  return null;
};

const validarCorreo = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'El correo es obligatorio' : null;
  if (v.length > MAX_CORREO)
    return `El correo no puede exceder ${MAX_CORREO} caracteres`;
  if (!REGEX_CORREO.test(v)) return 'Ingresa un correo electrónico válido';
  return null;
};

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (form, creando, clinicas = []) => {
  const errores = {};

  const errNombre = validarNombreClinica(form.nombre);
  if (errNombre) errores.nombre = errNombre;

  const errDir = validarDireccion(form.direccion);
  if (errDir) errores.direccion = errDir;

  const errRfc = validarRFC(form.identificacion_fiscal);
  if (errRfc) errores.identificacion_fiscal = errRfc;

  if (creando) {
    const errCorreo = validarCorreo(form.correo, { obligatorio: true });
    if (errCorreo) errores.correo = errCorreo;
    else {
      const duplicado = clinicas.some(
        (c) =>
          (c.correo_usuario ?? '').toLowerCase() ===
          form.correo.trim().toLowerCase()
      );
      if (duplicado) errores.correo = 'Ya existe una clínica con ese correo';
    }

    const errPass = errorContrasena(form.contrasena);
    if (errPass) errores.contrasena = errPass;

    if (!form.confirmarContrasena)
      errores.confirmarContrasena = 'Confirma la contraseña';
    else if (form.contrasena !== form.confirmarContrasena)
      errores.confirmarContrasena = 'Las contraseñas no coinciden';
  }

  return errores;
};

/* ============================================================
   HELPERS
   ============================================================ */

const FORM_INICIAL = {
  nombre: '',
  direccion: '',
  identificacion_fiscal: '',
  idusuario: '', // solo se conserva al editar (no se muestra)
  correo: '', // llave de acceso (solo al crear)
  contrasena: '',
  confirmarContrasena: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto ({ data: [...] }, { clinicas: [...] })
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Normaliza a mayúsculas lo que se manda al backend
const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearClinica = (c) => ({
  id: c.id_clinica,
  nombre: c.nombre,
  direccion: c.direccion ?? '—',
  identificacion_fiscal: c.identificacion_fiscal ?? '—',
  correo_usuario: c.correo_usuario ?? 'Sin correo',
  estado: c.activo ? 'Activa' : 'Inactiva',
});

const Etiqueta = ({ children, requerido }) => (
  <label className="mb-1 block text-xs font-medium text-slate-700 md:mb-1.5 md:text-sm">
    {children}
    {requerido && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

// Sección con título: el título solo se ve en desktop, en mobile queda compacto
const Seccion = ({ titulo, children }) => (
  <section className="flex flex-col gap-3 md:gap-5">
    <h3 className="hidden border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800 md:block">
      {titulo}
    </h3>
    {children}
  </section>
);

export default function ClinicasPage() {
  const [clinicas, setClinicas] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await clinicasApi.listar();
      setClinicas(comoLista(data, 'clinicas'));
    } catch (err) {
      console.error('Error al listar clínicas:', err);
      setClinicas([]);
      setError(err.message || 'No se pudieron cargar las clínicas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleChange = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
  };

  // Devuelve un mensaje de error o null si todo está bien
  const validar = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (form.nombre.trim().length > 150) return 'El nombre no puede exceder 150 caracteres';
    if (form.identificacion_fiscal.trim().length > 50) {
      return 'La identificación fiscal no puede exceder 50 caracteres';
    }

    const errores = {};

    if (form.contrasena) {
      const error = errorContrasena(form.contrasena);
      if (error) errores.contrasena = error;
    }

    if (form.confirmarContrasena) {
      if (form.contrasena !== form.confirmarContrasena) {
        errores.confirmarContrasena = 'Las contraseñas no coinciden';
      }
    }

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError(
        errores.contrasena ||
          errores.confirmarContrasena ||
          'Revisa los campos marcados antes de continuar'
      );
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const datosBase = {
        nombre: mayus(form.nombre),
        direccion: mayus(form.direccion) || null,
        identificacion_fiscal: mayus(form.identificacion_fiscal) || null,
      };

      if (editandoId) {
        // Al editar se conserva el usuario que ya tiene; no se tocan las credenciales
         clinicasApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        // Al crear, el backend genera el usuario (tipo clínica) con estas credenciales
        clinicasApi.crear({
          ...datosBase,
          correo: form.correo.trim().toLowerCase(),
          contrasena: form.contrasena,
        });
      }

      resetFormulario();
      cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar la clínica');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const c = clinicas.find((x) => x.id_clinica === id);
    if (!c) return;
    setEditandoId(id);
    setError(null);
    setForm({
      ...FORM_INICIAL,
      nombre: c.nombre ?? '',
      direccion: c.direccion ?? '',
      identificacion_fiscal: c.identificacion_fiscal ?? '',
      idusuario: c.id_usuario != null ? String(c.id_usuario) : '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await clinicasApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar la clínica');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await clinicasApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar la clínica');
    }
  };

  // max-h + overflow: si no cabe, solo el formulario hace scroll
  const formularioClinica = (
    <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 md:rounded-xl md:p-3 md:text-sm">
          {error}
        </p>
      )}

      {/* Datos de la clínica */}
      <Seccion titulo="Datos de la clínica">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div>
            <Etiqueta requerido>Nombre de la clínica:</Etiqueta>
            <input
              type="text"
              maxLength={150}
              placeholder="Ej. Clínica Centro"
              className={inputClass}
              value={form.nombre}
              onChange={handleChange('nombre')}
            />
          </div>
          <div>
            <Etiqueta>Identificación fiscal:</Etiqueta>
            <input
              type="text"
              maxLength={50}
              placeholder="RFC / NIT / RUC"
              className={inputClass}
              value={form.identificacion_fiscal}
              onChange={handleChange('identificacion_fiscal')}
            />
          </div>
          <div className="md:col-span-2">
            <Etiqueta>Dirección completa:</Etiqueta>
            <input
              type="text"
              placeholder="Calle, Número, Ciudad"
              className={inputClass}
              value={form.direccion}
              onChange={handleChange('direccion')}
            />
          </div>
        </div>
      </Seccion>

      {/* Llave de acceso: solo al crear, genera el usuario de la clínica */}
      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            🔑 Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos la clínica iniciará sesión en el sistema.
          </p>

          <div>
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              maxLength={150}
              placeholder="clinica@correo.com"
              className={inputClass}
              value={form.correo}
              onChange={handleChange('correo')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div>
              <Etiqueta requerido>Contraseña:</Etiqueta>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                className={claseConError('contrasena')}
                value={form.contrasena}
                onChange={handleChange('contrasena')}
                onBlur={handleBlur('contrasena')}
                maxLength={72}
              />
              <ChecklistContrasena contrasena={form.contrasena} />
            </div>
            <div>
              <Etiqueta requerido>Confirmar contraseña:</Etiqueta>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className={inputClass}
                value={form.confirmarContrasena}
                onChange={handleChange('confirmarContrasena')}
                onBlur={handleBlur('confirmarContrasena')}
                maxLength={72}
              />
            </div>
          </div>
        </fieldset>
      )}
    </div>
  );

  return (
    <CatalogoPage
      titulo="Clínicas"
      subtitulo="Gestiona las sedes activas de la red médica."
      textoBotonNuevo="Agregar clínica"
      placeholderBusqueda="Buscar por nombre de clínica o dirección..."
      datos={clinicas.map(mapearClinica)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🏥',
        titulo: editandoId ? 'Editar Clínica' : 'Nueva Clínica',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Clínica',
        contenido: formularioClinica,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}