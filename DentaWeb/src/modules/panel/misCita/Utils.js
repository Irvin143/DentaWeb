export const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export const primerDiaMes = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const mesDeHoy = () => primerDiaMes(new Date());

export const moverMes = (date, delta) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

export const parseYmd = (ymd) => {
  const [y, m, d] = String(ymd ?? '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export const aYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 05 nov 2026
export const fechaCorta = (f) =>
  f.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');

// Jueves, 5 de noviembre
export const fechaLarga = (f) =>
  mayuscula(f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }));

// 02:30 PM
export const hora = (f) =>
  f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

// '14:30' -> 02:30 PM
export const horaDesdeTexto = (hhmm) => hora(new Date(`2000-01-01T${hhmm}`));

// Fecha de hoy como AAAA-MM-DD (en hora local, no UTC)
export const hoyISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};