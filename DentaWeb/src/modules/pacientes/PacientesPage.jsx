import React, { useState, useEffect, useCallback } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { pacientesApi } from '../../services/api.js'; // agrega pacientesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  correo: ''
};

// '1990-05-12' o '1990-05-12T00:00:00.000Z' -> '12/05/1990'
const formatearFecha = (valor) => {
  if (!valor) return '—';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearPaciente = (p) => ({
  id: p.id_paciente,
  nombre: p.nombre_completo ?? [p.nombre, p.ape_pat, p.ape_mat].filter(Boolean).join(' '),
  telefono: p.telefono ?? '—',
  correo: p.correo ?? '—',
  odontologo: p.id_odontologo ? p.nombre_odontologo : 'Sin asignar',
  estado: p.activo ? 'Activo' : 'Inactivo',
});

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await pacientesApi.listar();
        setPacientes(data?.pacientes ?? (Array.isArray(data) ? data : []));
      console.log('Pacientes cargados:', data); // Depuración
     
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pacientes');
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
    if (!form.ape_pat.trim()) {
      setError('El apellido paterno es obligatorio');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const payload = {
        nombre: form.nombre.trim(),
        ape_pat: form.ape_pat.trim(),
        ape_mat: form.ape_mat.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        id_odontologo: null // Se puede cambiar si se implementa la asignación de odontólogo
      };

      if (editandoId) {
        await pacientesApi.actualizar(editandoId, payload);
      } else {
        await pacientesApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el paciente');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    if (!p) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: p.nombre ?? '',
      ape_pat: p.ape_pat ?? '',
      ape_mat: p.ape_mat ?? '',
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      fecha_nacimiento: p.fecha_nacimiento ? String(p.fecha_nacimiento).slice(0, 10) : '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este paciente? Podrás reactivarlo después.')) return;
    try {
      await pacientesApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al desactivar el paciente');
    }
  };

  const handleReactivar = async (id) => {
    if (!window.confirm('¿Seguro que deseas reactivar este paciente?')) return;
    try {
      await pacientesApi.reactivar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al reactivar el paciente');
    }
  };

  const formularioPaciente = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre(s):</label>
        <input
          type="text"
          placeholder="Ej. María Fernanda"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apellido paterno:</label>
          <input
            type="text"
            placeholder="Ej. López"
            className={inputClass}
            value={form.ape_pat}
            onChange={handleChange('ape_pat')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apellido materno:</label>
          <input
            type="text"
            placeholder="Ej. Ramírez"
            className={inputClass}
            value={form.ape_mat}
            onChange={handleChange('ape_mat')}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono:</label>
          <input
            type="tel"
            placeholder="Ej. 6671234567"
            className={inputClass}
            value={form.telefono}
            onChange={handleChange('telefono')}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Correo electrónico:</label>
        <input
          type="email"
          placeholder="paciente@correo.com"
          className={inputClass}
          value={form.correo}
          onChange={handleChange('correo')}
        />
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Pacientes"
      subtitulo="Gestiona el registro de pacientes de la red médica."
      textoBotonNuevo="Agregar paciente"
      placeholderBusqueda="Buscar por nombre, teléfono o correo..."
      datos={pacientes.map(mapearPaciente)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: '🧑‍⚕️',
        titulo: editandoId ? 'Editar Paciente' : 'Nuevo Paciente',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Paciente',
        contenido: formularioPaciente,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}