import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { serviciosApi } from '../../services/api.js'; // agrega serviciosApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearServicio = (s) => ({
  id: s.id_servicio,
  nombre: s.nombre,
  descripcion: s.descripcion || '—',
  estado: s.activo ? 'Activo' : 'Inactivo',
});

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await serviciosApi.listar();
      setServicios(data?.servicios ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los servicios');
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
    if (form.nombre.trim().length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
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
        await serviciosApi.actualizar(editandoId, payload);
      } else {
        await serviciosApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el servicio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const s = servicios.find((x) => x.id_servicio === id);
    if (!s) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: s.nombre ?? '',
      descripcion: s.descripcion ?? '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este servicio? Podrás reactivarlo después.')) return;
    try {
      await serviciosApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al desactivar el servicio');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este servicio?')) return;
    try {
      await serviciosApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar el servicio');
    }
  };

  const formularioServicio = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. Limpieza dental"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
        <textarea
          rows={4}
          placeholder="Describe en qué consiste el servicio (opcional)"
          className={`${inputClass} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Servicios"
      subtitulo="Gestiona los servicios que ofrece la red médica."
      textoBotonNuevo="Agregar servicio"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={servicios.map(mapearServicio)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🩺',
        titulo: editandoId ? 'Editar Servicio' : 'Nuevo Servicio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Servicio',
        contenido: formularioServicio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}