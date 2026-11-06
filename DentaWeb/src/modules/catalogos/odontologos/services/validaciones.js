import { errorContrasena } from '../../../../components/ChecklistContrasena.jsx';
import { avisoTelefonoOcupado } from '../../../../utils/telefonoCompartido.js';
import { validarHorarios } from './horarios.js';

/* ============================================================
   REGEX, FILTROS Y LÍMITES
   ============================================================ */

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre: solo letras (con acentos/ñ), espacios, apóstrofes, guiones y puntos
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'.-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Teléfono: 10 dígitos exactos (México)
const REGEX_TELEFONO = /^\d{10}$/;

// Cédula profesional mexicana: 7 u 8 dígitos (ajústalo si tu país usa otro formato)
const REGEX_CEDULA = /^\d{7,8}$/;

// Filtros en tiempo real (se usan en handleChange)
export const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
export const LIMPIAR_CEDULA = /[^\d]/g;
export const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;
export const limitarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 10);

// Longitudes máximas según el DER
export const MAX_NOMBRE = 100;
export const MAX_CEDULA = 50; // varchar(50)
export const MAX_CORREO = 150;

const contarPalabras = (str) => str.trim().split(/\s+/).filter(Boolean).length;

/* ============================================================
   VALIDADORES POR CAMPO
   ============================================================ */

const validarNombre = (valor, etiqueta) => {
  const v = valor.trim();
  if (!v) return `El ${etiqueta} es obligatorio`;
  if (v.length < 2) return `El ${etiqueta} debe tener al menos 2 caracteres`;
  if (v.length > MAX_NOMBRE) return `El ${etiqueta} no puede exceder ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return `El ${etiqueta} solo puede contener letras, espacios, apóstrofes, puntos o guiones`;
  return null;
};

const validarTelefono = (valor) => {
  const v = valor.trim();
  if (!v) return 'El teléfono es obligatorio';
  const soloDigitos = v.replace(/[\s()-]/g, '');
  if (!/^\d+$/.test(soloDigitos)) return 'El teléfono solo puede contener números';
  if (!REGEX_TELEFONO.test(soloDigitos)) return 'El teléfono debe tener exactamente 10 dígitos';
  return null;
};

const validarCedula = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'La cédula profesional es obligatoria' : null;
  if (v.length > MAX_CEDULA) return `La cédula no puede exceder ${MAX_CEDULA} caracteres`;
  if (!REGEX_CEDULA.test(v)) return 'La cédula debe contener entre 7 y 8 dígitos';
  return null;
};

const validarCorreo = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'El correo es obligatorio' : null;
  if (v.length > MAX_CORREO) return `El correo no puede exceder ${MAX_CORREO} caracteres`;
  if (!REGEX_CORREO.test(v)) return 'Ingresa un correo electrónico válido';
  return null;
};

/* ============================================================
   VALIDADOR GLOBAL
   ============================================================ */

export const validarFormulario = (form, creando, odontologos = [], editandoId = null) => {
  const errores = {};

  const errNombre = validarNombre(form.nombre, 'nombre');
  if (errNombre) errores.nombre = errNombre;
  else if (contarPalabras(form.nombre) > 4) errores.nombre = 'El nombre parece demasiado largo';

  const errApePat = validarNombre(form.ape_pat, 'apellido paterno');
  if (errApePat) errores.ape_pat = errApePat;

  if (form.ape_mat.trim()) {
    const errApeMat = validarNombre(form.ape_mat, 'apellido materno');
    if (errApeMat) errores.ape_mat = errApeMat;
  }

  // Teléfono: obligatorio, 10 dígitos y sin duplicado
  const errTel = validarTelefono(form.telefono);
  if (errTel) errores.telefono = errTel;
  else {
    const ocupado = avisoTelefonoOcupado(form.telefono.replace(/\D/g, ''), {
      odontologos,
      idOdontologo: editandoId,
    });
    if (ocupado) errores.telefono = ocupado;
  }

  // Cédula: opcional, pero si viene se valida y se revisa duplicado
  const errCedula = validarCedula(form.cedula);
  if (errCedula) errores.cedula = errCedula;
  else if (form.cedula.trim()) {
    const normalizado = form.cedula.trim();
    const duplicado = odontologos.some(
      (o) => o.id_odontologo !== editandoId && (o.cedula ?? '').trim() === normalizado
    );
    if (duplicado) errores.cedula = 'Ya existe un odontólogo con esa cédula';
  }

  if (creando && form.ids_clinicas.length === 0) {
    errores.ids_clinicas = 'Selecciona al menos una clínica';
  }

  // Horario semanal: opcional, pero si se captura debe ser coherente
  const errHorarios = validarHorarios(form.bloques, form.ids_clinicas);
  if (errHorarios) errores.horarios = errHorarios;

  // Credenciales (solo al crear)
  if (creando) {
    const errCorreo = validarCorreo(form.correo, { obligatorio: true });
    if (errCorreo) errores.correo = errCorreo;

    const errPass = errorContrasena(form.contrasena);
    if (errPass) errores.contrasena = errPass;

    if (!form.confirmarContrasena) errores.confirmarContrasena = 'Confirma la contraseña';
    else if (form.contrasena !== form.confirmarContrasena)
      errores.confirmarContrasena = 'Las contraseñas no coinciden';
  }

  return errores;
};