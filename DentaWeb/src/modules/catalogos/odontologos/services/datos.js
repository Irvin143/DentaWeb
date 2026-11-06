export const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  ids_clinicas: [], // arreglo de ids (número)
  ids_especialidades: [], // arreglo de ids (número)
  bloques: [], // horario semanal (ver bloqueNuevo en horarios.js)
  idusuario: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

export const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

export const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Nombres de las clínicas del odontólogo, separados por coma
const nombresClinicas = (o) =>
  o.nombre_clinica ??
  (Array.isArray(o.clinicas) ? o.clinicas.map((c) => c.nombre).join(', ') : '');

// Especialidades del odontólogo, separadas por coma (si el backend las incluye en el listado)
const nombresEspecialidades = (o) =>
  Array.isArray(o.especialidades)
    ? o.especialidades.map((e) => e.nombre ?? e).join(', ')
    : o.nombre_especialidades ?? '';

export const mapearOdontologo = (o) => ({
  id: o.id_odontologo,
  nombre: o.nombre_completo ?? [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' '),
  cedula: o.cedula,
  telefono: o.telefono,
  correo_usuario: o.correo_usuario,
  clinica: nombresClinicas(o),
  especialidades: nombresEspecialidades(o),
  estado: o.activo ? 'Activo' : 'Inactivo',
});

// Id del odontólogo recién creado, según lo que responda el backend
export const idDeRespuesta = (resp) =>
  resp?.id_odontologo ?? resp?.id ?? resp?.odontologo?.id_odontologo ?? resp?.odontologo?.id ?? null;