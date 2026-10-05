import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { rolesApi } from '../../services/api.js'; // agrega rolesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearRol = (r) => ({
  id: r.id_rol,
  nombre: r.nombre,
  descripcion: r.descripcion,
  estado: r.activo ? 'Activo' : 'Inactivo',
});

export default function RolesPage() {
  const [roles, setRoles] = useState([]); // datos crudos del backend
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const formularioRef = useRef(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await rolesApi.listar();
      setRoles(data?.roles ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los roles.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleChange = (campo) => (e) =>
    setForm((prev) => ({
      ...prev,
      [campo]: e.target.value.toLocaleUpperCase('es-MX'),
    }));

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
  };

  const handleGuardar = async () => {
    const errores = {};
    if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length > 50) errores.nombre = 'El nombre no puede exceder 50 caracteres';
    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError(null);
      requestAnimationFrame(() => scrollAlPrimerCampo(formularioRef.current, errores));
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const payload = {
        nombre: mayus(form.nombre),
        descripcion: form.descripcion.trim() ? mayus(form.descripcion) : null,
      };

      if (editandoId) {
        await rolesApi.actualizar(editandoId, payload);
      } else {
        await rolesApi.crear(payload);
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el rol');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const r = roles.find((x) => x.id_rol === id);
    if (!r) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (r.nombre ?? '').toLocaleUpperCase('es-MX'),
      descripcion: (r.descripcion ?? '').toLocaleUpperCase('es-MX'),
    });
  };

  const handleEliminar = async (id) => {
    await rolesApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await rolesApi.reactivar(id);
    await cargar();
  };

  const formularioRol = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex flex-col gap-4">
      <div data-campo="nombre">
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. ADMINISTRADOR"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
        <AvisoCampo mensaje={erroresCampos.nombre} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descripción:</label>
        <textarea
          rows={4}
          placeholder="Describe las funciones del rol (opcional)"
          className={`${inputClass} resize-none`}
          value={form.descripcion}
          onChange={handleChange('descripcion')}
        />
      </div>
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Roles"
      subtitulo="Gestiona los roles de usuario del sistema."
      textoBotonNuevo="Agregar rol"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={roles.map(mapearRol)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Shield />,
        titulo: editandoId ? 'Editar Rol' : 'Nuevo Rol',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Rol',
        contenido: formularioRol,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}