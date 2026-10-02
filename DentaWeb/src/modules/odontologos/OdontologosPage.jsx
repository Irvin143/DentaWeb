import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { odontologosApi, clinicasApi } from '../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Correo
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre: solo letras (con acentos/ñ), espacios, apóstrofes, guiones y puntos
const REGEX_NOMBRE =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'.-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Teléfono: 10 dígitos exactos (México)
const REGEX_TELEFONO = /^\d{10}$/;

// Cédula profesional mexicana: 7 u 8 dígitos (ajústalo si tu país usa otro formato)
const REGEX_CEDULA = /^\d{7,8}$/;

// Contraseña: mínimo 8, al menos una mayúscula, una minúscula y un número
const REGEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
const LIMPIAR_TELEFONO = /[^\d\s()-]/g;
const LIMPIAR_CEDULA = /[^\d]/g;
const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;

// Longitudes máximas según el DER
const MAX_NOMBRE = 100;
const MAX_TELEFONO = 20;   // varchar(20)
const MAX_CEDULA = 50;     // varchar(50)
const MAX_CORREO = 150;

// Cuenta palabras para evitar nombres absurdamente largos
const contarPalabras = (str) =>
  str.trim().split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------------------
   Validadores por campo
   ------------------------------------------------------------ */

const validarNombre = (valor, etiqueta) => {
  const v = valor.trim();
  if (!v) return `El ${etiqueta} es obligatorio`;
  if (v.length < 2) return `El ${etiqueta} debe tener al menos 2 caracteres`;
  if (v.length > MAX_NOMBRE)
    return `El ${etiqueta} no puede exceder ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return `El ${etiqueta} solo puede contener letras, espacios, apóstrofes, puntos o guiones`;
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

const validarCedula = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'La cédula profesional es obligatoria' : null;
  if (v.length > MAX_CEDULA)
    return `La cédula no puede exceder ${MAX_CEDULA} caracteres`;
  if (!REGEX_CEDULA.test(v))
    return 'La cédula debe contener entre 7 y 8 dígitos';
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

const validarContrasena = (valor, { obligatorio = false } = {}) => {
  if (!valor) return obligatorio ? 'La contraseña es obligatoria' : null;
  if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (valor.length > 100) return 'La contraseña no puede exceder 100 caracteres';
  if (!REGEX_PASSWORD.test(valor))
    return 'Debe incluir al menos una mayúscula, una minúscula y un número';
  return null;
};

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (
  form,
  creando,
  odontologos = [],
  editandoId = null
) => {
  const errores = {};

  // --- Nombre ---
  const errNombre = validarNombre(form.nombre, 'nombre');
  if (errNombre) errores.nombre = errNombre;
  else if (contarPalabras(form.nombre) > 4)
    errores.nombre = 'El nombre parece demasiado largo';

  // --- Apellido paterno ---
  const errApePat = validarNombre(form.ape_pat, 'apellido paterno');
  if (errApePat) errores.ape_pat = errApePat;

  // --- Apellido materno (opcional) ---
  if (form.ape_mat.trim()) {
    const errApeMat = validarNombre(form.ape_mat, 'apellido materno');
    if (errApeMat) errores.ape_mat = errApeMat;
  }

  // --- Teléfono (opcional) ---
  const errTel = validarTelefono(form.telefono);
  if (errTel) errores.telefono = errTel;

  // --- Cédula (opcional pero si viene, validar y checar duplicado) ---
  const errCedula = validarCedula(form.cedula);
  if (errCedula) errores.cedula = errCedula;
  else if (form.cedula.trim()) {
    const normalizado = form.cedula.trim();
    const duplicado = odontologos.some(
      (o) =>
        o.id_odontologo !== editandoId &&
        (o.cedula ?? '').trim() === normalizado
    );
    if (duplicado) errores.cedula = 'Ya existe un odontólogo con esa cédula';
  }

  // --- Clínica (obligatoria solo al crear, según tu lógica original) ---
  if (creando && !form.idclinica) {
    errores.idclinica = 'La clínica es obligatoria';
  }

  // --- Credenciales (solo al crear) ---
  if (creando) {
    const errCorreo = validarCorreo(form.correo, { obligatorio: true });
    if (errCorreo) errores.correo = errCorreo;

    const errPass = validarContrasena(form.contrasena, { obligatorio: true });
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
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  idclinica: '',
  idusuario: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const mapearOdontologo = (o) => ({
  id: o.id_odontologo,
  nombre:
    o.nombre_completo ??
    [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' '),
  cedula: o.cedula ?? 'Sin cedula',
  telefono: o.telefono ?? 'Sin telefono',
  correo_usuario: o.correo_usuario ?? 'Sin usuario',
  clinica: o.nombre_clinica ?? 'Sin clínica',
  estado: o.activo ? 'Activo' : 'Inactivo',
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

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState([]);
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
      const data = await odontologosApi.listar();
      setOdontologos(comoLista(data, 'odontologos'));
    } catch (err) {
      console.error('Error al listar odontólogos:', err);
      setOdontologos([]);
      setError(err.message || 'No se pudieron cargar los odontólogos');
    } finally {
      setCargando(false);
    }
  }, []);

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

  const opcionesClinica = useMemo(
    () =>
      clinicas.filter(
        (c) => c.activo || String(c.id_clinica) === String(form.idclinica)
      ),
    [clinicas, form.idclinica]
  );

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtros en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
      case 'ape_pat':
      case 'ape_mat':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'telefono':
        valor = valor.replace(LIMPIAR_TELEFONO, '');
        break;
      case 'cedula':
        valor = valor.replace(LIMPIAR_CEDULA, '');
        break;
      case 'correo':
        valor = valor.replace(LIMPIAR_CORREO, '').toLowerCase();
        break;
      case 'idclinica':
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
     HANDLE BLUR
     ------------------------------------------------------------ */
  const handleBlur = (campo) => () => {
    const todos = validarFormulario(
      form,
      creando,
      odontologos,
      editandoId
    );
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
    const errores = validarFormulario(
      form,
      creando,
      odontologos,
      editandoId
    );

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError('Revisa los campos marcados antes de continuar');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: form.telefono.trim().replace(/[\s()-]/g, ''),
        cedula: mayus(form.cedula),
        idclinica: form.idclinica ? Number(form.idclinica) : null,
      };

      if (editandoId) {
        await odontologosApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        await odontologosApi.crear({
          ...datosBase,
          correo: form.correo.trim().toLowerCase(),
          contrasena: form.contrasena,
        });
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el odontólogo');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (id) => {
    const o = odontologos.find((x) => x.id_odontologo === id);
    if (!o) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      ...FORM_INICIAL,
      nombre: (o.nombre ?? '').toUpperCase(),
      ape_pat: (o.ape_pat ?? '').toUpperCase(),
      ape_mat: (o.ape_mat ?? '').toUpperCase(),
      telefono: o.telefono ?? '',
      cedula: o.cedula ?? '',
      idclinica: o.id_clinica != null ? String(o.id_clinica) : '',
      idusuario: o.id_usuario != null ? String(o.id_usuario) : '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await odontologosApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar el odontólogo');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await odontologosApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar el odontólogo');
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
  const formularioOdontologo = (
    <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 md:rounded-xl md:p-3 md:text-sm">
          {error}
        </p>
      )}

      {/* Datos personales */}
      <Seccion titulo="Datos personales">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div>
            <Etiqueta requerido>Nombre(s):</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. Laura"
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
            <Etiqueta>Teléfono:</Etiqueta>
            <input
              type="tel"
              maxLength={MAX_TELEFONO}
              placeholder="Ej. 6671234567"
              className={claseConError('telefono')}
              value={form.telefono}
              onChange={handleChange('telefono')}
              onBlur={handleBlur('telefono')}
              inputMode="numeric"
            />
            {erroresCampos.telefono && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.telefono}
              </p>
            )}
          </div>
          <div>
            <Etiqueta requerido>Apellido paterno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. Gómez"
              className={claseConError('ape_pat')}
              value={form.ape_pat}
              onChange={handleChange('ape_pat')}
              onBlur={handleBlur('ape_pat')}
            />
            {erroresCampos.ape_pat && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.ape_pat}
              </p>
            )}
          </div>
          <div>
            <Etiqueta>Apellido materno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. Ríos"
              className={claseConError('ape_mat')}
              value={form.ape_mat}
              onChange={handleChange('ape_mat')}
              onBlur={handleBlur('ape_mat')}
            />
            {erroresCampos.ape_mat && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.ape_mat}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      {/* Datos profesionales */}
      <Seccion titulo="Datos profesionales">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div>
            <Etiqueta>Cédula profesional:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_CEDULA}
              placeholder="Ej. 12345678"
              className={claseConError('cedula')}
              value={form.cedula}
              onChange={handleChange('cedula')}
              onBlur={handleBlur('cedula')}
              inputMode="numeric"
            />
            {erroresCampos.cedula && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.cedula}
              </p>
            )}
          </div>
          <div>
            <Etiqueta requerido={creando}>Clínica:</Etiqueta>
            <select
              className={claseConError('idclinica')}
              value={form.idclinica}
              onChange={handleChange('idclinica')}
              onBlur={handleBlur('idclinica')}
            >
              <option value="">
                {creando ? 'Selecciona una clínica' : 'Sin clínica'}
              </option>
              {opcionesClinica.map((c) => (
                <option key={c.id_clinica} value={c.id_clinica}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {erroresCampos.idclinica && (
              <p className="mt-1 text-xs text-red-600">
                {erroresCampos.idclinica}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      {/* Llave de acceso */}
      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            🔑 Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos el odontólogo iniciará sesión en el sistema.
          </p>

          <div>
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              maxLength={MAX_CORREO}
              placeholder="odontologo@correo.com"
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
                placeholder="Mínimo 8 caracteres"
                className={claseConError('contrasena')}
                value={form.contrasena}
                onChange={handleChange('contrasena')}
                onBlur={handleBlur('contrasena')}
                maxLength={100}
              />
              {erroresCampos.contrasena && (
                <p className="mt-1 text-xs text-red-600">
                  {erroresCampos.contrasena}
                </p>
              )}
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
                maxLength={100}
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
      titulo="Odontólogos"
      subtitulo="Gestiona el personal odontológico y su clínica asignada."
      textoBotonNuevo="Agregar odontólogo"
      placeholderBusqueda="Buscar por nombre, cédula, correo o clínica..."
      datos={odontologos.map(mapearOdontologo)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🦷',
        titulo: editandoId ? 'Editar Odontólogo' : 'Nuevo Odontólogo',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Odontólogo',
        contenido: formularioOdontologo,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}