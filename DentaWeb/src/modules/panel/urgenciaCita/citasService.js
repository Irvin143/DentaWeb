import { getAuth } from '../../../config/permisos.js';

/* ---------- Configuración (ajusta a tu backend) ---------- */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const RUTAS = {
  listar: '/citas', // GET   -> lista de citas del usuario
  cancelar: (id) => `/citas/${id}/cancelar`, // PATCH -> cancela la cita
};

/* ---------- Petición base ---------- */
async function peticion(ruta, opciones = {}) {
  const token = getAuth()?.token;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      mensaje = cuerpo.mensaje ?? cuerpo.message ?? mensaje;
    } catch {
      /* la respuesta no era JSON */
    }
    throw new Error(mensaje);
  }

  return respuesta.status === 204 ? null : respuesta.json();
}

/* ---------- Adaptador: backend -> formato de la pantalla ---------- */
const ESTADOS = {
  pendiente: 'Pendiente',
  concluida: 'Concluida',
  completada: 'Concluida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

function normalizarEstado(valor) {
  const clave = String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  // Un estado desconocido se muestra tal cual, sin darle botones de acción.
  return ESTADOS[clave] ?? String(valor ?? 'Sin estado');
}

function leerFecha(cita) {
  let valor = cita.fecha_hora ?? cita.fechaHora ?? cita.fecha;
  if (cita.fecha && cita.hora) valor = `${cita.fecha}T${cita.hora}`;
  // "2026-11-20" solo, se interpretaría como UTC y se correría un día.
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) valor += 'T00:00:00';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function normalizarCita(cita) {
  const fecha = leerFecha(cita);
  if (!fecha) return null;

  const doctor = cita.doctor ?? cita.medico;
  return {
    id: cita.id ?? cita._id,
    fecha,
    motivo: cita.motivo ?? cita.servicio ?? 'Consulta',
    doctor: (typeof doctor === 'object' ? doctor?.nombre : doctor) ?? '—',
    estado: normalizarEstado(cita.estado),
  };
}

/* ---------- API pública ---------- */
export async function obtenerCitas({ signal } = {}) {
  const datos = await peticion(RUTAS.listar, { signal });
  const lista = Array.isArray(datos) ? datos : (datos?.data ?? datos?.citas ?? []);
  return lista.map(normalizarCita).filter(Boolean);
}

export async function cancelarCita(id) {
  await peticion(RUTAS.cancelar(id), { method: 'PATCH' });
}