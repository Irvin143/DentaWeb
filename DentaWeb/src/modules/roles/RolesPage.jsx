import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { rolesApi } from '../../services/api.js'; // agrega rolesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearRol = (r) => ({
  id: r.id_rol,
  nombre: r.nombre,
  descripcion: r.descripcion || '—',
  estado: r.activo ? 'Activo' : 'Inactivo',
});

export default function RolesPage() {
  const [roles, setRoles] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await rolesApi.listar();
      setRoles(data?.roles ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los roles');
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

  // Devuelve true si guardó bien (para que el modal pueda cerrarse)
  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (form.nombre.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
      };

      if (editandoId) {
        await rolesApi.actualizar(editandoId, payload);
      } else {
        await rolesApi.crear(payload);
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el rol');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const r = roles.find((x) => x.id_rol === id);
    if (!r) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: r.nombre ?? '',
      descripcion: r.descripcion ?? '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await rolesApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar el rol');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await rolesApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar el rol');
    }
  };

  const formularioRol = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. Administrador"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
        <textarea
          rows={4}
          placeholder="Describe las funciones del rol (opcional)"
          className={`${inputClass} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Roles"
      subtitulo="Gestiona los roles de usuario del sistema."
      textoBotonNuevo="Agregar rol"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={roles.map(mapearRol)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Shield />,
        titulo: editandoId ? 'Editar Rol' : 'Nuevo Rol',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Rol',
        contenido: formularioRol,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}