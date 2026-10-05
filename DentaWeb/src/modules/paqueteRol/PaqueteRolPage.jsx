import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package } from 'lucide-react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../components/avisosFormulario';
import { paquetesApi } from '../../services/api.js'; // agrega paquetesApi en este archivo

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
};

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Convierte lo que devuelve el backend a lo que muestra la tabla
const mapearPaquete = (p) => ({
  id: p.id_paquete,
  nombre: p.nombre,
  descripcion: p.descripcion,
  estado: p.activo ? 'Activo' : 'Inactivo',
});

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState([]); // datos crudos del backend
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
      const data = await paquetesApi.listar();
      console.log('Paquetes cargados:', data);
      setPaquetes(data?.paquetes ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los paquetes.');
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
    setErroresCampos({});
    setForm({
      nombre: (p.nombre ?? '').toLocaleUpperCase('es-MX'),
      descripcion: (p.descripcion ?? '').toLocaleUpperCase('es-MX'),
    });
  };

  const handleEliminar = async (id) => {
    await paquetesApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await paquetesApi.reactivar(id);
    await cargar();
  };

  const formularioPaquete = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex flex-col gap-4">
      <div data-campo="nombre">
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre:</label>
        <input
          type="text"
          maxLength={50}
          placeholder="Ej. PAQUETE DE LIMPIEZA DENTAL"
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
          placeholder="Describe qué incluye el paquete (opcional)"
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
      titulo="Paquetes"
      subtitulo="Gestiona los paquetes de servicios de la red médica."
      textoBotonNuevo="Agregar paquete"
      placeholderBusqueda="Buscar por nombre o descripción..."
      datos={paquetes.map(mapearPaquete)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Package />,
        titulo: editandoId ? 'Editar Paquete' : 'Nuevo Paquete',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Paquete',
        contenido: formularioPaquete,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
      }}
    />
  );
}