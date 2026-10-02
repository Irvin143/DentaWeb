import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { especialidadesApi } from '../../services/api.js'; // agrega especialidadesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearEspecialidad = (e) => ({
  id: e.id_especialidad,
  nombre: e.nombre,
  estado: e.activo ? 'Activo' : 'Inactivo',
});

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await especialidadesApi.listar();
      setEspecialidades(data?.especialidades ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las especialidades');
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
      };

      if (editandoId) {
        await especialidadesApi.actualizar(editandoId, payload);
      } else {
        await especialidadesApi.crear(payload);
      }

      resetFormulario();
        cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar la especialidad');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const e = especialidades.find((x) => x.id_especialidad === id);
    if (!e) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: e.nombre ?? '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await especialidadesApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar la especialidad');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await especialidadesApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar la especialidad');
    }
  };

  const formularioEspecialidad = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. Ortodoncia"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Especialidades"
      subtitulo="Gestiona las especialidades disponibles en la red médica."
      textoBotonNuevo="Agregar especialidad"
      placeholderBusqueda="Buscar por nombre..."
      datos={especialidades.map(mapearEspecialidad)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🦷',
        titulo: editandoId ? 'Editar Especialidad' : 'Nueva Especialidad',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Especialidad',
        contenido: formularioEspecialidad,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}