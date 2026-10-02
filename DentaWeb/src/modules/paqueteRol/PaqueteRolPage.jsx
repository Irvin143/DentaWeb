import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { paquetesApi } from '../../services/api.js'; // agrega paquetesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearPaquete = (p) => ({
  id: p.id_paquete,
  nombre: p.nombre,
  descripcion: p.descripcion || '—',
  estado: p.activo ? 'Activo' : 'Inactivo',
});

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await paquetesApi.listar();
      console.log('Paquetes cargados:', data);
      setPaquetes(data?.paquetes ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los paquetes');
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
        await paquetesApi.actualizar(editandoId, payload);
      } else {
        await paquetesApi.crear(payload);
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el paquete');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const p = paquetes.find((x) => x.id_paquete === id);
    if (!p) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: p.nombre ?? '',
      descripcion: p.descripcion ?? '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await paquetesApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar el paquete');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await paquetesApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar el paquete');
    }
  };

  const formularioPaquete = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. Paquete de limpieza dental"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
        <textarea
          rows={4}
          placeholder="Describe qué incluye el paquete (opcional)"
          className={`${inputClass} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Paquetes"
      subtitulo="Gestiona los paquetes de servicios de la red médica."
      textoBotonNuevo="Agregar paquete"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={paquetes.map(mapearPaquete)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '📦',
        titulo: editandoId ? 'Editar Paquete' : 'Nuevo Paquete',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Paquete',
        contenido: formularioPaquete,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}