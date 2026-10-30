export const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

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