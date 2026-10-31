const CLASE_PILDORA = 'inline-block rounded-full px-2.5 py-1 text-xs font-medium';

const ESTADOS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

const TONOS = {
  Pendiente: 'bg-surface-container text-on-surface-variant',
  Confirmada: 'bg-teal-50 text-teal-700',
  Atendida: 'bg-teal-50 text-teal-700',
  Cancelada: 'bg-error-container text-error',
  'No asistió': 'bg-error-container text-error',
};

export const TONO_DESCONOCIDO = 'bg-surface-container text-on-surface-variant';

const claveEstado = (valor) =>
  String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

export function etiquetaEstado(valor) {
  const clave = claveEstado(valor);
  if (ESTADOS[clave]) return ESTADOS[clave];
  const texto = String(valor ?? '').trim();
  return texto || '';
}

export function claseEstado(valor) {
  const etiqueta = etiquetaEstado(valor);
  return TONOS[etiqueta] ?? TONO_DESCONOCIDO;
}

export function BadgeEstado({ estado }) {
  const etiqueta = etiquetaEstado(estado);
  if (!etiqueta) return null;
  return <span className={`${CLASE_PILDORA} ${claseEstado(estado)}`}>{etiqueta}</span>;
}
