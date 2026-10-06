import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChecklistContrasena, errorContrasena } from '../../components/ChecklistContrasena';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { avisoTelefonoOcupado } from '../../utils/telefonoCompartido';
import {
  usuariosApi,
  paquetesApi,
  tiposUsuarioApi,
  odontologosApi,
  pacientesApi,
  clinicasApi,
} from '../../services/api.js'; // ajusta paquetesApi al nombre que uses para paquetes

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORM_INICIAL = {
  idtipousuario: '',
  idpaquete: '',
  // Datos del perfil (odontólogo / paciente)
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  idclinica: '',
  id_odontologo: '',
  // Datos de la clínica
  clinica_nombre: '',
  direccion: '',
  identificacion_fiscal: '',
  // Llave de acceso
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Minúsculas y sin acentos, para comparar nombres de tipo
const limpiar = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Normaliza a mayúsculas lo que se manda al backend
const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
const nombrePersona = (valor) =>
  String(valor ?? '').replace(LIMPIAR_NOMBRE, '').toLocaleUpperCase('es-MX');

const limitarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 10);
const digitosTelefono = (valor) => String(valor ?? '').replace(/\D/g, '');

const mensajeTelefono = (valor) => {
  if (!String(valor ?? '').trim()) return 'El teléfono es obligatorio';
  const digitos = digitosTelefono(valor);
  if (digitos && !/^\d+$/.test(digitos)) return 'El teléfono solo puede contener números';
  if (!/^\d{10}$/.test(digitos)) return 'El teléfono debe tener exactamente 10 dígitos';
  return null;
};

