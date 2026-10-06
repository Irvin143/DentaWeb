import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, EyeOff, KeyRound, Users } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChecklistContrasena, errorContrasena } from '../../components/ChecklistContrasena';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { avisoTelefonoOcupado } from '../../utils/telefonoCompartido';
import { pacientesApi, odontologosApi } from '../../services/api.js';
import { CampoContrasena } from '../../utils/utils.jsx'; // ajusta la ruta


// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
const nombrePersona = (valor) =>
  String(valor ?? '').replace(LIMPIAR_NOMBRE, '').toLocaleUpperCase('es-MX');

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  id_odontologo: '',
  correo: '', // llave de acceso al crear; al editar solo se conserva
  contrasena: '',
  confirmarContrasena: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto ({ data: [...] }, { pacientes: [...] })
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Normaliza a mayúsculas lo que se manda al backend
const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const limitarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 10);
const digitosTelefono = (valor) => String(valor ?? '').replace(/\D/g, '');

const mensajeTelefono = (valor) => {
  if (!String(valor ?? '').trim()) return 'El teléfono es obligatorio';
  const digitos = digitosTelefono(valor);
  if (digitos && !/^\d+$/.test(digitos)) return 'El teléfono solo puede contener números';
  if (!/^\d{10}$/.test(digitos)) return 'El teléfono debe tener exactamente 10 dígitos';
  return null;
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearPaciente = (p) => ({
  id: p.id_paciente,
  nombre: p.nombre,
  ape_pat: p.ape_pat,
  ape_mat: p.ape_mat,
  telefono: p.telefono,
  correo: p.correo,
  odontologo: p.nombre_odontologo,
  estado: p.activo ? 'Activo' : 'Inactivo',
});

const nombreOdontologo = (o) =>
  o.nombre_completo ?? [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' ');

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

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]); // datos crudos del backend
  const [odontologos, setOdontologos] = useState([]); // para el select de odontólogo
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const formularioRef = useRef(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await pacientesApi.listar();
      setPacientes(comoLista(data, 'pacientes'));
      
console.log('mapearPaciente:', pacientes);
    } catch (err) {
      console.error('Error al listar pacientes:', err);
      setPacientes([]);
      setErrorCarga(err.message || 'No se pudieron cargar los pacientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Catálogo para el select (si falla, la página sigue funcionando)
  const cargarCatalogos = useCallback(async () => {
    const [resOdontologos] = await Promise.allSettled([odontologosApi.listar()]);

    if (resOdontologos.status === 'fulfilled') {
      setOdontologos(comoLista(resOdontologos.value, 'odontologos'));
    } else {
      console.error('Error al cargar odontólogos:', resOdontologos.reason);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Odontólogos activos (más el que ya tiene asignado el paciente que se edita)
  const opcionesOdontologo = useMemo(
    () =>
      odontologos.filter(
        (o) => o.activo || String(o.id_odontologo) === String(form.id_odontologo)
      ),
    [odontologos, form.id_odontologo]
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
    if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio';
    if (!form.ape_pat.trim()) errores.ape_pat = 'El apellido paterno es obligatorio';

    const errTel = mensajeTelefono(form.telefono);
    if (errTel) errores.telefono = errTel;
    else {
      const ocupado = avisoTelefonoOcupado(digitosTelefono(form.telefono), {
        pacientes,
        odontologos,
        idPaciente: editandoId,
      });
      if (ocupado) errores.telefono = ocupado;
    }

    if (creando) {
      const correo = form.correo.trim();
      if (!correo) errores.correo = 'El correo de acceso es obligatorio';
      else if (!REGEX_CORREO.test(correo)) errores.correo = 'El correo de acceso no es válido';
      const errorClave = errorContrasena(form.contrasena);
      if (errorClave) errores.contrasena = errorClave;
      if (form.contrasena !== form.confirmarContrasena) errores.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    return errores;
  };

  const rechazarCampos = (errores) => {
    setErroresCampos(errores);
    setError(null);
    requestAnimationFrame(() => scrollAlPrimerCampo(formularioRef.current, errores));
    return false;
  };

  // Devuelve true si guardó bien (para que el modal pueda cerrarse)
  const handleGuardar = async () => {
    const errores = validar();
    if (Object.keys(errores).length > 0) return rechazarCampos(errores);

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: String(form.telefono).trim() ? digitosTelefono(form.telefono) : '',
        id_odontologo: form.id_odontologo ? Number(form.id_odontologo) : null,
      };

      if (editandoId) {
        // Al editar no se tocan las credenciales; se conserva el correo que ya tiene
        await pacientesApi.actualizar(editandoId, { ...datosBase, correo: form.correo });
      } else {
        // Al crear, el backend genera el usuario (tipo paciente) con estas credenciales
        await pacientesApi.crear({
          ...datosBase,
          correo: form.correo.trim().toLowerCase(),
          contrasena: form.contrasena,
        });
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el paciente');
      return false;
    } finally {
      setGuardando(false);
    }
  };
    const handleBorrar = async (id) => {
        await pacientesApi.borrar(id);
        await cargar();
    };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    if (!p) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      ...FORM_INICIAL,
      nombre: p.nombre ?? '',
      ape_pat: p.ape_pat ?? '',
      ape_mat: p.ape_mat ?? '',
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      id_odontologo: p.id_odontologo != null ? String(p.id_odontologo) : '',
    });
  };

  const handleEliminar = async (id) => {
    await pacientesApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await pacientesApi.reactivar(id);
    await cargar();
  };

    const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  // max-h + overflow: si no cabe, solo el formulario hace scroll
  const formularioPaciente = (
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
              placeholder="Ej. MARÍA FERNANDA"
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
              placeholder="Ej. LÓPEZ"
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
              placeholder="Ej. RAMÍREZ"
              className={inputClass}
              value={form.ape_mat}
              onChange={handleChange('ape_mat')}
            />
          </div>
        </div>
      </Seccion>

      {/* Asignación (opcional) */}
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

      {/* Llave de acceso: solo al crear, genera el usuario del paciente */}
      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2">
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            <KeyRound size={14} aria-hidden="true" /> Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos el paciente iniciará sesión en el sistema.
          </p>

          <div data-campo="correo">
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              placeholder="paciente@correo.com"
              className={inputClass}
              value={form.correo}
              onChange={handleChange('correo')}
            />
            <AvisoCampo mensaje={erroresCampos.correo} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div>
              <Etiqueta requerido>Contraseña:</Etiqueta>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                maxLength={72}
                className={inputClass}
                value={form.contrasena}
                onChange={handleChange('contrasena')}
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
              />
            </div>
          </div>
        </fieldset>
      )}
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Pacientes"
      subtitulo="Gestiona el registro de pacientes de la red médica."
      textoBotonNuevo="Agregar paciente"
      placeholderBusqueda="Buscar por nombre, teléfono o correo..."
      datos={pacientes.map(mapearPaciente)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      onBorrar={handleBorrar}
      modal={{
        icono: <Users />,
        titulo: editandoId ? 'Editar Paciente' : 'Nuevo Paciente',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Paciente',
        contenido: formularioPaciente,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}