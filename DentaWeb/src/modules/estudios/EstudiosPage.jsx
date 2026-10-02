import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { estudiosApi } from '../../services/api.js'; // agrega estudiosApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearEstudio = (e) => ({
  id: e.id_estudio,
  nombre: e.nombre,
  descripcion: e.descripcion || '—',
  estado: e.activo ? 'Activo' : 'Inactivo',
});

export default function EstudiosPage() {
  const [estudios, setEstudios] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await estudiosApi.listar();
      setEstudios(data?.estudios ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los estudios');
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
        await estudiosApi.actualizar(editandoId, payload);
      } else {
        await estudiosApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el estudio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const e = estudios.find((x) => x.id_estudio === id);
    if (!e) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: e.nombre ?? '',
      descripcion: e.descripcion ?? '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este estudio? Podrás reactivarlo después.')) return;
    try {
      await estudiosApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al desactivar el estudio');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este estudio?')) return;
    try {
      await estudiosApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar el estudio');
    }
  };

  const formularioEstudio = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. Radiografía panorámica"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
        <textarea
          rows={4}
          placeholder="Describe en qué consiste el estudio (opcional)"
          className={`${inputClass} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Estudios"
      subtitulo="Gestiona los estudios clínicos disponibles en la red médica."
      textoBotonNuevo="Agregar estudio"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={estudios.map(mapearEstudio)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🔬',
        titulo: editandoId ? 'Editar Estudio' : 'Nuevo Estudio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Estudio',
        contenido: formularioEstudio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}