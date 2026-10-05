import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarClock } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage.jsx';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { tiposCitaApi } from '../../services/api.js'; // agrega tiposCitaApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearTipoCita = (t) => ({
  id: t.id_tipo,
  nombre: t.nombre,
  estado: t.activo ? 'Activo' : 'Inactivo',
});

export default function TiposCitaPage() {
  const [tipos, setTipos] = useState([]); // datos crudos del backend
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
      const data = await tiposCitaApi.listar();
      setTipos(data?.tipos ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los tipos de cita.');
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
      };

      if (editandoId) {
        await tiposCitaApi.actualizar(editandoId, payload);
      } else {
        await tiposCitaApi.crear(payload);
      }

      resetFormulario();
       cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el tipo de cita');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Carga los datos de la fila en el formulario antes de abrir el modal
  const handleEditar = (id) => {
    const t = tipos.find((x) => x.id_tipo === id);
    if (!t) return;
    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setForm({
      nombre: (t.nombre ?? '').toLocaleUpperCase('es-MX'),
    });
  };

  const handleEliminar = async (id) => {
    await tiposCitaApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await tiposCitaApi.reactivar(id);
    await cargar();
  };

  const formularioTipoCita = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex flex-col gap-4">
      <div data-campo="nombre">
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. PRIMERA CONSULTA"
          className={inputClass}
          value={form.nombre}
          onChange={handleChange('nombre')}
        />
        <AvisoCampo mensaje={erroresCampos.nombre} />
      </div>
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Tipos de cita"
      subtitulo="Gestiona los tipos de cita que se pueden agendar."
      textoBotonNuevo="Agregar tipo de cita"
      placeholderBusqueda="Buscar por nombre..."
      datos={tipos.map(mapearTipoCita)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <CalendarClock />,
        titulo: editandoId ? 'Editar Tipo de cita' : 'Nuevo Tipo de cita',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Tipo de cita',
        contenido: formularioTipoCita,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}