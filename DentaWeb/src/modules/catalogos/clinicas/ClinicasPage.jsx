import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { CatalogoPage } from '../../../components/CatalogoPage.jsx';
import { ChecklistContrasena, errorContrasena } from '../../../components/ChecklistContrasena.jsx';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../../components/avisosFormulario.jsx';
import { clinicasApi } from '../../../services/api.js';
import {
  avisoCpInexistente,
  ajustarConCatalogo,
  aplicarCodigoPostal,
  cargarCatalogoSepomex,
  entradaSepomex,
} from '../../../utils/sepomex.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Correo
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre / textos de dirección: letras, números, espacios y signos comunes
const REGEX_NOMBRE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;
const REGEX_DIRECCION = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;

// Números exterior / interior: 12, 12-A, S/N, 4B
const REGEX_NUMERO = /^[A-Z0-9][A-Z0-9/-]*$/;

// Código postal (México): 5 dígitos
const REGEX_CP = /^\d{5}$/;

// RFC / NIT / RUC: alfanumérico con guiones y puntos
const REGEX_RFC = /^[A-Z0-9][A-Z0-9.-]*$/;

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]/g;
const LIMPIAR_DIRECCION = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]/g;
const LIMPIAR_NUMERO = /[^A-Za-z0-9/-]/g;
const LIMPIAR_CP = /\D/g;
const LIMPIAR_RFC = /[^A-Za-z0-9.-]/g;
const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;

// Longitudes máximas según el DER
const MAX_NOMBRE = 150;
const MAX_RFC = 50;
const MAX_CORREO = 150;

const PAIS_POR_DEFECTO = 'MÉXICO';

/* ------------------------------------------------------------
   Campos de la dirección (atomizada)
   tipo: 'texto' | 'numero' | 'cp'
   ------------------------------------------------------------ */
const CAMPOS_DIRECCION = [
  { campo: 'pais', etiqueta: 'País', max: 100, tipo: 'pais', ancho: true },
  { campo: 'calle', etiqueta: 'Calle', max: 150, tipo: 'texto', placeholder: 'Ej. AV. JUÁREZ', ancho: true },
  { campo: 'numero_exterior', etiqueta: 'Número exterior', max: 20, tipo: 'numero', placeholder: 'Ej. 123' },
  { campo: 'numero_interior', etiqueta: 'Número interior', max: 20, tipo: 'numero', placeholder: 'Ej. 4B' },
  { campo: 'codigo_postal', etiqueta: 'Código postal', max: 5, tipo: 'cp', placeholder: 'Ej. 80000', inputMode: 'numeric' },
  { campo: 'estado', etiqueta: 'Estado', max: 100, tipo: 'texto', placeholder: 'Ej. SINALOA' },
  { campo: 'ciudad', etiqueta: 'Ciudad', max: 100, tipo: 'texto', placeholder: 'Ej. CULIACÁN' },
  { campo: 'colonia', etiqueta: 'Colonia', max: 100, tipo: 'texto', placeholder: 'Ej. CENTRO' },
  { campo: 'referencias', etiqueta: 'Referencias', max: 300, tipo: 'texto', placeholder: 'Ej. ENTRE CALLE X Y CALLE Y, FRENTE AL PARQUE', ancho: true },
];

const NOMBRES_CAMPO = Object.fromEntries(
  CAMPOS_DIRECCION.map((c) => [c.campo, c.etiqueta.toLowerCase()])
);

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

