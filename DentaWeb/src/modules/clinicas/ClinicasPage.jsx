import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { LayoutCatalogo } from '../../components/LayoutCatalogo';
import { ModalGenerico } from '../../components/ModalGenerico';
import { Armchair, Clock, ShieldCheck, ChevronDown, Building2 } from 'lucide-react';

export default function ClinicasPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosTabla, setDatosTabla] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Simulacion de SELECT
  useEffect(() => {
    const fetchDesdeBD = async () => {
      try {
        setCargando(true);
        setTimeout(() => {
          const resultadoSQL = [
            {
              id: 1,
              nombre: "DentalWeb Miraflores Centro",
              direccion: "Av. José Larco 852, Piso 4, Miraflores",
              especialidades: "Ortodoncia, Implantología, Odontopediatría",
              estado: "Activa",
              sede_principal: "Sí"
            },
            {
              id: 2,
              nombre: "DentalWeb San Isidro Empresarial",
              direccion: "Calle Las Begonias 441, Of. 602, San Isidro",
              especialidades: "Estética Dental, Rehabilitación Oral",
              estado: "Activa",
              sede_principal: "No"
            },
            {
              id: 3,
              nombre: "DentalWeb Providencia Norte",
              direccion: "Av. Nueva Providencia 1945, Of. 301",
              especialidades: "Cirugía Maxilofacial, Urgencias 24/7",
              estado: "Inactiva",
              sede_principal: "No"
            }
          ];
          
          setDatosTabla(resultadoSQL);
          setCargando(false);
        }, 800);
      } catch (error) {
        console.error("Error al consultar la BD:", error);
        setCargando(false);
      }
    };

    fetchDesdeBD();
  }, []);

  // Extraccion de las columnas 
  const columnas = datosTabla.length > 0 ? Object.keys(datosTabla[0]) : [];

  // Contador de resultados
  const totalSedes = datosTabla.length;
  const sedesActivas = datosTabla.filter(c => c.estado === 'Activa').length;
  const textoResultadosDinamico = `${totalSedes} sedes registradas ( ${sedesActivas} activas )`;

  // Estadisticas
  const statsClinicas = [
    { 
      label: "Sillones Odontológicos", 
      valor: "38 operativos",
      icono: <Armchair size={24} strokeWidth={1.5} />,
      badgeTexto: "100% activos",
      badgeTipo: "gris"
    },
    { 
      label: "Disponibilidad Media", 
      valor: "92.4% horario útil",
      icono: <Clock size={24} strokeWidth={1.5} />,
      badgeTexto: "Excelente",
      badgeTipo: "verde"
    },
    { 
      label: "Acreditaciones Sanitarias", 
      valor: "Al día (Vigentes)",
      icono: <ShieldCheck size={24} strokeWidth={1.5} />,
      badgeTexto: "Auditado",
      badgeTipo: "gris"
    }
  ];

  // Filtro desplegable superior
  const filtrosExtra = (
    <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
      <Building2 size={16} className="text-slate-400" />
      Todas las sedes
      <ChevronDown size={16} className="ml-1 text-slate-400" />
    </button>
  );

  return (
    <MainLayout>
      <LayoutCatalogo
        titulo="Clínicas"
        badgeTitulo="Red DentalWeb"
        subtitulo="Gestiona las sedes activas y especialidades de la red médica."
        textoBotonNuevo="Agregar clínica"
        onNuevoClick={() => setModalAbierto(true)}
        placeholderBusqueda="Buscar por nombre de clínica, dirección o especialidad..."
        filtrosExtra={filtrosExtra}
        textoResultados={textoResultadosDinamico}
        estadisticas={statsClinicas}
      >
        {/* Tabla generada segun los atributos */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              
              {/* Cabecera basada en los atributos */}
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {columnas.map((columna, index) => (
                    <th key={index} className="px-6 py-4">
                      {columna.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Cuerpo de la tabla */}
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={columnas.length || 1} className="px-6 py-12 text-center text-slate-500">
                      Ejecutando consulta a la base de datos...
                    </td>
                  </tr>
                ) : (
                  datosTabla.map((fila, rowIndex) => (
                    <tr key={rowIndex} className="transition-colors hover:bg-slate-50/50">
                      {columnas.map((columna, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {fila[columna]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </LayoutCatalogo>

      <ModalGenerico
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        iconoCabecera="🏥"
        titulo="Nueva Clínica"
        textoBotonGuardar="Guardar Clínica"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de la clínica:</label>
            <input type="text" placeholder="Ej. Clínica Centro" className="w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dirección completa:</label>
            <input type="text" placeholder="Calle, Número, Ciudad" className="w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
          </div>
        </div>
      </ModalGenerico>
    </MainLayout>
  );
}