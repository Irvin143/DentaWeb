import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, EyeOff, KeyRound, Stethoscope } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChecklistContrasena, errorContrasena } from '../../components/ChecklistContrasena';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { avisoTelefonoOcupado } from '../../utils/telefonoCompartido';
import { odontologosApi, clinicasApi, pacientesApi } from '../../services/api.js';

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

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
const limitarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 10);
const LIMPIAR_CEDULA = /[^\d]/g;
const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;

// Longitudes máximas según el DER
const MAX_NOMBRE = 100;
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
  if (!v) return 'El teléfono es obligatorio';
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

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (
  form,
  creando,
  odontologos = [],
  editandoId = null,
  pacientes = []
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

  // --- Teléfono (obligatorio; 10 dígitos y sin duplicado) ---
  const errTel = validarTelefono(form.telefono);
  if (errTel) errores.telefono = errTel;
  else {
    const ocupado = avisoTelefonoOcupado(form.telefono.replace(/\D/g, ''), {
      pacientes,
      odontologos,
      idOdontologo: editandoId,
    });
    if (ocupado) errores.telefono = ocupado;
  }

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
  cedula: o.cedula,
  telefono: o.telefono,
  correo_usuario: o.correo_usuario,
  clinica: o.nombre_clinica,
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
  const [pacientes, setPacientes] = useState([]);
  const formularioRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await odontologosApi.listar();
      console.log('Odontólogos cargados:', data);
      setOdontologos(comoLista(data, 'odontologos'));
    } catch (err) {
      console.error('Error al listar odontólogos:', err);
      setOdontologos([]);
      setErrorCarga(err.message || 'No se pudieron cargar los odontólogos.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    const [resClinicas, resPacientes] = await Promise.allSettled([
      clinicasApi.listar(),
      pacientesApi.listar(),
    ]);

    if (resClinicas.status === 'fulfilled') {
      setClinicas(comoLista(resClinicas.value, 'clinicas'));
    } else {
      console.error('Error al cargar clínicas:', resClinicas.reason);
    }
    if (resPacientes.status === 'fulfilled') {
      setPacientes(comoLista(resPacientes.value, 'pacientes'));
    } else {
      console.error('Error al cargar pacientes:', resPacientes.reason);
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
        valor = limitarTelefono(valor);
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
      editandoId,
      pacientes
    );

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
    await odontologosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await odontologosApi.reactivar(id);
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
  const formularioOdontologo = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">

      {/* Datos personales */}
      <Seccion titulo="Datos personales">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div data-campo="nombre">
            <Etiqueta requerido>Nombre(s):</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. LAURA"
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
          <div data-campo="telefono">
            <Etiqueta requerido>Teléfono:</Etiqueta>
            <input
              type="tel"
              maxLength={10}
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
          <div data-campo="ape_pat">
            <Etiqueta requerido>Apellido paterno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. GÓMEZ"
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
          <div data-campo="ape_mat">
            <Etiqueta>Apellido materno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. RÍOS"
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
          <div data-campo="cedula">
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
          <div data-campo="idclinica">
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
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            <KeyRound size={14} aria-hidden="true" /> Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos el odontólogo iniciará sesión en el sistema.
          </p>

          <div data-campo="correo">
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
            <div data-campo="contrasena">
              <Etiqueta requerido>Contraseña:</Etiqueta>
              <div className="relative">
                <input
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crea una contraseña"
                  className={`${claseConError('contrasena')} pr-12! md:pr-12!`}
                  value={form.contrasena}
                  onChange={handleChange('contrasena')}
                  onBlur={handleBlur('contrasena')}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((valor) => !valor)}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400"
                >
                  {verContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ChecklistContrasena contrasena={form.contrasena} />
              <AvisoCampo mensaje={erroresCampos.contrasena} />
            </div>
            <div data-campo="confirmarContrasena">
              <Etiqueta requerido>Confirmar contraseña:</Etiqueta>
              <div className="relative">
                <input
                  type={verConfirmar ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  className={`${claseConError('confirmarContrasena')} pr-12! md:pr-12!`}
                  value={form.confirmarContrasena}
                  onChange={handleChange('confirmarContrasena')}
                  onBlur={handleBlur('confirmarContrasena')}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar((valor) => !valor)}
                  aria-label={verConfirmar ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400"
                >
                  {verConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
    </>
  );

  return (
    <CatalogoPage
      titulo="Odontólogos"
      subtitulo="Gestiona el personal odontológico y su clínica asignada."
      textoBotonNuevo="Agregar odontólogo"
      placeholderBusqueda="Buscar por nombre, cédula, correo o clínica..."
      datos={odontologos.map(mapearOdontologo)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Stethoscope />,
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