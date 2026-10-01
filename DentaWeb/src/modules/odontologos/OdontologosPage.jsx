import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { odontologosApi, clinicasApi, usuariosApi } from '../../services/api.js'; // agrega odontologosApi y usuariosApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  idusuario: '',
  idclinica: '',
};

// Acepta un arreglo directo o la lista envuelta en un objeto ({ data: [...] }, { odontologos: [...] })
const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearOdontologo = (o) => ({
  id: o.id_odontologo,
  nombre: o.nombre_completo ?? [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' '),
  cedula: o.cedula ?? '—',
  telefono: o.telefono ?? '—',
  correo_usuario: o.correo_usuario ?? 'Sin usuario',
  clinica: o.nombre_clinica ?? 'Sin clínica',
  estado: o.activo ? 'Activo' : 'Inactivo',
});

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState([]); // datos crudos del backend
  const [clinicas, setClinicas] = useState([]); // para el select de clínica
  const [usuarios, setUsuarios] = useState([]); // para el select de usuario
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await odontologosApi.listar();
      setOdontologos(comoLista(data, 'odontologos'));
    } catch (err) {
      console.error('Error al listar odontólogos:', err);
      setOdontologos([]);
      setError(err.message || 'No se pudieron cargar los odontólogos');
    } finally {
      setCargando(false);
    }
  }, []);

  // Catálogos para los selects (si fallan, la página sigue funcionando)
  const cargarCatalogos = useCallback(async () => {
  const [resClinicas] = await Promise.allSettled([
    clinicasApi.listar(),
    ]);
    console.log('Clinicas cargadas:', resClinicas);

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

  // Clínicas activas (más la que ya tiene el registro que se está editando)
  const opcionesClinica = useMemo(
    () => clinicas.filter((c) => c.activo || String(c.id_clinica) === String(form.idclinica)),
    [clinicas, form.idclinica]
  );

  // Usuarios activos que no estén asignados a otro odontólogo
  const opcionesUsuario = useMemo(() => {
    const ocupados = new Set(
      odontologos
        .filter((o) => o.id_odontologo !== editandoId && o.id_usuario != null)
        .map((o) => String(o.id_usuario))
    );
    return usuarios.filter(
      (u) =>
        String(u.id_usuario) === String(form.idusuario) ||
        (u.activo && !ocupados.has(String(u.id_usuario)))
    );
  }, [usuarios, odontologos, editandoId, form.idusuario]);

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
        cedula: form.cedula.trim(),
        idusuario: form.idusuario ? Number(form.idusuario) : null,
        idclinica: form.idclinica ? Number(form.idclinica) : null,
      };

      if (editandoId) {
        await odontologosApi.actualizar(editandoId, payload);
      } else {
        await odontologosApi.crear(payload);
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el odontólogo');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const o = odontologos.find((x) => x.id_odontologo === id);
    if (!o) return;
    setEditandoId(id);
    setError(null);
    setForm({
      nombre: o.nombre ?? '',
      ape_pat: o.ape_pat ?? '',
      ape_mat: o.ape_mat ?? '',
      telefono: o.telefono ?? '',
      cedula: o.cedula ?? '',
      idusuario: o.id_usuario != null ? String(o.id_usuario) : '',
      idclinica: o.id_clinica != null ? String(o.id_clinica) : '',
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este odontólogo?')) return;
    try {
      await odontologosApi.eliminar(id);
      await cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar el odontólogo');
    }
  };

  const formularioOdontologo = (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre(s):</label>
        <input
          type="text"
          placeholder="Ej. Laura"
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
            placeholder="Ej. Gómez"
            className={inputClass}
            value={form.ape_pat}
            onChange={handleChange('ape_pat')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apellido materno:</label>
          <input
            type="text"
            placeholder="Ej. Ríos"
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cédula profesional:</label>
          <input
            type="text"
            placeholder="Ej. 12345678"
            className={inputClass}
            value={form.cedula}
            onChange={handleChange('cedula')}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Clínica:</label>
        <select className={inputClass} value={form.idclinica} onChange={handleChange('idclinica')}>
          <option value="">Sin clínica</option>
          {opcionesClinica.map((c) => (
            <option key={c.id_clinica} value={c.id_clinica}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Usuario (correo):</label>
        <select className={inputClass} value={form.idusuario} onChange={handleChange('idusuario')}>
          <option value="">Sin usuario</option>
          {opcionesUsuario.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.correo}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <CatalogoPage
      titulo="Odontólogos"
      subtitulo="Gestiona el personal odontológico y su clínica asignada."
      textoBotonNuevo="Agregar odontólogo"
      placeholderBusqueda="Buscar por nombre, cédula, correo o clínica..."
      datos={odontologos.map(mapearOdontologo)}
      cargando={cargando}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      modal={{
        icono: '🦷',
        titulo: editandoId ? 'Editar Odontólogo' : 'Nuevo Odontólogo',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Odontólogo',
        contenido: formularioOdontologo,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}