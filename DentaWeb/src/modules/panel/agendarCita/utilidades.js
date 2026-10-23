/* ============================================================
   CONSTANTES
   ============================================================ */

export const PASOS = [
  { n: 1, etiqueta: 'Servicio y sede' },
  { n: 2, etiqueta: 'Fecha y hora' },
  { n: 3, etiqueta: 'Confirmar' },
];

export const TOTAL_PASOS = PASOS.length;

export const SUBTITULOS = {
  1: '¿Qué necesitas y en qué sede te queda mejor?',
  2: '¿Cuándo deseas tu cita?',
  3: 'Revisa los datos y confirma tu cita.',
};

// Filtros de categoría que ve el paciente
export const FILTROS_CATEGORIA = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'consulta', etiqueta: 'Consultas' },
  { valor: 'estudio', etiqueta: 'Estudios' },
];

export const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_A_MOSTRAR = 5;

// A partir de cuántos servicios aparece el buscador
export const UMBRAL_BUSCADOR = 6;
export const MAX_MOTIVO = 500;

// TODO: reemplazar por los horarios con disponibilidad que devuelva el backend
export const HORAS_MANANA = ['09:00 AM', '10:30 AM', '11:45 AM'];
export const HORAS_TARDE = ['03:30 PM', '04:30 PM', '05:15 PM'];

// Contenedor blanco con borde que comparten todas las secciones
export const CLASE_TARJETA = 'rounded-2xl border border-slate-200 bg-white p-5 lg:p-6';

/* ============================================================
   TEXTO Y FECHAS
   ============================================================ */

export const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Quita acentos y pasa a minúsculas para que la búsqueda no distinga "Radiografía" de "radiografia"
export const normalizarTexto = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const aISO = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
    fecha.getDate()
  ).padStart(2, '0')}`;

// Próximos días hábiles (sin domingos), a partir de mañana.
// TODO: reemplazar por los días con disponibilidad que devuelva el backend.
export function generarDias(cantidad) {
  const dias = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (dias.length < cantidad) {
    if (cursor.getDay() !== 0) {
      dias.push({
        fecha: aISO(cursor),
        diaSemana: NOMBRES_DIA[cursor.getDay()],
        diaNumero: String(cursor.getDate()).padStart(2, '0'),
        date: new Date(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export function etiquetaMeses(dias) {
  const formato = new Intl.DateTimeFormat('es-MX', { month: 'long' });
  const primero = dias[0].date;
  const ultimo = dias[dias.length - 1].date;
  const mesA = capitalizar(formato.format(primero));
  const mesB = capitalizar(formato.format(ultimo));
  return mesA === mesB
    ? `${mesA} ${ultimo.getFullYear()}`
    : `${mesA} - ${mesB} ${ultimo.getFullYear()}`;
}

// '2026-10-30' → 'Viernes, 30 de octubre'
export function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  return capitalizar(
    new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  );
}

/* ============================================================
   NORMALIZADORES
   Adaptan la respuesta del backend a lo que usa la vista.
   Si tus campos se llaman distinto, solo cambia estas funciones.
   ============================================================ */

export function normalizarServicio(s) {
  return {
    id: String(s.id_servicio ?? s.id),
    nombre: s.nombre,
    desc: s.descripcion ?? '',
    categoria: s.categoria ?? 'consulta',
    duracion: s.duracion_minutos ?? s.duracion ?? null,
    activo: s.activo ?? true,
  };
}

export function normalizarSede(s) {
  return {
    id: String(s.id_sede ?? s.id_clinica ?? s.id),
    nombre: s.nombre,
    direccion: s.direccion ?? '',
  };
}