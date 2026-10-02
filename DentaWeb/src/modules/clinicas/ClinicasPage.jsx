import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { clinicasApi } from '../../services/api.js'; // ajusta la ruta a donde tengas tu clinicasApi

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (creando) {
      const correo = form.correo.trim();
      if (!correo) return 'El correo de acceso es obligatorio';
      if (correo.length > 150) return 'El correo no puede exceder 150 caracteres';
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
        direccion: mayus(form.direccion) || null,
        identificacion_fiscal: mayus(form.identificacion_fiscal) || null,
      };

      if (editandoId) {
        // Al editar se conserva el usuario que ya tiene; no se tocan las credenciales
        await clinicasApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        // Al crear, el backend genera el usuario (tipo clínica) con estas credenciales
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