// Qué paquetes/roles pueden ver cada catálogo.
// No importan mayúsculas, acentos ni espacios extra: "Odontólogo" = "odontologo".
export const PERMISOS_RUTAS = {
    // '/panel':            ['admin'],
    '/panel-paciente':   ['paciente'],
    '/pacientes':        ['admin', 'clinica', 'odontologo'],
    '/odontologos':      ['admin', 'clinica'],
    '/clinicas':         ['admin'],
    '/consultorios':     ['admin', 'clinica'],
    '/servicios':        ['admin', 'clinica'],
    '/especialidades':   ['admin'],
    '/estudios':         ['admin', 'clinica', 'odontologo'],
    '/tipos-cita':       ['admin', 'clinica'],
    '/paquetes':         ['admin'],
    '/roles':            ['admin'],
    '/tipos-usuario':    ['admin'],
    '/usuarios':         ['admin'],
};

// Minúsculas, sin acentos y sin espacios sobrantes. Acepta strings u objetos { nombre }.
const limpiar = (valor) =>
  String(valor?.nombre ?? valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const CLAVE_SESION = 'clinicware_auth';

const leerAlmacen = (almacen) => {
  try {
    return JSON.parse(almacen.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
};

// exp del JWT, sin verificar la firma. null si no se puede leer.
const expiracion = (token) => {
  try {
    const parte = String(token ?? '').split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const conRelleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const datos = JSON.parse(atob(conRelleno));
    return typeof datos.exp === 'number' ? datos.exp : null;
  } catch {
    return null;
  }
};

export const borrarSesion = () => {
  localStorage.removeItem(CLAVE_SESION);
  sessionStorage.removeItem(CLAVE_SESION);
};

// Primero la sesión que sobrevive al navegador. Si el token venció, no hay sesión.
export const getAuth = () => {
  const local = leerAlmacen(localStorage);
  const deSesion = leerAlmacen(sessionStorage);
  const auth = local?.token ? local : deSesion?.token ? deSesion : null;
  if (!auth) return null;

  const exp = expiracion(auth.token);
  if (exp == null || exp * 1000 <= Date.now()) {
    borrarSesion();
    return null;
  }
  return auth;
};

// mantener: localStorage. Si no, solo mientras el navegador siga abierto.
export const guardarSesion = ({ token, usuario }, mantener) => {
  const valor = JSON.stringify({ token, usuario });
  if (mantener) {
    localStorage.setItem(CLAVE_SESION, valor);
    sessionStorage.removeItem(CLAVE_SESION);
  } else {
    sessionStorage.setItem(CLAVE_SESION, valor);
    localStorage.removeItem(CLAVE_SESION);
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