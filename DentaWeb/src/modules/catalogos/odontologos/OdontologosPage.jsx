import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, Eye, EyeOff, KeyRound, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { CatalogoPage } from '../../../components/CatalogoPage.jsx';
import { ChecklistContrasena, errorContrasena } from '../../../components/ChecklistContrasena.jsx';
import { AvisoCampo, AvisoGeneral, scrollAlPrimerCampo } from '../../../components/avisosFormulario.jsx';
import { avisoTelefonoOcupado } from '../../../utils/telefonoCompartido.js';
import { odontologosApi, clinicasApi } from '../../../services/api.js';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-5 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base dark:border-outline-variant dark:bg-surface-container dark:text-on-surface dark:placeholder:text-on-surface-variant';

/* ============================================================
   VALIDACIONES
   ============================================================ */

// Correo
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre: solo letras (con acentos/ñ), espacios, apóstrofes, guiones y puntos
const REGEX_NOMBRE =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'.-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Teléfono: 10 dígitos exactos (México)
const REGEX_TELEFONO = /^\d{10}$/;

// Cédula profesional mexicana: 7 u 8 dígitos (ajústalo si tu país usa otro formato)
const REGEX_CEDULA = /^\d{7,8}$/;

// Filtros en tiempo real
const LIMPIAR_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;
const limitarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 10);
const LIMPIAR_CEDULA = /[^\d]/g;
const LIMPIAR_CORREO = /[^A-Za-z0-9@._+-]/g;

// Longitudes máximas según el DER
const MAX_NOMBRE = 100;
const MAX_CEDULA = 50;     // varchar(50)
const MAX_CORREO = 150;

// Cuenta palabras para evitar nombres absurdamente largos
const contarPalabras = (str) =>
  str.trim().split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------------------
   Horario semanal
   ------------------------------------------------------------ */

// 1 = lunes … 7 = domingo (igual que ISODOW en la base de datos)
const DIAS = [
  { n: 1, corto: 'L', nombre: 'Lunes' },
  { n: 2, corto: 'M', nombre: 'Martes' },
  { n: 3, corto: 'X', nombre: 'Miércoles' },
  { n: 4, corto: 'J', nombre: 'Jueves' },
  { n: 5, corto: 'V', nombre: 'Viernes' },
  { n: 6, corto: 'S', nombre: 'Sábado' },
  { n: 7, corto: 'D', nombre: 'Domingo' },
];

const DURACIONES = [15, 20, 30, 45, 60];

const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

let contadorBloques = 0;
const bloqueNuevo = (idClinica) => {
  contadorBloques += 1;
  return {
    clave: `b${contadorBloques}`,
    id_clinica: idClinica,
    dias: [1, 2, 3, 4, 5],
    hora_inicio: '09:00',
    hora_fin: '14:00',
    duracion: 30,
  };
};

// Un bloque (clínica + varios días + horas) → una fila por día, como las guarda la base de datos
const expandirBloques = (bloques) =>
  bloques.flatMap((b) =>
    b.dias.map((dia) => ({
      id_clinica: Number(b.id_clinica),
      dia_semana: dia,
      hora_inicio: b.hora_inicio,
      hora_fin: b.hora_fin,
      duracion_cita_min: Number(b.duracion),
    }))
  );

// Filas de la base de datos → bloques (junta los días que comparten clínica, horas y duración)
const agruparHorarios = (filas = []) => {
  const mapa = new Map();
  filas.forEach((f) => {
    const llave = `${f.id_clinica}|${f.hora_inicio}|${f.hora_fin}|${f.duracion_cita_min}`;
    if (!mapa.has(llave)) {
      const bloque = bloqueNuevo(Number(f.id_clinica));
      bloque.dias = [];
      bloque.hora_inicio = f.hora_inicio;
      bloque.hora_fin = f.hora_fin;
      bloque.duracion = Number(f.duracion_cita_min);
      mapa.set(llave, bloque);
    }
    mapa.get(llave).dias.push(Number(f.dia_semana));
  });
  return [...mapa.values()].map((b) => ({ ...b, dias: [...b.dias].sort((a, c) => a - c) }));
};

