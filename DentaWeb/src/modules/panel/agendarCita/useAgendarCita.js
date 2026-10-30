import { useCallback, useEffect, useMemo, useState } from 'react';
// TODO: ajusta la ruta a donde tengas tu api.js (la carpeta agendarCita está junto a AgendarCitaView.jsx)
import { serviciosApi, clinicasApi, agendarCitasApi } from '../../../services/api.js';
import {
  DIAS_A_CONSULTAR,
  TOTAL_PASOS,
  UMBRAL_BUSCADOR,
  formatearFecha,
  formatearHora,
  normalizarServicio,
  normalizarSede,
  normalizarTexto,
} from './utilidades.js';

/* ============================================================
   Catálogo de servicios: carga, filtro por categoría y búsqueda
   ============================================================ */
function useServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(false);

    serviciosApi
      .listarCatalogo()
      .then((res) => {
        if (cancelado) return;
        // Acepta un arreglo directo o { data: [...] } / { servicios: [...] }
        const lista = Array.isArray(res) ? res : res?.data ?? res?.servicios ?? [];
        setServicios(lista.map(normalizarServicio).filter((s) => s.activo));
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar servicios:', err);
        setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  // Cuántos servicios hay por categoría (para los contadores de los filtros)
  const conteos = useMemo(() => {
    const base = { todos: servicios.length, consulta: 0, estudio: 0 };
    servicios.forEach((s) => {
      if (base[s.categoria] !== undefined) base[s.categoria] += 1;
    });
    return base;
  }, [servicios]);

  // Servicios que pasan el filtro de categoría y la búsqueda
  const serviciosFiltrados = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    return servicios.filter((s) => {
      if (filtroCategoria !== 'todos' && s.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return normalizarTexto(`${s.nombre} ${s.desc}`).includes(q);
    });
  }, [servicios, filtroCategoria, busqueda]);

  return {
    servicios,
    cargando,
    error,
    reintentar,
    filtroCategoria,
    setFiltroCategoria,
    busqueda,
    setBusqueda,
    conteos,
    serviciosFiltrados,
    mostrarBuscador: servicios.length > UMBRAL_BUSCADOR,
    mostrarFiltros: conteos.consulta > 0 && conteos.estudio > 0,
  };
}

/* ============================================================
   Sedes que ofrecen el servicio elegido (se consulta al cambiar de servicio)
   ============================================================ */
