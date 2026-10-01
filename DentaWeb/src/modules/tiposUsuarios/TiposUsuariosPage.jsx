import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage.jsx';
import { tiposUsuarioApi } from '../../services/api.js'; // agrega tiposUsuarioApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearTipoUsuario = (t) => ({
  id: t.id_tipo_usuario,
  nombre: t.nombre,
  estado: t.activo ? 'Activo' : 'Inactivo',
});

export default function TiposUsuarioPage() {
  const [tipos, setTipos] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await tiposUsuarioApi.listar();
      setTipos(data?.tipos ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tipos de usuario');
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
      };

      if (editandoId) {
        await tiposUsuarioApi.actualizar(editandoId, payload);
      } else {
        await tiposUsuarioApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el tipo de usuario');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const t = tipos.find((x) => x.id_tipo_usuario === id);
    if (!t) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: t.nombre ?? '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este tipo de usuario?')) return;
    try {
      await tiposUsuarioApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar el tipo de usuario');
    }
  };

  const formularioTipoUsuario = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. odontologo"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Tipos de usuario"
      subtitulo="Gestiona los tipos de usuario del sistema."
      textoBotonNuevo="Agregar tipo de usuario"
      placeholderBusqueda="Buscar por nombre..."
      datos={tipos.map(mapearTipoUsuario)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      modal={{
        icono: '👤',
        titulo: editandoId ? 'Editar Tipo de Usuario' : 'Nuevo Tipo de Usuario',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Tipo de Usuario',
        contenido: formularioTipoUsuario,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}