const validarHorarios = (bloques, idsClinicas) => {
  for (const b of bloques) {
    if (!b.id_clinica || !idsClinicas.includes(Number(b.id_clinica)))
      return 'Cada horario necesita una clínica de las seleccionadas';
    if (b.dias.length === 0) return 'Elige al menos un día en cada horario';
    if (!b.hora_inicio || !b.hora_fin) return 'Indica la hora de inicio y de fin en cada horario';
    if (aMinutos(b.hora_fin) <= aMinutos(b.hora_inicio))
      return 'La hora de fin debe ser posterior a la de inicio';
    if (aMinutos(b.hora_fin) - aMinutos(b.hora_inicio) < Number(b.duracion))
      return 'Un horario es más corto que la duración de una cita';
  }

  // Un odontólogo no puede estar en dos lugares a la vez: ningún día se empalma,
  // ni siquiera entre clínicas distintas.
  const filas = expandirBloques(bloques);
  for (let i = 0; i < filas.length; i += 1) {
    for (let j = i + 1; j < filas.length; j += 1) {
      const a = filas[i];
      const b = filas[j];
      if (
        a.dia_semana === b.dia_semana &&
        aMinutos(a.hora_inicio) < aMinutos(b.hora_fin) &&
        aMinutos(b.hora_inicio) < aMinutos(a.hora_fin)
      ) {
        const dia = DIAS.find((d) => d.n === a.dia_semana)?.nombre ?? 'un día';
        return `Los horarios se empalman el ${dia.toLowerCase()}`;
      }
    }
  }
  return null;
};

/* ------------------------------------------------------------
   Validadores por campo
   ------------------------------------------------------------ */