// Valida un campo individual de la dirección (todos opcionales por sí solos)
const validarCampoDireccion = (config, valor) => {
  const v = valor.trim();
  if (!v) return null;
  const nombre = NOMBRES_CAMPO[config.campo];
  if (v.length > config.max)
    return `El campo ${nombre} no puede exceder ${config.max} caracteres`;

  if (config.tipo === 'cp') {
    if (!REGEX_CP.test(v)) return 'El código postal debe tener 5 dígitos';
  } else if (config.tipo === 'numero') {
    if (!REGEX_NUMERO.test(v))
      return `El campo ${nombre} solo admite letras, números, guiones y diagonales`;
  } else if (!REGEX_DIRECCION.test(v)) {
    return `El campo ${nombre} contiene caracteres no permitidos`;
  }
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

// ¿El usuario capturó algo de la dirección? (el país por defecto no cuenta)
const hayDireccionCapturada = (form) =>
  CAMPOS_DIRECCION.some(
    ({ campo }) => campo !== 'pais' && (form[campo] ?? '').trim() !== ''
  );

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (form, creando, clinicas = [], catalogoCp = null) => {
  const errores = {};

  const errNombre = validarNombreClinica(form.nombre);
  if (errNombre) errores.nombre = errNombre;

  // Dirección: cada campo + regla "si hay dirección, la calle es obligatoria"
  CAMPOS_DIRECCION.forEach((config) => {
    if (config.campo === 'pais') return;
    const err = validarCampoDireccion(config, form[config.campo] ?? '');
    if (err) errores[config.campo] = err;
  });
  const cpInexistente = avisoCpInexistente(catalogoCp, form.codigo_postal);
  if (cpInexistente) errores.codigo_postal = cpInexistente;
  if (!errores.calle && hayDireccionCapturada(form) && !form.calle.trim()) {
    errores.calle = 'La calle es obligatoria si capturas una dirección';
  }

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
  calle: '',
  numero_exterior: '',
  numero_interior: '',
  colonia: '',
  codigo_postal: '',
  ciudad: '',
  estado: '',
  pais: PAIS_POR_DEFECTO,
  referencias: '',
  identificacion_fiscal: '',
  idusuario: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

const mayus = (valor) => (valor ?? '').trim().toLocaleUpperCase('es-MX');

// Arma el objeto de dirección que espera el backend (o null si no hay dirección)
const construirDireccion = (form) => {
  if (!hayDireccionCapturada(form)) return null;

  const direccion = {};
  CAMPOS_DIRECCION.forEach(({ campo }) => {
    direccion[campo] = mayus(form[campo]) || null;
  });
  direccion.pais = PAIS_POR_DEFECTO;
  return direccion;
};

const claseSoloLectura = `${inputClass} cursor-default bg-slate-50 text-slate-700`;

function CargarSepomexAlAbrir({ onCargado }) {
  useEffect(() => {
    let vivo = true;
    cargarCatalogoSepomex().then((cat) => {
      if (vivo) onCargado(cat);
    });
    return () => {
      vivo = false;
    };
  }, [onCargado]);
  return null;
}

const mapearClinica = (c) => ({
  id: c.id_clinica,
  nombre: c.nombre,
  direccion: c.direccion, // texto armado por el backend
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
  const [errorCarga, setErrorCarga] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const formularioRef = useRef(null);
  const catalogoRef = useRef(null);
  const [catalogoCp, setCatalogoCp] = useState(null);
  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const creando = editandoId === null;

  const alCargarCatalogo = useCallback((cat) => {
    catalogoRef.current = cat;
    setCatalogoCp(cat);
    setForm((prev) => {
      const next = ajustarConCatalogo(prev, cat);
      const aviso = avisoCpInexistente(cat, next.codigo_postal);
      setErroresCampos((errs) => {
        const copia = { ...errs };
        if (aviso) copia.codigo_postal = aviso;
        else if (copia.codigo_postal === 'Ese código postal no existe.') delete copia.codigo_postal;
        return copia;
      });
      return next;
    });
  }, []);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await clinicasApi.listar();
      setClinicas(comoLista(data, 'clinicas'));
    } catch (err) {
      console.error('Error al listar clínicas:', err);
      setClinicas([]);
      setErrorCarga(err.message || 'No se pudieron cargar las clínicas.');
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
      case 'numero_exterior':
      case 'numero_interior':
        valor = valor.replace(LIMPIAR_NUMERO, '').toUpperCase();
        break;
      case 'codigo_postal':
        valor = valor.replace(LIMPIAR_CP, '').slice(0, 5);
        break;
      case 'calle':
      case 'colonia':
      case 'ciudad':
      case 'estado':
      case 'referencias':
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

    setForm((prev) => {
      if (campo === 'codigo_postal') {
        return aplicarCodigoPostal({ ...prev, pais: PAIS_POR_DEFECTO }, catalogoRef.current, valor);
      }
      return { ...prev, [campo]: valor, pais: PAIS_POR_DEFECTO };
    });

    // Al editar cualquier campo de dirección se limpia también el aviso de la
    // calle obligatoria, porque puede haber dejado de aplicar
    setErroresCampos((prev) => {
      const esDireccion = CAMPOS_DIRECCION.some((c) => c.campo === campo);
      if (!prev[campo] && !(esDireccion && prev.calle) && campo !== 'codigo_postal') return prev;
      const copia = { ...prev };
      delete copia[campo];
      if (esDireccion && campo !== 'calle' && copia.calle?.includes('obligatoria')) {
        delete copia.calle;
      }
      const avisoCp = campo === 'codigo_postal'
        ? avisoCpInexistente(catalogoRef.current, valor)
        : null;
      if (avisoCp) copia.codigo_postal = avisoCp;
      else if (campo === 'codigo_postal') delete copia.codigo_postal;
      return copia;
    });
  };

  /* ------------------------------------------------------------
     HANDLE BLUR para validar un campo al salir
     ------------------------------------------------------------ */
  const handleBlur = (campo) => () => {
    const todos = validarFormulario(form, creando, clinicas, catalogoRef.current);
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
    const catalogo = await cargarCatalogoSepomex();
    catalogoRef.current = catalogo;
    setCatalogoCp(catalogo);
    const errores = validarFormulario(form, creando, clinicas, catalogo);

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
        direccion: construirDireccion(form),
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

    const direccion = {};
    CAMPOS_DIRECCION.forEach(({ campo }) => {
      direccion[campo] = (c[campo] ?? '').toString().toUpperCase();
    });
    direccion.pais = PAIS_POR_DEFECTO;

    setForm(
      ajustarConCatalogo({
        ...FORM_INICIAL,
        ...direccion,
        nombre: (c.nombre ?? '').toUpperCase(),
        identificacion_fiscal: (c.identificacion_fiscal ?? '').toUpperCase(),
        idusuario: c.id_usuario != null ? String(c.id_usuario) : '',
      }, catalogoRef.current)
    );
  };

  const handleEliminar = async (id) => {
    await clinicasApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await clinicasApi.reactivar(id);
    await cargar();
  };

  // Clase para marcar el input en rojo si tiene error
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  /* ------------------------------------------------------------
     FORMULARIO
     ------------------------------------------------------------ */
  const entradaCp = entradaSepomex(catalogoCp, form.codigo_postal);
  const coloniasCp = entradaCp?.colonias ?? [];
  const bloquearGeo = Boolean(entradaCp);
  const coloniaLista = bloquearGeo && coloniasCp.length > 1;

  const formularioClinica = (
    <>
    <CargarSepomexAlAbrir onCargado={alCargarCatalogo} />
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">

      <Seccion titulo="Datos de la clínica">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div data-campo="nombre">
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
          <div data-campo="identificacion_fiscal">
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
        </div>
      </Seccion>

      <Seccion titulo="Dirección">
        <p className="text-xs text-slate-500 md:text-sm">
          Opcional. Si capturas una dirección, la calle es obligatoria.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          {CAMPOS_DIRECCION.map(({ campo, etiqueta, max, placeholder, inputMode, ancho }) => {
            const soloLectura =
              campo === 'pais' ||
              ((campo === 'estado' || campo === 'ciudad') && bloquearGeo) ||
              (campo === 'colonia' && bloquearGeo && coloniasCp.length === 1);
            return (
            <div
              key={campo}
              data-campo={campo}
              className={ancho ? 'md:col-span-2' : undefined}
            >
              <Etiqueta>{etiqueta}:</Etiqueta>
              {campo === 'colonia' && coloniaLista ? (
                <select
                  className={claseConError(campo)}
                  value={form.colonia}
                  onChange={handleChange('colonia')}
                  onBlur={handleBlur('colonia')}
                >
                  <option value="">Selecciona una colonia</option>
                  {coloniasCp.map((colonia) => (
                    <option key={colonia} value={colonia}>
                      {colonia}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  inputMode={inputMode}
                  maxLength={max}
                  placeholder={campo === 'pais' ? undefined : placeholder}
                  className={soloLectura ? claseSoloLectura : claseConError(campo)}
                  value={campo === 'pais' ? PAIS_POR_DEFECTO : form[campo]}
                  onChange={soloLectura ? undefined : handleChange(campo)}
                  onBlur={soloLectura ? undefined : handleBlur(campo)}
                  readOnly={soloLectura}
                  aria-readonly={soloLectura || undefined}
                />
              )}
              <AvisoCampo mensaje={erroresCampos[campo]} />
            </div>
            );
          })}
        </div>
      </Seccion>

      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            <KeyRound size={14} aria-hidden="true" /> Datos de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos la clínica iniciará sesión en el sistema.
          </p>

          <div data-campo="correo">
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
      titulo="Clínicas"
      subtitulo="Gestiona las sedes activas de la red médica."
      textoBotonNuevo="Agregar clínica"
      placeholderBusqueda="Buscar por nombre de clínica o dirección..."
      datos={clinicas.map(mapearClinica)}
      cargando={cargando}
      errorCarga={errorCarga}
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