// Qué paquetes/roles pueden ver cada catálogo.
// No importan mayúsculas, acentos ni espacios extra: "Odontólogo" = "odontologo".
export const PERMISOS_RUTAS = {
  '/pacientes':      ['admin', 'clinica', 'odontologo', 'paciente'], 
  '/odontologos':    ['admin', 'clinica', 'paciente'],
  '/clinicas':       ['admin', 'paciente'],
  '/consultorios':   ['admin', 'clinica'],
  '/servicios':      ['admin', 'clinica'],
  '/especialidades': ['admin'],
  '/estudios':       ['admin', 'clinica', 'odontologo'],
  '/tipos-cita':     ['admin', 'clinica'],
  '/paquetes':       ['admin'],
  '/roles':          ['admin'],
    '/tipos-usuario':  ['admin', 'paciente'],
};

// Minúsculas, sin acentos y sin espacios sobrantes. Acepta strings u objetos { nombre }.
const limpiar = (valor) =>
  String(valor?.nombre ?? valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Lee la sesión guardada por el login
export const getAuth = () => {
  try {
    return JSON.parse(sessionStorage.getItem('clinicware_auth'));
  } catch {
    return null;
  }
};

// Todo lo que identifica al usuario: su paquete y sus roles
export const identidades = (usuario) =>
  [usuario?.paquete, ...(usuario?.roles ?? [])].filter(Boolean).map(limpiar);

// ¿Puede el usuario ver esta ruta?
export const puedeVer = (path, usuario) => {
  const permitidos = PERMISOS_RUTAS[path];
  if (!permitidos) return false; // ruta sin regla: denegada por defecto
  const permitidosNorm = permitidos.map(limpiar);
  return identidades(usuario).some((i) => permitidosNorm.includes(i));
};

// Primera ruta a la que el usuario tiene acceso (para redirigir tras el login)
export const primeraRutaPermitida = (usuario) =>
  Object.keys(PERMISOS_RUTAS).find((p) => puedeVer(p, usuario)) ?? null;