const validarNombre = (valor, etiqueta) => {
  const v = valor.trim();
  if (!v) return `El ${etiqueta} es obligatorio`;
  if (v.length < 2) return `El ${etiqueta} debe tener al menos 2 caracteres`;
  if (v.length > MAX_NOMBRE)
    return `El ${etiqueta} no puede exceder ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(v))
    return `El ${etiqueta} solo puede contener letras, espacios, apóstrofes, puntos o guiones`;
  return null;
};

const validarTelefono = (valor) => {
  const v = valor.trim();
  if (!v) return 'El teléfono es obligatorio';
  const soloDigitos = v.replace(/[\s()-]/g, '');
  if (!/^\d+$/.test(soloDigitos))
    return 'El teléfono solo puede contener números';
  if (!REGEX_TELEFONO.test(soloDigitos))
    return 'El teléfono debe tener exactamente 10 dígitos';
  return null;
};

const validarCedula = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'La cédula profesional es obligatoria' : null;
  if (v.length > MAX_CEDULA)
    return `La cédula no puede exceder ${MAX_CEDULA} caracteres`;
  if (!REGEX_CEDULA.test(v))
    return 'La cédula debe contener entre 7 y 8 dígitos';
  return null;
};

const validarCorreo = (valor, { obligatorio = false } = {}) => {
  const v = valor.trim();
  if (!v) return obligatorio ? 'El correo es obligatorio' : null;
  if (v.length > MAX_CORREO)
    return `El correo no puede exceder ${MAX_CORREO} caracteres`;
  if (!REGEX_CORREO.test(v)) return 'Ingresa un correo electrónico válido';
  return null;
};

/* ------------------------------------------------------------
   Validador global del formulario
   ------------------------------------------------------------ */

const validarFormulario = (
  form,
  creando,
  odontologos = [],
  editandoId = null,
) => {
  const errores = {};

  // --- Nombre ---
  const errNombre = validarNombre(form.nombre, 'nombre');
  if (errNombre) errores.nombre = errNombre;
  else if (contarPalabras(form.nombre) > 4)
    errores.nombre = 'El nombre parece demasiado largo';

  // --- Apellido paterno ---
  const errApePat = validarNombre(form.ape_pat, 'apellido paterno');
  if (errApePat) errores.ape_pat = errApePat;

  // --- Apellido materno (opcional) ---
  if (form.ape_mat.trim()) {
    const errApeMat = validarNombre(form.ape_mat, 'apellido materno');
    if (errApeMat) errores.ape_mat = errApeMat;
  }

  // --- Teléfono (obligatorio; 10 dígitos y sin duplicado) ---
  const errTel = validarTelefono(form.telefono);
  if (errTel) errores.telefono = errTel;
  else {
    const ocupado = avisoTelefonoOcupado(form.telefono.replace(/\D/g, ''), {
      odontologos,
      idOdontologo: editandoId,
    });
    if (ocupado) errores.telefono = ocupado;
  }

  // --- Cédula (opcional pero si viene, validar y checar duplicado) ---
  const errCedula = validarCedula(form.cedula);
  if (errCedula) errores.cedula = errCedula;
  else if (form.cedula.trim()) {
    const normalizado = form.cedula.trim();
    const duplicado = odontologos.some(
      (o) =>
        o.id_odontologo !== editandoId &&
        (o.cedula ?? '').trim() === normalizado
    );
    if (duplicado) errores.cedula = 'Ya existe un odontólogo con esa cédula';
  }

  // --- Clínicas (al menos una al crear, según tu lógica original) ---
  if (creando && form.ids_clinicas.length === 0) {
    errores.ids_clinicas = 'Selecciona al menos una clínica';
  }

  // --- Horario semanal (opcional, pero si se captura debe ser coherente) ---
  const errHorarios = validarHorarios(form.bloques, form.ids_clinicas);
  if (errHorarios) errores.horarios = errHorarios;

  // --- Credenciales (solo al crear) ---
  if (creando) {
    const errCorreo = validarCorreo(form.correo, { obligatorio: true });
    if (errCorreo) errores.correo = errCorreo;

    const errPass = errorContrasena(form.contrasena);
    if (errPass) errores.contrasena = errPass;

    if (!form.confirmarContrasena)
      errores.confirmarContrasena = 'Confirma la contraseña';
    else if (form.contrasena !== form.confirmarContrasena)
      errores.confirmarContrasena = 'Las contraseñas no coinciden';
  }

  return errores;
};

/* ============================================================
   HELPERS
   ============================================================ */

const FORM_INICIAL = {
  nombre: '',
  ape_pat: '',
  ape_mat: '',
  telefono: '',
  cedula: '',
  ids_clinicas: [], // arreglo de ids (número)
  ids_especialidades: [], // arreglo de ids (número)
  bloques: [], // horario semanal (ver bloqueNuevo)
  idusuario: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

const comoLista = (resp, clave) =>
  Array.isArray(resp) ? resp : resp?.[clave] ?? resp?.data ?? [];

const mayus = (valor) => valor.trim().toLocaleUpperCase('es-MX');

// Nombres de las clínicas del odontólogo, separados por coma
const nombresClinicas = (o) =>
  o.nombre_clinica ??
  (Array.isArray(o.clinicas) ? o.clinicas.map((c) => c.nombre).join(', ') : '');

const mapearOdontologo = (o) => ({
  id: o.id_odontologo,
  nombre:
    o.nombre_completo ??
    [o.nombre, o.ape_pat, o.ape_mat].filter(Boolean).join(' '),
  cedula: o.cedula,
  telefono: o.telefono,
  correo_usuario: o.correo_usuario,
  clinica: nombresClinicas(o),
  estado: o.activo ? 'Activo' : 'Inactivo',
});

// Id del odontólogo recién creado, según lo que responda el backend
const idDeRespuesta = (resp) =>
  resp?.id_odontologo ?? resp?.id ?? resp?.odontologo?.id_odontologo ?? resp?.odontologo?.id ?? null;

const Etiqueta = ({ children, requerido }) => (
  <label className="mb-1 block text-xs font-medium text-slate-700 md:mb-1.5 md:text-sm dark:text-on-surface">
    {children}
    {requerido && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const Seccion = ({ titulo, children }) => (
  <section className="flex flex-col gap-3 md:gap-5">
    <h3 className="hidden border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800 md:block dark:border-outline-variant dark:text-on-surface">
      {titulo}
    </h3>
    {children}
  </section>
);

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const formularioRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  // Al editar, el horario y las especialidades se cargan aparte. Hasta que llegan no se
  // guardan, para no borrar por error lo que ya tenía el odontólogo.
  const [perfilListo, setPerfilListo] = useState(true);

  const creando = editandoId === null;

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await odontologosApi.listar();
      setOdontologos(comoLista(data, 'odontologos'));
    } catch (err) {
      console.error('Error al listar odontólogos:', err);
      setOdontologos([]);
      setErrorCarga(err.message || 'No se pudieron cargar los odontólogos.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      const data = await clinicasApi.listar();
      setClinicas(comoLista(data, 'clinicas'));
    } catch (err) {
      console.error('Error al cargar clínicas:', err);
    }
    try {
      const data = await odontologosApi.catalogoPerfil();
      setEspecialidades(comoLista(data, 'especialidades'));
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Clínicas activas, más las ya asignadas aunque estén inactivas
  const opcionesClinica = useMemo(
    () =>
      clinicas.filter(
        (c) => c.activo || form.ids_clinicas.includes(Number(c.id_clinica))
      ),
    [clinicas, form.ids_clinicas]
  );

  // Clínicas marcadas arriba: son las únicas donde se puede poner horario
  const clinicasSeleccionadas = useMemo(
    () => clinicas.filter((c) => form.ids_clinicas.includes(Number(c.id_clinica))),
    [clinicas, form.ids_clinicas]
  );

  /* ------------------------------------------------------------
     HANDLE CHANGE con filtros en tiempo real
     ------------------------------------------------------------ */
  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
      case 'ape_pat':
      case 'ape_mat':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'telefono':
        valor = limitarTelefono(valor);
        break;
      case 'cedula':
        valor = valor.replace(LIMPIAR_CEDULA, '');
        break;
      case 'correo':
        valor = valor.replace(LIMPIAR_CORREO, '').toLowerCase();
        break;
      case 'contrasena':
      case 'confirmarContrasena':
        break;
      default:
        break;
    }

    setForm((prev) => ({ ...prev, [campo]: valor }));

    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const limpiarError = (campo) =>
    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });

  // Marca / desmarca una clínica en la lista. Al quitar una, también se quitan sus horarios.
  const toggleClinica = (idClinica) => {
    const id = Number(idClinica);
    setForm((prev) => {
      const quitando = prev.ids_clinicas.includes(id);
      return {
        ...prev,
        ids_clinicas: quitando
          ? prev.ids_clinicas.filter((x) => x !== id)
          : [...prev.ids_clinicas, id],
        bloques: quitando
          ? prev.bloques.filter((b) => Number(b.id_clinica) !== id)
          : prev.bloques,
      };
    });
    limpiarError('ids_clinicas');
    limpiarError('horarios');
  };

  const toggleEspecialidad = (idEspecialidad) => {
    const id = Number(idEspecialidad);
    setForm((prev) => ({
      ...prev,
      ids_especialidades: prev.ids_especialidades.includes(id)
        ? prev.ids_especialidades.filter((x) => x !== id)
        : [...prev.ids_especialidades, id],
    }));
  };

  /* ------------------------------------------------------------
     Horario semanal
     ------------------------------------------------------------ */
  const agregarBloque = () => {
    const primera = clinicasSeleccionadas[0];
    if (!primera) return;
    setForm((prev) => ({
      ...prev,
      bloques: [...prev.bloques, bloqueNuevo(Number(primera.id_clinica))],
    }));
    limpiarError('horarios');
  };

  const cambiarBloque = (clave, cambios) => {
    setForm((prev) => ({
      ...prev,
      bloques: prev.bloques.map((b) => (b.clave === clave ? { ...b, ...cambios } : b)),
    }));
    limpiarError('horarios');
  };

  const toggleDia = (clave, dia) => {
    setForm((prev) => ({
      ...prev,
      bloques: prev.bloques.map((b) => {
        if (b.clave !== clave) return b;
        const dias = b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia];
        return { ...b, dias: dias.sort((a, c) => a - c) };
      }),
    }));
    limpiarError('horarios');
  };

  const quitarBloque = (clave) => {
    setForm((prev) => ({ ...prev, bloques: prev.bloques.filter((b) => b.clave !== clave) }));
    limpiarError('horarios');
  };

  /* ------------------------------------------------------------
     HANDLE BLUR
     ------------------------------------------------------------ */
  const handleBlur = (campo) => () => {
    const todos = validarFormulario(
      form,
      creando,
      odontologos,
      editandoId
    );
    setErroresCampos((prev) => {
      const copia = { ...prev };
      if (todos[campo]) copia[campo] = todos[campo];
      else delete copia[campo];
      return copia;
    });
  };

  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
    setPerfilListo(true);
  };

  /* ------------------------------------------------------------
     GUARDAR
     ------------------------------------------------------------ */
  const handleGuardar = async () => {
    const errores = validarFormulario(
      form,
      creando,
      odontologos,
      editandoId,
    );

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError(null);
      requestAnimationFrame(() => scrollAlPrimerCampo(formularioRef.current, errores));
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: form.telefono.trim().replace(/[\s()-]/g, ''),
        cedula: mayus(form.cedula),
        ids_clinicas: form.ids_clinicas.map(Number),
      };

      // 1. Datos del odontólogo (y sus clínicas)
      let idGuardado = editandoId;
      if (editandoId) {
        await odontologosApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        const creado = await odontologosApi.crear({
          ...datosBase,
          correo: form.correo.trim().toLowerCase(),
          contrasena: form.contrasena,
        });
        idGuardado = idDeRespuesta(creado);

        // Si el backend no devuelve el id, se busca el odontólogo recién creado
        if (!idGuardado) {
          const lista = comoLista(await odontologosApi.listar(), 'odontologos');
          idGuardado =
            lista.find(
              (o) =>
                (datosBase.cedula && o.cedula === datosBase.cedula) ||
                o.telefono === datosBase.telefono
            )?.id_odontologo ?? null;
        }
      }

      // 2. Especialidades y horario semanal
      if (perfilListo && idGuardado) {
        try {
          await odontologosApi.guardarPerfil(idGuardado, {
            ids_especialidades: form.ids_especialidades.map(Number),
            horarios: expandirBloques(form.bloques),
          });
        } catch (err) {
          // El odontólogo ya quedó guardado: se pasa a modo edición para reintentar
          // sin crear otro duplicado.
          await cargar();
          setEditandoId(idGuardado);
          setForm((prev) => ({ ...prev, correo: '', contrasena: '', confirmarContrasena: '' }));
          setError(
            `El odontólogo se guardó, pero no se pudo guardar su horario o especialidades: ${
              err.message || 'error desconocido'
            }`
          );
          return false;
        }
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el odontólogo');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (id) => {
    const o = odontologos.find((x) => x.id_odontologo === id);
    if (!o) return;

    // El backend manda ids_clinicas; si no viniera, se arma desde clinicas
    const idsClinicas = Array.isArray(o.ids_clinicas)
      ? o.ids_clinicas
      : Array.isArray(o.clinicas)
        ? o.clinicas.map((c) => c.id_clinica)
        : [];

    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setPerfilListo(false);
    setForm({
      ...FORM_INICIAL,
      nombre: (o.nombre ?? '').toUpperCase(),
      ape_pat: (o.ape_pat ?? '').toUpperCase(),
      ape_mat: (o.ape_mat ?? '').toUpperCase(),
      telefono: o.telefono ?? '',
      cedula: o.cedula ?? '',
      ids_clinicas: idsClinicas.map(Number),
      idusuario: o.id_usuario != null ? String(o.id_usuario) : '',
    });

    // Especialidades y horario actuales
    try {
      const perfil = await odontologosApi.obtenerPerfil(id);
      setForm((prev) => ({
        ...prev,
        ids_especialidades: (perfil?.ids_especialidades ?? []).map(Number),
        bloques: agruparHorarios(perfil?.horarios ?? []),
      }));
      setPerfilListo(true);
    } catch (err) {
      console.error('Error al cargar el perfil del odontólogo:', err);
      setError(
        'No se pudieron cargar sus especialidades y horario. Puedes editar los demás datos; ' +
          'el horario no se modificará.'
      );
    }
  };

  const handleEliminar = async (id) => {
    await odontologosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await odontologosApi.reactivar(id);
    await cargar();
  };

  // Clase para marcar el input en rojo si tiene error
  const claseConError = (campo) =>
    erroresCampos[campo]
      ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500`
      : inputClass;

  /* ------------------------------------------------------------
     FORMULARIO (misma vista, solo agregamos clases y mensajes)
     ------------------------------------------------------------ */
  const formularioOdontologo = (
    <>
    <AvisoGeneral mensaje={error} />
    <div ref={formularioRef} className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2">

      {/* Datos personales */}
      <Seccion titulo="Datos personales">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div data-campo="nombre">
            <Etiqueta requerido>Nombre(s):</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. LAURA"
              className={claseConError('nombre')}
              value={form.nombre}
              onChange={handleChange('nombre')}
              onBlur={handleBlur('nombre')}
            />
            {erroresCampos.nombre && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.nombre}
              </p>
            )}
          </div>
          <div data-campo="telefono">
            <Etiqueta requerido>Teléfono:</Etiqueta>
            <input
              type="tel"
              maxLength={10}
              placeholder="Ej. 6671234567"
              className={claseConError('telefono')}
              value={form.telefono}
              onChange={handleChange('telefono')}
              onBlur={handleBlur('telefono')}
              inputMode="numeric"
            />
            {erroresCampos.telefono && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.telefono}
              </p>
            )}
          </div>
          <div data-campo="ape_pat">
            <Etiqueta requerido>Apellido paterno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. GÓMEZ"
              className={claseConError('ape_pat')}
              value={form.ape_pat}
              onChange={handleChange('ape_pat')}
              onBlur={handleBlur('ape_pat')}
            />
            {erroresCampos.ape_pat && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.ape_pat}
              </p>
            )}
          </div>
          <div data-campo="ape_mat">
            <Etiqueta>Apellido materno:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. RÍOS"
              className={claseConError('ape_mat')}
              value={form.ape_mat}
              onChange={handleChange('ape_mat')}
              onBlur={handleBlur('ape_mat')}
            />
            {erroresCampos.ape_mat && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.ape_mat}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      {/* Datos profesionales */}
      <Seccion titulo="Datos profesionales">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <div data-campo="cedula">
            <Etiqueta>Cédula profesional:</Etiqueta>
            <input
              type="text"
              maxLength={MAX_CEDULA}
              placeholder="Ej. 12345678"
              className={claseConError('cedula')}
              value={form.cedula}
              onChange={handleChange('cedula')}
              onBlur={handleBlur('cedula')}
              inputMode="numeric"
            />
            {erroresCampos.cedula && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.cedula}
              </p>
            )}
          </div>

          <div data-campo="ids_clinicas" className="md:col-span-2">
            <Etiqueta requerido={creando}>
              Clínicas donde trabaja
              {form.ids_clinicas.length > 0 && (
                <span className="ml-2 font-normal text-slate-500 dark:text-on-surface-variant">
                  ({form.ids_clinicas.length}{' '}
                  {form.ids_clinicas.length === 1 ? 'seleccionada' : 'seleccionadas'})
                </span>
              )}
              :
            </Etiqueta>
            <div
              className={`max-h-48 overflow-y-auto rounded-lg border bg-white p-1 md:rounded-xl md:p-2 dark:bg-surface-container ${
                erroresCampos.ids_clinicas ? 'border-red-400' : 'border-slate-200 dark:border-outline-variant'
              }`}
            >
              {opcionesClinica.length === 0 ? (
                <p className="px-2 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                  No hay clínicas disponibles.
                </p>
              ) : (
                opcionesClinica.map((c) => {
                  const id = Number(c.id_clinica);
                  const marcada = form.ids_clinicas.includes(id);
                  return (
                    <label
                      key={c.id_clinica}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors md:gap-3 md:py-2 md:text-base ${
                        marcada ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-400' : 'text-slate-700 hover:bg-slate-50 dark:text-on-surface dark:hover:bg-surface-container-high'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-teal-600"
                        checked={marcada}
                        onChange={() => toggleClinica(id)}
                      />
                      <span className="flex-1">{c.nombre}</span>
                      {!c.activo && (
                        <span className="text-xs text-slate-400 dark:text-outline">Inactiva</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {erroresCampos.ids_clinicas && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.ids_clinicas}
              </p>
            )}
          </div>

          <div data-campo="ids_especialidades" className="md:col-span-2">
            <Etiqueta>
              Especialidades
              {form.ids_especialidades.length > 0 && (
                <span className="ml-2 font-normal text-slate-500 dark:text-on-surface-variant">
                  ({form.ids_especialidades.length}{' '}
                  {form.ids_especialidades.length === 1 ? 'seleccionada' : 'seleccionadas'})
                </span>
              )}
              :
            </Etiqueta>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 md:rounded-xl md:p-2 dark:border-outline-variant dark:bg-surface-container">
              {!perfilListo ? (
                <p className="px-2 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                  Cargando especialidades...
                </p>
              ) : especialidades.length === 0 ? (
                <p className="px-2 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                  No hay especialidades disponibles.
                </p>
              ) : (
                especialidades.map((e) => {
                  const id = Number(e.id_especialidad);
                  const marcada = form.ids_especialidades.includes(id);
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors md:gap-3 md:py-2 md:text-base ${
                        marcada ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-400' : 'text-slate-700 hover:bg-slate-50 dark:text-on-surface dark:hover:bg-surface-container-high'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-teal-600"
                        checked={marcada}
                        onChange={() => toggleEspecialidad(id)}
                      />
                      <span className="flex-1">{e.nombre}</span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-on-surface-variant">
              Un servicio que requiere una especialidad solo se agenda con quien la tenga.
            </p>
          </div>
        </div>
      </Seccion>

      {/* Horario de atención */}
      <Seccion titulo="Horario de atención">
        <div data-campo="horarios" className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 md:text-sm dark:text-on-surface-variant">
            Elige los días y las horas en que atiende en cada clínica. Sin horario no se le
            asignan citas.
          </p>

          {!perfilListo && (
            <p className="text-sm text-slate-500 dark:text-on-surface-variant">Cargando horario...</p>
          )}

          {perfilListo &&
            form.bloques.map((b) => (
              <div
                key={b.clave}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:rounded-xl md:p-4 dark:border-outline-variant dark:bg-surface-container"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <div>
                    <Etiqueta requerido>Clínica:</Etiqueta>
                    <select
                      className={inputClass}
                      value={b.id_clinica}
                      onChange={(e) => cambiarBloque(b.clave, { id_clinica: Number(e.target.value) })}
                    >
                      {clinicasSeleccionadas.map((c) => (
                        <option key={c.id_clinica} value={Number(c.id_clinica)}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Etiqueta requerido>Duración de cada cita:</Etiqueta>
                    <select
                      className={inputClass}
                      value={b.duracion}
                      onChange={(e) => cambiarBloque(b.clave, { duracion: Number(e.target.value) })}
                    >
                      {DURACIONES.map((min) => (
                        <option key={min} value={min}>
                          {min} minutos
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Etiqueta requerido>Días:</Etiqueta>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map((d) => {
                      const activo = b.dias.includes(d.n);
                      return (
                        <button
                          key={d.n}
                          type="button"
                          title={d.nombre}
                          aria-label={d.nombre}
                          aria-pressed={activo}
                          onClick={() => toggleDia(b.clave, d.n)}
                          className={`h-9 w-9 cursor-pointer rounded-full border text-sm font-semibold transition-colors ${
                            activo
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-outline-variant dark:bg-surface-container dark:text-on-surface dark:hover:bg-surface-container-high'
                          }`}
                        >
                          {d.corto}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Etiqueta requerido>Desde:</Etiqueta>
                    <input
                      type="time"
                      className={inputClass}
                      value={b.hora_inicio}
                      onChange={(e) => cambiarBloque(b.clave, { hora_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Etiqueta requerido>Hasta:</Etiqueta>
                    <input
                      type="time"
                      className={inputClass}
                      value={b.hora_fin}
                      onChange={(e) => cambiarBloque(b.clave, { hora_fin: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => quitarBloque(b.clave)}
                  className="inline-flex w-fit cursor-pointer items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-error"
                >
                  <Trash2 size={14} /> Quitar este horario
                </button>
              </div>
            ))}

          {perfilListo && form.bloques.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-surface-container dark:text-on-surface-variant">
              <Clock size={16} aria-hidden="true" /> Todavía no tiene horario.
            </p>
          )}

          <button
            type="button"
            onClick={agregarBloque}
            disabled={!perfilListo || clinicasSeleccionadas.length === 0}
            className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-lg border border-teal-600 px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent dark:text-teal-400 dark:hover:bg-teal-950"
          >
            <Plus size={16} /> Agregar horario
          </button>
          {clinicasSeleccionadas.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-on-surface-variant">
              Primero selecciona la clínica donde trabaja.
            </p>
          )}

          {erroresCampos.horarios && (
            <p className="text-xs text-red-600 dark:text-error">{erroresCampos.horarios}</p>
          )}
        </div>
      </Seccion>

      {/* Datos de acceso */}
      {creando && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2 dark:border-outline-variant dark:bg-surface-container">
          <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm dark:text-teal-400">
            <KeyRound size={14} aria-hidden="true" /> Datos de acceso
          </legend>
          <p className="hidden text-sm text-slate-500 md:block dark:text-on-surface-variant">
            Con estos datos el odontólogo iniciará sesión en el sistema.
          </p>

          <div data-campo="correo">
            <Etiqueta requerido>Correo electrónico:</Etiqueta>
            <input
              type="email"
              autoComplete="off"
              maxLength={MAX_CORREO}
              placeholder="odontologo@correo.com"
              className={claseConError('correo')}
              value={form.correo}
              onChange={handleChange('correo')}
              onBlur={handleBlur('correo')}
            />
            {erroresCampos.correo && (
              <p className="mt-1 text-xs text-red-600 dark:text-error">
                {erroresCampos.correo}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div data-campo="contrasena">
              <Etiqueta requerido>Contraseña:</Etiqueta>
              <div className="relative">
                <input
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crea una contraseña"
                  className={`${claseConError('contrasena')} pr-12! md:pr-12!`}
                  value={form.contrasena}
                  onChange={handleChange('contrasena')}
                  onBlur={handleBlur('contrasena')}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((valor) => !valor)}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 dark:text-outline dark:hover:text-on-surface"
                >
                  {verContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ChecklistContrasena contrasena={form.contrasena} />
              <AvisoCampo mensaje={erroresCampos.contrasena} />
            </div>
            <div data-campo="confirmarContrasena">
              <Etiqueta requerido>Confirmar contraseña:</Etiqueta>
              <div className="relative">
                <input
                  type={verConfirmar ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  className={`${claseConError('confirmarContrasena')} pr-12! md:pr-12!`}
                  value={form.confirmarContrasena}
                  onChange={handleChange('confirmarContrasena')}
                  onBlur={handleBlur('confirmarContrasena')}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar((valor) => !valor)}
                  aria-label={verConfirmar ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 dark:text-outline dark:hover:text-on-surface"
                >
                  {verConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {erroresCampos.confirmarContrasena && (
                <p className="mt-1 text-xs text-red-600 dark:text-error">
                  {erroresCampos.confirmarContrasena}
                </p>
              )}
            </div>
          </div>
        </fieldset>
      )}
    </div>
    </>
  );

  return (
    <CatalogoPage
      titulo="Odontólogos"
      subtitulo="Gestiona el personal odontológico, sus clínicas, especialidades y horarios."
      textoBotonNuevo="Agregar odontólogo"
      placeholderBusqueda="Buscar por nombre, cédula, correo o clínica..."
      datos={odontologos.map(mapearOdontologo)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Stethoscope />,
        titulo: editandoId ? 'Editar Odontólogo' : 'Nuevo Odontólogo',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Odontólogo',
        contenido: formularioOdontologo,
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}