import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BriefcaseMedical } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { serviciosApi, clinicasApi } from '../../services/api.js'; // agrega serviciosApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  idclinica: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto
const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearServicio = (s) => ({
  id: s.id_servicio,
  nombre: s.nombre,
  descripcion: s.descripcion,
  clinica: s.nombre_clinica,
  estado: s.activo ? 'Activo' : 'Inactivo',
});

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([]); // datos crudos del backend
  const [clinicas, setClinicas] = useState([]); // para el select de clínica
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await serviciosApi.listar();
      console.log('Servicios cargados:', data);
      setServicios(comoLista(data, 'servicios'));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los servicios');
    } finally {
      setCargando(false);
    }
  }, []);

  // Catálogo para el select (si falla, la página sigue funcionando)
  const cargarCatalogos = useCallback(async () => {
    const [resClinicas] = await Promise.allSettled([clinicasApi.listar()]);
    if (resClinicas.status === 'fulfilled') {
      setClinicas(comoLista(resClinicas.value, 'clinicas'));
    } else {
      console.error('Error al cargar clínicas:', resClinicas.reason);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Clínicas activas (más la que ya tiene el servicio que se está editando)
  const opcionesClinica = useMemo(
    () =>
      clinicas.filter(
        (c) => c.activo !== false || String(c.id_clinica) === String(form.idclinica)
      ),
    [clinicas, form.idclinica]
  );

  const handleChange = (campo) => (e) => {
    const valor =
      campo === 'nombre' || campo === 'descripcion'
        ? e.target.value.toLocaleUpperCase('es-MX')
        : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

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
    if (!form.idclinica) {
      setError('La clínica es obligatoria');
      return false;
    }

    try {
      setGuardando(true);
      setError(null);

      const payload = {
        nombre: mayus(form.nombre),
        descripcion: form.descripcion.trim() ? mayus(form.descripcion) : null,
        idclinica: Number(form.idclinica),
      };
      console.log('Payload a enviar:', payload);
      if (editandoId) {
        await serviciosApi.actualizar(editandoId, payload);
      } else {
        await serviciosApi.crear(payload);
      }

      resetFormulario();
       cargar();
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
      nombre: (s.nombre ?? '').toLocaleUpperCase('es-MX'),
      descripcion: (s.descripcion ?? '').toLocaleUpperCase('es-MX'),
      idclinica: s.id_clinica != null ? String(s.id_clinica) : '',
    });
  };

  const handleEliminar = async (id) => {
    try {
      await serviciosApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al desactivar el servicio');
    }
  };

  const handleReactivar = async (id) => {
    try {
      await serviciosApi.reactivar(id);
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al reactivar el servicio');
    }
  };

  const formularioServicio = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Clínica:<span className="ml-0.5 text-red-500">*</span>
        </label>
        <select
          className={inputClass}
          value={form.idclinica}
          onChange={handleChange('idclinica')}
        >
          <option value="">Selecciona una clínica</option>
          {opcionesClinica.map((c) => (
            <option key={c.id_clinica} value={c.id_clinica}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre:<span className="ml-0.5 text-red-500">*</span>
        </label>
        <input
          type="text"
          maxLength={100}
          placeholder="Ej. LIMPIEZA DENTAL"
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
      subtitulo="Gestiona los servicios que ofrece cada clínica."
      textoBotonNuevo="Agregar servicio"
      placeholderBusqueda="Buscar por nombre, descripción o clínica..."
      datos={servicios.map(mapearServicio)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <BriefcaseMedical />,
        titulo: editandoId ? 'Editar Servicio' : 'Nuevo Servicio',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Servicio',
        contenido: formularioServicio,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}