function useSedes(idServicio) {
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    setSedes([]);
    setError(false);

    if (!idServicio) {
      setCargando(false);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);

    clinicasApi
      .listarSedes(idServicio)
      .then((res) => {
        if (cancelado) return;
        const lista = Array.isArray(res) ? res : res?.data ?? res?.sedes ?? [];
        setSedes(lista.map(normalizarSede));
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar sedes:', err);
        setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idServicio, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { sedes, cargando, error, reintentar };
}

/* ============================================================
   Días en los que la sede tiene horarios libres (solo esos se ofrecen en la tira de días)
   ============================================================ */
function useDiasDisponibles(idSede) {
  const [dias, setDias] = useState([]); // ['AAAA-MM-DD', ...]
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    setDias([]);
    setError(false);

    if (!idSede) {
      setCargando(false);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);

    agendarCitasApi
      .dias(idSede, DIAS_A_CONSULTAR)
      .then((res) => {
        if (cancelado) return;
        setDias(res?.dias ?? []);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar los días disponibles:', err);
        setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idSede, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { dias, cargando, error, reintentar };
}

/* ============================================================
   Horarios libres de la sede en la fecha elegida.
   Si ese día no hay ninguno, el backend también devuelve el próximo día con espacio.
   ============================================================ */
function useHorarios(idSede, fecha) {
  const [horas, setHoras] = useState([]); // ['09:00', '09:30', ...]
  const [proximoDia, setProximoDia] = useState(null); // 'AAAA-MM-DD' | null
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    setHoras([]);
    setProximoDia(null);
    setError(false);

    if (!idSede || !fecha) {
      setCargando(false);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);

    agendarCitasApi
      .horarios(idSede, fecha)
      .then((res) => {
        if (cancelado) return;
        setHoras(res?.horas ?? []);
        setProximoDia(res?.proximo_dia ?? null);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al cargar horarios:', err);
        setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idSede, fecha, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { horas, proximoDia, cargando, error, reintentar };
}

/* ============================================================
   Odontólogo que se asignaría a la cita (solo se consulta en el paso de confirmar).
   Es una propuesta: al confirmar, el servidor vuelve a calcular y puede asignar a otro.
   consultado = ya hubo respuesta; con consultado y sin odontologo, el horario se llenó.
   ============================================================ */
function useOdontologoPropuesto(idSede, fecha, hora, activo) {
  const [odontologo, setOdontologo] = useState(null);
  const [consultado, setConsultado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // para el botón "Reintentar"

  useEffect(() => {
    setOdontologo(null);
    setConsultado(false);
    setError(false);

    if (!activo || !idSede || !fecha || !hora) {
      setCargando(false);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);

    agendarCitasApi
      .odontologoPropuesto(idSede, fecha, hora)
      .then((res) => {
        if (cancelado) return;
        setOdontologo(res?.odontologo ?? null);
        setConsultado(true);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error('Error al consultar el odontólogo:', err);
        setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [activo, idSede, fecha, hora, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { odontologo, consultado, cargando, error, reintentar };
}

/* ============================================================
   Todo el estado y las acciones del flujo de agendar cita
   ============================================================ */
const FORM_INICIAL = {
  id_servicio: '',
  id_sede: '',
  fecha: '',
  hora: '',
  motivo: '',
};

export function useAgendarCita() {
  const [paso, setPaso] = useState(1);
  const [confirmada, setConfirmada] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  // El odontólogo lo asigna el backend al confirmar. Formato esperado: { nombre }
  const [odontologoAsignado, setOdontologoAsignado] = useState(null);

  const catalogo = useServicios();
  const sedesData = useSedes(form.id_servicio);
  const { sedes } = sedesData;
  const diasData = useDiasDisponibles(form.id_sede);
  const horariosData = useHorarios(form.id_sede, form.fecha);
  const propuesta = useOdontologoPropuesto(
    form.id_sede,
    form.fecha,
    form.hora,
    paso === TOTAL_PASOS && !confirmada
  );

  // Si solo hay una sede, la deja seleccionada
  useEffect(() => {
    if (sedes.length === 1) {
      setForm((f) => (f.id_sede ? f : { ...f, id_sede: sedes[0].id }));
    }
  }, [sedes]);

  const servicioActivo = catalogo.servicios.find((s) => s.id === form.id_servicio);
  const sedeActiva = sedes.find((s) => s.id === form.id_sede);

  const resumen = {
    servicio: servicioActivo,
    sede: sedeActiva,
    fechaTexto: formatearFecha(form.fecha),
    hora: formatearHora(form.hora),
    motivo: form.motivo,
  };

  const puedeContinuar =
    (paso === 1 && Boolean(form.id_servicio && form.id_sede)) ||
    (paso === 2 && Boolean(form.fecha && form.hora));

  // No se puede confirmar mientras se busca al odontólogo, ni si ya no queda ninguno libre.
  // Si la consulta falla, se deja confirmar: el servidor asigna al odontólogo de todos modos.
  const sinDisponibilidad = propuesta.consultado && !propuesta.odontologo;
  const puedeConfirmar =
    Boolean(form.id_servicio && form.id_sede && form.fecha && form.hora) &&
    !propuesta.cargando &&
    !sinDisponibilidad;

  /* ---------- navegación ---------- */
  const irAPaso = (n) => {
    setErrorEnvio(null);
    setPaso(n);
  };
  const continuar = () => irAPaso(paso + 1);
  const volverPaso = () => irAPaso(paso - 1);

  /* ---------- selección ---------- */
  // Al cambiar de servicio se pierden la sede, el día y la hora: dependen de él
  const seleccionarServicio = (id) =>
    setForm((f) =>
      f.id_servicio === id ? f : { ...f, id_servicio: id, id_sede: '', fecha: '', hora: '' }
    );

  // Cada sede tiene sus propios días y horarios libres
  const seleccionarSede = (id) =>
    setForm((f) => (f.id_sede === id ? f : { ...f, id_sede: id, fecha: '', hora: '' }));

  // Al cambiar de día se pierde la hora: los horarios libres son otros
  const seleccionarFecha = (fecha) =>
    setForm((f) => (f.fecha === fecha ? f : { ...f, fecha, hora: '' }));

  // Salta al próximo día con horarios libres (cuando el día elegido está lleno)
  const irAProximoDia = () => {
    if (horariosData.proximoDia) seleccionarFecha(horariosData.proximoDia);
  };

  const seleccionarHora = (hora) => setForm((f) => ({ ...f, hora }));
  const cambiarMotivo = (motivo) => setForm((f) => ({ ...f, motivo }));

  /* ---------- confirmar ---------- */
  const confirmar = async (e) => {
    e?.preventDefault();
    // Enter dentro de un campo (p. ej. el buscador) no debe confirmar la cita
    if (paso !== TOTAL_PASOS || cargando) return;

    setCargando(true);
    setErrorEnvio(null);
    try {
      // El backend vuelve a validar la disponibilidad y asigna al odontólogo
      const cita = await agendarCitasApi.crear({
        id_servicio: Number(form.id_servicio),
        id_sede: Number(form.id_sede),
        fecha: form.fecha,
        hora: form.hora, // 'HH:mm' de 24 h
        motivo: form.motivo.trim() || null,
      });
      setOdontologoAsignado(cita?.odontologo ?? null);
      setConfirmada(true);
    } catch (err) {
      if (err.status === 409) {
        // El horario se ocupó mientras el paciente confirmaba (o ya tiene una cita a esa hora)
        setErrorEnvio(err.message || 'Ese horario ya no está disponible. Elige otro para continuar.');
        setPaso(2);
        setForm((f) => ({ ...f, hora: '' }));
        horariosData.reintentar(); // vuelve a pedir los horarios libres
      } else {
        setErrorEnvio(err.message || 'No pudimos agendar tu cita. Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return {
    paso,
    confirmada,
    form,
    cargando,
    errorEnvio,
    odontologoAsignado,
    catalogo,
    sedesData,
    diasData,
    horariosData,
    propuesta,
    servicioActivo,
    resumen,
    puedeContinuar,
    puedeConfirmar,
    irAPaso,
    continuar,
    volverPaso,
    seleccionarServicio,
    seleccionarSede,
    seleccionarFecha,
    seleccionarHora,
    irAProximoDia,
    cambiarMotivo,
    confirmar,
  };
}