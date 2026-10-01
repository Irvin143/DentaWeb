import React, { useState, useEffect } from 'react';
import { CatalogoPage } from '../../components/CatalogoPage';
import { ChevronDown, Building2 } from 'lucide-react';


const filtrosExtra = (
  <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
    <Building2 size={16} className="text-slate-400" />
    Todas las sedes
    <ChevronDown size={16} className="ml-1 text-slate-400" />
  </button>
);

const inputClass =
  'w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const formularioClinica = (
  <div className="flex flex-col gap-4">
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de la clínica:</label>
      <input type="text" placeholder="Ej. Clínica Centro" className={inputClass} />
    </div>
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Dirección completa:</label>
      <input type="text" placeholder="Calle, Número, Ciudad" className={inputClass} />
    </div>
  </div>
);

export default function ClinicasPage() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Simulación de SELECT
    const t = setTimeout(() => {
      setDatos([
        { id: 1, nombre: 'DentalWeb Miraflores Centro', direccion: 'Av. José Larco 852, Piso 4, Miraflores', especialidades: 'Ortodoncia, Implantología, Odontopediatría', estado: 'Activa', sede_principal: 'Sí' },
        { id: 2, nombre: 'DentalWeb San Isidro Empresarial', direccion: 'Calle Las Begonias 441, Of. 602, San Isidro', especialidades: 'Estética Dental, Rehabilitación Oral', estado: 'Activa', sede_principal: 'No' },
        { id: 3, nombre: 'DentalWeb Providencia Norte', direccion: 'Av. Nueva Providencia 1945, Of. 301', especialidades: 'Cirugía Maxilofacial, Urgencias 24/7', estado: 'Inactiva', sede_principal: 'No' },
      ]);
      setCargando(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <CatalogoPage
      titulo="Clínicas"
      subtitulo="Gestiona las sedes activas y especialidades de la red médica."
      textoBotonNuevo="Agregar clínica"
      placeholderBusqueda="Buscar por nombre de clínica, dirección o especialidad..."
      filtrosExtra={filtrosExtra}
      datos={datos}
      cargando={cargando}
      modal={{
        icono: '🏥',
        titulo: 'Nueva Clínica',
        textoGuardar: 'Guardar Clínica',
        contenido: formularioClinica,
      }}
    />
  );
}