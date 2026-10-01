import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { consultoriosApi, clinicasApi } from '../../services/api.js'; // agrega consultoriosApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  id_clinica: '',
};

export default function ConsultoriosPage() {
  const [consultorios, setConsultorios] = useState([]); // datos crudos del backend
  const [clinicas, setClinicas] = useState([]); // para el select
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [dataConsultorios, dataClinicas] = await Promise.all([
        consultoriosApi.listar(),
        clinicasApi.listar(),
      ]);
      setConsultorios(
        dataConsultorios?.consultorios ?? (Array.isArray(dataConsultorios) ? dataConsultorios : [])
      );
      setClinicas(
        dataClinicas?.clinicas ?? (Array.isArray(dataClinicas) ? dataClinicas : [])
      );
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los consultorios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Convierte lo que devuelve el backend a lo que muestra la tabla
  const mapearConsultorio = (c) => {
    const clinica = clinicas.find((x) => x.id_clinica === c.id_clinica);
    return {
      id: c.id_consultorio,
      nombre: c.nombre,
      clinica: c.id_clinica ? (c.nombre_clinica ?? clinica?.nombre ?? '—') : 'Sin asignar',
      estado: c.activo ? 'Activo' : 'Inactivo',
    };
  };

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
        id_clinica: form.id_clinica ? Number(form.id_clinica) : null,
      };

      if (editandoId) {
        await consultoriosApi.actualizar(editandoId, payload);
      } else {
        await consultoriosApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el consultorio');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const c = consultorios.find((x) => x.id_consultorio === id);
    if (!c) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: c.nombre ?? '',
      id_clinica: c.id_clinica ? String(c.id_clinica) : '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este consultorio?')) return;
    try {
      await consultoriosApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar el consultorio');
    }
  };

  const formularioConsultorio = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. Consultorio 1"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Clínica:</label>
        <select
          className={inputClass}
          value={form.id_clinica}
          onChange={handleChange('id_clinica')}
        >
          <option value="">Sin asignar</option>
          {clinicas.map((c) => (
            <option key={c.id_clinica} value={c.id_clinica}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Consultorios"
      subtitulo="Gestiona los consultorios de cada clínica."
      textoBotonNuevo="Agregar consultorio"
      placeholderBusqueda="Buscar por nombre o clínica..."
      datos={consultorios.map(mapearConsultorio)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      modal={{
        icono: '🏥',
        titulo: editandoId ? 'Editar Consultorio' : 'Nuevo Consultorio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Consultorio',
        contenido: formularioConsultorio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}