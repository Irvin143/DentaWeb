import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { odontologosApi, clinicasApi } from '../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  idclinica: '',
  idusuario: '', // solo se conserva al editar (no se muestra)
  correo: '', // llave de acceso (solo al crear)
  contrasena: '',
  confirmarContrasena: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto ({ data: [...] }, { odontologos: [...] })
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearOdontologo = (o) => ({
  id: o.id_odontologo,
  nombre: o.nombre_completo ?? [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' '),
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

// Sección con título: el título solo se ve en desktop, en mobile queda igual que antes
const Seccion = ({ titulo, children }) => (
  <section className="flex flex-col gap-3 md:gap-5">
    <h3 className="hidden border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800 md:block">
      {titulo}
    </h3>
    {children}
  </section>
);

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState([]); // datos crudos del backend
  const [clinicas, setClinicas] = useState([]); // para el select de clínica
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
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

  // Catálogo para el select (si falla, la página sigue funcionando)
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

  // Clínicas activas (más la que ya tiene el registro que se está editando)
  const opcionesClinica = useMemo(
    () => clinicas.filter((c) => c.activo || String(c.id_clinica) === String(form.idclinica)),
    [clinicas, form.idclinica]
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
      if (!form.idclinica) return 'La clínica es obligatoria';

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
        // Normaliza a mayúsculas lo que se manda al backend
        const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

        const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: form.telefono.trim(),
        cedula: mayus(form.cedula),
        idclinica: form.idclinica ? Number(form.idclinica) : null,
        };

      if (editandoId) {
        // Al editar se conserva el usuario que ya tiene; no se tocan las credenciales
        await odontologosApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        // Al crear, el backend genera el usuario con estas credenciales
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

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const o = odontologos.find((x) => x.id_odontologo === id);
    if (!o) return;
    setEditandoId(id);
    setError(null);
    setForm({
      ...FORM_INICIAL,
      nombre: o.nombre ?? '',
      ape_pat: o.ape_pat ?? '',
      ape_mat: o.ape_mat ?? '',
      telefono: o.telefono ?? '',
      cedula: o.cedula ?? '',
      idclinica: o.id_clinica != null ? String(o.id_clinica) : '',
      idusuario: o.id_usuario != null ? String(o.id_usuario) : '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este odontólogo?')) return;
    try {
      await odontologosApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar el odontólogo');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este odontólogo?')) return;
    try {
      await odontologosApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar el odontólogo');
    }
  };

  // max-h + overflow: si no cabe, solo el formulario hace scroll
  const formularioOdontologo = (
    <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 md:rounded-xl md:p-3 md:text-sm">
          {error}
        </p>
      )}

      {/* Datos personales */}
      <Seccion titulo="Datos personales" >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div>
            <Etiqueta requerido>Nombre(s):</Etiqueta>
            <input
              type="text"
              placeholder="Ej. Laura"
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
              placeholder="Ej. Gómez"
              className={inputClass}
              value={form.ape_pat}
              onChange={handleChange('ape_pat')}
            />
          </div>
          <div>
            <Etiqueta>Apellido materno:</Etiqueta>
            <input
              type="text"
              placeholder="Ej. Ríos"
              className={inputClass}
              value={form.ape_mat}
              onChange={handleChange('ape_mat')}
            />
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
              placeholder="Ej. 12345678"
              className={inputClass}
              value={form.cedula}
              onChange={handleChange('cedula')}
            />
          </div>
          <div>
            <Etiqueta requerido={creando}>Clínica:</Etiqueta>
            <select className={inputClass} value={form.idclinica} onChange={handleChange('idclinica')}>
              <option value="">{creando ? 'Selecciona una clínica' : 'Sin clínica'}</option>
              {opcionesClinica.map((c) => (
                <option key={c.id_clinica} value={c.id_clinica}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Seccion>

      {/* Llave de acceso: solo al crear, genera el usuario del odontólogo */}
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
              placeholder="odontologo@correo.com"
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