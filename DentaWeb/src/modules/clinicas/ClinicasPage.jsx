import React, { useState, useEffect, useCallback } from 'react';
import { Building2, KeyRound } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChecklistContrasena, errorContrasena } from '../../components/ChecklistContrasena';
import { clinicasApi } from '../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Correo
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
  idusuario: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const mapearClinica = (c) => ({
  id: c.id_clinica,
  nombre: c.nombre,
  direccion: c.direccion,
  identificacion_fiscal: c.identificacion_fiscal,
  correo_usuario: c.correo_usuario,
  estado: c.activo ? 'Activa' : 'Inactiva',
});

const Etiqueta = ({ children, requerido }) => (
  <label className="mb-1 block text-xs font-medium text-slate-700 md:mb-1.5 md:text-sm">
    {children}
    {requerido && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const Seccion = ({ titulo, children }) => (
  <section className="flex flex-col gap-3 md:gap-5">
    <h3 className="hidden border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800 md:block">
      {titulo}
    </h3>
    {children}
  </section>
);

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function ClinicasPage() {
  const [clinicas, setClinicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
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

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtros en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'direccion':
        valor = valor.replace(LIMPIAR_DIRECCION, '').toUpperCase();
        break;
      case 'identificacion_fiscal':
        valor = valor.replace(LIMPIAR_RFC, '').toUpperCase();
        break;
      case 'correo':
        valor = valor.replace(LIMPIAR_CORREO, '').toLowerCase();
        break;
      case 'contrasena':
      case 'confirmarContrasena':
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
     HANDLE BLUR para validar un campo al salir
     ------------------------------------------------------------ */
  const handleBlur = (campo) => () => {
    const todos = validarFormulario(form, creando, clinicas);
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
    const errores = validarFormulario(form, creando, clinicas);

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
      setErroresCampos({});

      const datosBase = {
        nombre: mayus(form.nombre),
        direccion: mayus(form.direccion) || null,
        identificacion_fiscal: mayus(form.identificacion_fiscal) || null,
      };

      if (editandoId) {
        await clinicasApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        await clinicasApi.crear({
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

  const handleEditar = (id) => {
    const c = clinicas.find((x) => x.id_clinica === id);
    if (!c) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      ...FORM_INICIAL,
      nombre: (c.nombre ?? '').toUpperCase(),
      direccion: (c.direccion ?? '').toUpperCase(),
      identificacion_fiscal: (c.identificacion_fiscal ?? '').toUpperCase(),
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

  // Clase para marcar el input en rojo si tiene error
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  /* ------------------------------------------------------------
     FORMULARIO (misma vista, solo agregamos clases y mensajes)
     ------------------------------------------------------------ */
  const formularioClinica = (
    <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 md:rounded-xl md:p-3 md:text-sm">
          {error}
        </p>
      )}

      <Seccion titulo="Datos de la clínica">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div>
            <Etiqueta requerido>Nombre de la clínica:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. CLÍNICA CENTRO"
              className={claseConError('nombre')}
              value={form.nombre}
              onChange={handleChange('nombre')}
              onBlur={handleBlur('nombre')}
            />
            {erroresCampos.nombre && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.nombre}
              </p>
            )}
          </div>
          <div>
            <Etiqueta>Identificación fiscal:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_RFC}
              placeholder="RFC / NIT / RUC"
              className={claseConError('identificacion_fiscal')}
              value={form.identificacion_fiscal}
              onChange={handleChange('identificacion_fiscal')}
              onBlur={handleBlur('identificacion_fiscal')}
            />
            {erroresCampos.identificacion_fiscal && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.identificacion_fiscal}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <Etiqueta>Dirección completa:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_DIRECCION}
              placeholder="CALLE, NÚMERO, CIUDAD"
              className={claseConError('direccion')}
              value={form.direccion}
              onChange={handleChange('direccion')}
              onBlur={handleBlur('direccion')}
            />
            {erroresCampos.direccion && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.direccion}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            <KeyRound size={14} aria-hidden="true" /> Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos la clínica iniciará sesión en el sistema.
          </p>

          <div>
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              maxLength={MAX_CORREO}
              placeholder="clinica@correo.com"
              className={claseConError('correo')}
              value={form.correo}
              onChange={handleChange('correo')}
              onBlur={handleBlur('correo')}
            />
            {erroresCampos.correo && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.correo}
              </p>
            )}
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
                className={claseConError('confirmarContrasena')}
                value={form.confirmarContrasena}
                onChange={handleChange('confirmarContrasena')}
                onBlur={handleBlur('confirmarContrasena')}
                maxLength={72}
              />
              {erroresCampos.confirmarContrasena && (
                <p className="mt-1 text-xs text-red-600">
                  {erroresCampos.confirmarContrasena}
                </p>
              )}
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
        icono: <Building2 />,
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