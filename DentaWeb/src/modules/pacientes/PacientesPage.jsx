import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { pacientesApi, odontologosApi } from '../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearPaciente = (p) => ({
  id: p.id_paciente,
  nombre: p.nombre ?? '—',
  ape_pat: p.ape_pat ?? '',
  ape_mat: p.ape_mat ?? 'N/A',
  telefono: p.telefono ?? '—',
  correo: p.correo ?? '—',
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
  const [guardando, setGuardando] = useState(false);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await pacientesApi.listar();
      setPacientes(comoLista(data, 'pacientes'));
      
console.log('mapearPaciente:', pacientes);
    } catch (err) {
      console.error('Error al listar pacientes:', err);
      setPacientes([]);
      setError(err.message || 'No se pudieron cargar los pacientes');
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
    if (!form.ape_pat.trim()) return 'El apellido paterno es obligatorio';

    if (creando) {
      const correo = form.correo.trim();
      if (!correo) return 'El correo de acceso es obligatorio';
      if (!REGEX_CORREO.test(correo)) return 'El correo de acceso no es válido';
      if (form.contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (form.contrasena !== form.confirmarContrasena) return 'Las contraseñas no coinciden';
    }
    return null;
  };

  // Devuelve true si guardó bien (para que el modal pueda cerrarse)
  const handleGuardar = async () => {
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: form.telefono.trim(),
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

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    if (!p) return;
    setEditandoId(id);
    setError(null);
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
    try {
      await pacientesApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar al paciente');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await pacientesApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar al paciente');
    }
  };

  // max-h + overflow: si no cabe, solo el formulario hace scroll
  const formularioPaciente = (
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
              placeholder="Ej. María Fernanda"
              className={inputClass}
              value={form.nombre}
              onChange={handleChange('nombre')}
            />
          </div>
          <div>
            <Etiqueta>Teléfono:</Etiqueta>
            <input
              type="tel"
              placeholder="Ej. 6671234567"
              className={inputClass}
              value={form.telefono}
              onChange={handleChange('telefono')}
            />
          </div>
          <div>
            <Etiqueta requerido>Apellido paterno:</Etiqueta>
            <input
              type="text"
              placeholder="Ej. López"
              className={inputClass}
              value={form.ape_pat}
              onChange={handleChange('ape_pat')}
            />
          </div>
          <div>
            <Etiqueta>Apellido materno:</Etiqueta>
            <input
              type="text"
              placeholder="Ej. Ramírez"
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
          <legend className="px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm">
            🔑 Crear llave de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block">
            Con estos datos el paciente iniciará sesión en el sistema.
          </p>

          <div>
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              placeholder="paciente@correo.com"
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
                placeholder="Mínimo 8 caracteres"
                className={inputClass}
                value={form.contrasena}
                onChange={handleChange('contrasena')}
              />
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
        guardando,
      }}
    />
  );
}