const nombreOdontologo = (o) =>
  o.nombre_completo ?? [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' ');

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearUsuario = (u) => ({
  id: u.id_usuario,
  correo: u.correo,
  tipo: u.tipo,
  paquete: u.nombre_paquete,
  estado: u.activo ? 'Activo' : 'Inactivo',
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]); // datos crudos del backend
  const [paquetes, setPaquetes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [odontologos, setOdontologos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [erroresCampos, setErroresCampos] = useState({});
  const formularioRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await usuariosApi.listar();
      setUsuarios(comoLista(data, 'usuarios'));
    } catch (err) {
      console.error('Error al listar usuarios:', err);
      setUsuarios([]);
      setErrorCarga(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Catálogos para los selects (si alguno falla, la página sigue funcionando)
  const cargarCatalogos = useCallback(async () => {
    const [resPaquetes, resTipos, resClinicas, resOdontologos, resPacientes] = await Promise.allSettled([
      paquetesApi.listar(),
      tiposUsuarioApi.listar(),
      clinicasApi.listar(),
      odontologosApi.listar(),
      pacientesApi.listar(),
    ]);

    const aplicar = (res, setter, clave, etiqueta) => {
      if (res.status === 'fulfilled') setter(comoLista(res.value, clave));
      else console.error(`Error al cargar ${etiqueta}:`, res.reason);
    };

    aplicar(resPaquetes, setPaquetes, 'paquetes', 'paquetes');
    aplicar(resTipos, setTipos, 'tipos', 'tipos de usuario');
    aplicar(resClinicas, setClinicas, 'clinicas', 'clínicas');
    aplicar(resOdontologos, setOdontologos, 'odontologos', 'odontólogos');
    aplicar(resPacientes, setPacientes, 'pacientes', 'pacientes');
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Tipo elegido: define qué información se pide
  const tipoClave = useMemo(() => {
    const t = tipos.find((x) => String(x.id_tipo_usuario) === String(form.idtipousuario));
    return limpiar(t?.nombre);
  }, [tipos, form.idtipousuario]);

  const esOdontologo = tipoClave === 'odontologo';
  const esPaciente = tipoClave === 'paciente';
  const esClinica = tipoClave === 'clinica';
  const esPersona = esOdontologo || esPaciente; // piden datos personales
  const conPerfil = esPersona || esClinica; // tienen registro propio además de la cuenta

  // Odontólogo, paciente y clínica reciben su paquete desde la función SQL; solo admin lo elige
  const mostrarPaquete = !creando || (!conPerfil && !!tipoClave);

  // Solo activos (más el que ya tiene asignado el registro que se edita)
  const opcionesTipo = useMemo(
    () =>
      tipos.filter(
        (t) => t.activo !== false || String(t.id_tipo_usuario) === String(form.idtipousuario)
      ),
    [tipos, form.idtipousuario]
  );
  const opcionesPaquete = useMemo(
    () =>
      paquetes.filter(
        (p) => p.activo !== false || String(p.id_paquete) === String(form.idpaquete)
      ),
    [paquetes, form.idpaquete]
  );
  const opcionesClinica = useMemo(
    () => clinicas.filter((c) => c.activo !== false),
    [clinicas]
  );
  const opcionesOdontologo = useMemo(
    () => odontologos.filter((o) => o.activo !== false),
    [odontologos]
  );

  const handleChange = (campo) => (e) => {
    const valor = campo === 'telefono'
      ? limitarTelefono(e.target.value)
      : campo === 'nombre' || campo === 'ape_pat' || campo === 'ape_mat'
        ? nombrePersona(e.target.value)
        : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
  };

  const validar = () => {
    const errores = {};
    if (!form.idtipousuario) errores.idtipousuario = 'Selecciona el tipo de usuario';

    if (creando && esPersona) {
      if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio';
      if (!form.ape_pat.trim()) errores.ape_pat = 'El apellido paterno es obligatorio';
      const errTel = mensajeTelefono(form.telefono);
      if (errTel) errores.telefono = errTel;
      else {
        const ocupado = avisoTelefonoOcupado(digitosTelefono(form.telefono), { pacientes, odontologos });
        if (ocupado) errores.telefono = ocupado;
      }
      if (esOdontologo && !form.idclinica) errores.idclinica = 'La clínica es obligatoria';
    }
    if (creando && esClinica) {
      if (!form.clinica_nombre.trim()) errores.clinica_nombre = 'El nombre de la clínica es obligatorio';
      else if (form.clinica_nombre.trim().length > 150) errores.clinica_nombre = 'El nombre no puede exceder 150 caracteres';
      if (form.identificacion_fiscal.trim().length > 50) {
        errores.identificacion_fiscal = 'La identificación fiscal no puede exceder 50 caracteres';
      }
    }

    const correo = form.correo.trim();
    if (!correo) errores.correo = 'El correo es obligatorio';
    else if (correo.length > 150) errores.correo = 'El correo no puede exceder 150 caracteres';
    else if (!REGEX_CORREO.test(correo)) errores.correo = 'El correo no es válido';

    if (creando || form.contrasena || form.confirmarContrasena) {
      const errorClave = errorContrasena(form.contrasena);
      if (errorClave) errores.contrasena = errorClave;
      if (form.contrasena !== form.confirmarContrasena) errores.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    return errores;
  };

  const handleGuardar = async () => {
    const errores = validar();
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

      const correo = form.correo.trim().toLowerCase();

      if (editandoId) {
        await usuariosApi.actualizar(editandoId, {
          correo,
          idtipousuario: Number(form.idtipousuario),
          idpaquete: form.idpaquete ? Number(form.idpaquete) : null,
        });
        // La contraseña tiene su propio endpoint; solo se llama si escribió una nueva
        if (form.contrasena) {
          await usuariosApi.cambiarContrasena(editandoId, form.contrasena);
        }
      } else if (esOdontologo) {
        await odontologosApi.crear({
          nombre: mayus(form.nombre),
          ape_pat: mayus(form.ape_pat),
          ape_mat: mayus(form.ape_mat) || null,
          telefono: digitosTelefono(form.telefono),
          cedula: mayus(form.cedula) || null,
          idclinica: Number(form.idclinica),
          correo,
          contrasena: form.contrasena,
        });
      } else if (esPaciente) {
        await pacientesApi.crear({
          nombre: mayus(form.nombre),
          ape_pat: mayus(form.ape_pat),
          ape_mat: mayus(form.ape_mat) || null,
          telefono: digitosTelefono(form.telefono),
          id_odontologo: form.id_odontologo ? Number(form.id_odontologo) : null,
          correo,
          contrasena: form.contrasena,
        });
      } else if (esClinica) {
        // Crea usuario (tipo clínica) + registro de clínica
        await clinicasApi.crear({
          nombre: mayus(form.clinica_nombre),
          direccion: mayus(form.direccion) || null,
          identificacion_fiscal: mayus(form.identificacion_fiscal) || null,
          correo,
          contrasena: form.contrasena,
        });
      } else {
        console.warn('Tipo de usuario desconocido, se crea solo la cuenta:', form.idtipousuario);
        // Admin: solo la cuenta
        await usuariosApi.crear({
          correo,
          contrasena: form.contrasena,
          idtipousuario: Number(form.idtipousuario),
          idpaquete: form.idpaquete ? Number(form.idpaquete) : null,
        });
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el usuario');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const u = usuarios.find((x) => x.id_usuario === id);
    if (!u) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      ...FORM_INICIAL,
      correo: u.correo ?? '',
      idtipousuario: u.id_tipo_usuario != null ? String(u.id_tipo_usuario) : '',
      idpaquete: u.id_paquete != null ? String(u.id_paquete) : '',
    });
  };

  const handleEliminar = async (id) => {
    await usuariosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await usuariosApi.reactivar(id);
    await cargar();
  };

  // max-h + overflow: si no cabe, solo el formulario hace scroll
  const formularioUsuario = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">

      {/* El tipo define qué campos se piden después */}
      <div className={`grid grid-cols-1 gap-3 md:gap-5 ${mostrarPaquete ? 'md:grid-cols-2' : ''}`}>
          <div data-campo="idtipousuario">
            <Etiqueta requerido>Tipo de usuario:</Etiqueta>
            <select
              className={inputClass}
              value={form.idtipousuario}
              onChange={handleChange('idtipousuario')}
              disabled={!creando}
            >
              <option value="">Selecciona un tipo</option>
              {opcionesTipo.map((t) => (
                <option key={t.id_tipo_usuario} value={t.id_tipo_usuario}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {!creando && (
              <p className="mt-1 text-xs text-slate-500">
                El tipo no se puede cambiar, porque está ligado a su registro.
              </p>
            )}
            <AvisoCampo mensaje={erroresCampos.idtipousuario} />
          </div>

          {mostrarPaquete && (
            <div>
              <Etiqueta>Paquete de roles:</Etiqueta>
              <select
                className={inputClass}
                value={form.idpaquete}
                onChange={handleChange('idpaquete')}
              >
                <option value="">Sin paquete</option>
                {opcionesPaquete.map((p) => (
                  <option key={p.id_paquete} value={p.id_paquete}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
      </div>

      {/* Odontólogo y paciente: datos personales */}
      {creando && esPersona && (
        <Seccion titulo="Datos personales">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div data-campo="nombre">
              <Etiqueta requerido>Nombre(s):</Etiqueta>
              <input
                type="text"
                placeholder="Ej. LAURA"
                className={inputClass}
                value={form.nombre}
                onChange={handleChange('nombre')}
              />
              <AvisoCampo mensaje={erroresCampos.nombre} />
            </div>
            <div data-campo="telefono">
              <Etiqueta requerido>Teléfono:</Etiqueta>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ej. 6671234567"
                className={inputClass}
                value={form.telefono}
                onChange={handleChange('telefono')}
              />
              <AvisoCampo mensaje={erroresCampos.telefono} />
            </div>
            <div data-campo="ape_pat">
              <Etiqueta requerido>Apellido paterno:</Etiqueta>
              <input
                type="text"
                placeholder="Ej. GÓMEZ"
                className={inputClass}
                value={form.ape_pat}
                onChange={handleChange('ape_pat')}
              />
              <AvisoCampo mensaje={erroresCampos.ape_pat} />
            </div>
            <div>
              <Etiqueta>Apellido materno:</Etiqueta>
              <input
                type="text"
                placeholder="Ej. RÍOS"
                className={inputClass}
                value={form.ape_mat}
                onChange={handleChange('ape_mat')}
              />
            </div>
          </div>
        </Seccion>
      )}

      {/* Solo odontólogo: datos profesionales */}
      {creando && esOdontologo && (
        <Seccion titulo="Datos profesionales">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div>
              <Etiqueta>Cédula profesional:</Etiqueta>
              <input
                type="text"
                placeholder="Ej. 12345678"
                className={inputClass}
                value={form.cedula}
                onChange={handleChange('cedula')}
              />
            </div>
            <div data-campo="idclinica">
              <Etiqueta requerido>Clínica:</Etiqueta>
              <select
                className={inputClass}
                value={form.idclinica}
                onChange={handleChange('idclinica')}
              >
                <option value="">Selecciona una clínica</option>
                {opcionesClinica.map((c) => (
                  <option key={c.id_clinica} value={c.id_clinica}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <AvisoCampo mensaje={erroresCampos.idclinica} />
            </div>
          </div>
        </Seccion>
      )}

      {/* Solo paciente: asignación opcional */}
      {creando && esPaciente && (
        <Seccion titulo="Asignación">
          <div>
            <Etiqueta>Odontólogo:</Etiqueta>
            <select
              className={inputClass}
              value={form.id_odontologo}
              onChange={handleChange('id_odontologo')}
            >
              <option value="">Sin asignar</option>
              {opcionesOdontologo.map((o) => (
                <option key={o.id_odontologo} value={o.id_odontologo}>
                  {nombreOdontologo(o)}
                </option>
              ))}
            </select>
          </div>
        </Seccion>
      )}

      {/* Solo clínica: datos de la clínica */}
      {creando && esClinica && (
        <Seccion titulo="Datos de la clínica">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div data-campo="clinica_nombre">
              <Etiqueta requerido>Nombre de la clínica:</Etiqueta>
              <input
                type="text"
                maxLength={150}
                placeholder="Ej. CLÍNICA DENTAL SONRISA"
                className={inputClass}
                value={form.clinica_nombre}
                onChange={handleChange('clinica_nombre')}
              />
              <AvisoCampo mensaje={erroresCampos.clinica_nombre} />
            </div>
            <div data-campo="identificacion_fiscal">
              <Etiqueta>Identificación fiscal:</Etiqueta>
              <input
                type="text"
                maxLength={50}
                placeholder="Ej. RFC"
                className={inputClass}
                value={form.identificacion_fiscal}
                onChange={handleChange('identificacion_fiscal')}
              />
              <AvisoCampo mensaje={erroresCampos.identificacion_fiscal} />
            </div>
            <div className="md:col-span-2">
              <Etiqueta>Dirección:</Etiqueta>
              <textarea
                rows={2}
                placeholder="CALLE, NÚMERO, COLONIA, CIUDAD"
                className={`${inputClass} resize-none`}
                value={form.direccion}
                onChange={handleChange('direccion')}
              />
            </div>
          </div>
        </Seccion>
      )}

      {/* Llave de acceso: aparece al elegir un tipo */}
      {form.idtipousuario && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            <KeyRound size={14} aria-hidden="true" /> {creando ? 'Crear llave de acceso' : 'Cuenta de acceso'}
          </legend>

          <div data-campo="correo">
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              maxLength={150}
              placeholder="usuario@correo.com"
              className={inputClass}
              value={form.correo}
              onChange={handleChange('correo')}
            />
            <AvisoCampo mensaje={erroresCampos.correo} />
          </div>

          {!creando && (
            <p className="text-xs text-slate-500 md:text-sm">
              Deja las contraseñas vacías si no quieres cambiarla.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div data-campo="contrasena">
              <Etiqueta requerido={creando}>
                {creando ? 'Contraseña:' : 'Nueva contraseña:'}
              </Etiqueta>
              <div className="relative">
                <input
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crea una contraseña"
                  maxLength={72}
                  className={`${inputClass} pr-12! md:pr-12!`}
                  value={form.contrasena}
                  onChange={handleChange('contrasena')}
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
              <Etiqueta requerido={creando}>Confirmar contraseña:</Etiqueta>
              <div className="relative">
                <input
                  type={verConfirmar ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  className={`${inputClass} pr-12! md:pr-12!`}
                  value={form.confirmarContrasena}
                  onChange={handleChange('confirmarContrasena')}
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
              <AvisoCampo mensaje={erroresCampos.confirmarContrasena} />
            </div>
          </div>
        </fieldset>
      )}
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Usuarios"
      subtitulo="Gestiona las cuentas de acceso, su tipo y su paquete de roles."
      textoBotonNuevo="Agregar usuario"
      placeholderBusqueda="Buscar por correo, tipo o paquete..."
      datos={usuarios.map(mapearUsuario)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '',
        titulo: editandoId ? 'Editar Usuario' : 'Nuevo Usuario',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Usuario',
        contenido: formularioUsuario,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}