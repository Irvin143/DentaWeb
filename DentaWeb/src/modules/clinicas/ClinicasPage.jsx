import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { clinicasApi } from '../../services/api.js'; // ajusta la ruta a donde tengas tu clinicasApi

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = { nombre: '', direccion: '', identificacion_fiscal: '' };

// TODO: toma el id del usuario logueado (contexto de auth, token, etc.)
const ID_USUARIO = 1;

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearClinica = (c) => ({
  id: c.id_clinica,
  nombre: c.nombre,
  direccion: c.direccion ?? '—',
  identificacion_fiscal: c.identificacion_fiscal ?? '—',
  correo_usuario: c.correo_usuario ?? 'Sin correo', 
  estado: c.activo ? 'Activa' : 'Inactiva'
});

export default function ClinicasPage() {
  const [clinicas, setClinicas] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await clinicasApi.listar();
      setClinicas(data);
    } catch (err) {
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

  // Devuelve true si guardó bien (para que el modal pueda cerrarse)
  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const payload = {
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        identificacion_fiscal: form.identificacion_fiscal.trim(),
        idusuario: ID_USUARIO,
      };

      if (editandoId) {
        await clinicasApi.actualizar(editandoId, payload);
      } else {
        await clinicasApi.crear(payload);
      }

      resetFormulario();
      await cargar();
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
      nombre: c.nombre ?? '',
      direccion: c.direccion ?? '',
      identificacion_fiscal: c.identificacion_fiscal ?? '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta clínica?')) return;
    try {
      await clinicasApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar la clínica');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar esta clínica?')) return;
    try {
      await clinicasApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar la clínica');
    }
  };

  const formularioClinica = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de la clínica:</label>
        <input
          type="text"
          placeholder="Ej. Clínica Centro"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Dirección completa:</label>
        <input
          type="text"
          placeholder="Calle, Número, Ciudad"
          className={inputClass}
          value={form.direccion}
          onChange={handleChange('direccion')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Identificación fiscal:</label>
        <input
          type="text"
          placeholder="RFC / NIT / RUC"
          className={inputClass}
          value={form.identificacion_fiscal}
          onChange={handleChange('identificacion_fiscal')}
        />
      </div>
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
      }}
    />
  );
}