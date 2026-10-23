import { useCallback, useEffect, useMemo, useState } from 'react';
// TODO: ajusta la ruta a donde tengas tu api.js (la carpeta agendarCita está junto a AgendarCitaView.jsx)
// TODO: cuando exista, importa también citasApi
import { serviciosApi, clinicasApi } from '../../../services/api.js';
import {
  TOTAL_PASOS,
  UMBRAL_BUSCADOR,
  formatearFecha,
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
    hora: form.hora,
    motivo: form.motivo,
  };

  const puedeContinuar =
    (paso === 1 && Boolean(form.id_servicio && form.id_sede)) ||
    (paso === 2 && Boolean(form.fecha && form.hora));

  const puedeConfirmar = Boolean(form.id_servicio && form.id_sede && form.fecha && form.hora);

  /* ---------- navegación ---------- */
  const irAPaso = (n) => {
    setErrorEnvio(null);
    setPaso(n);
  };
  const continuar = () => irAPaso(paso + 1);
  const volverPaso = () => irAPaso(paso - 1);

  /* ---------- selección ---------- */
  // Al cambiar de servicio se pierden la sede y la hora: dependen de él
  const seleccionarServicio = (id) =>
    setForm((f) => (f.id_servicio === id ? f : { ...f, id_servicio: id, id_sede: '', hora: '' }));

  const seleccionarSede = (id) =>
    setForm((f) => (f.id_sede === id ? f : { ...f, id_sede: id, hora: '' }));

  const seleccionarFecha = (fecha) => setForm((f) => ({ ...f, fecha }));
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
      console.log('Datos listos para enviar a la BD:', form);
      // TODO: conectar con api.js (convertir la hora a HH:mm de 24 h antes de enviar):
      // const cita = await citasApi.crear(form);
      // setOdontologoAsignado(cita.odontologo ?? null);
      await new Promise((resolver) => setTimeout(resolver, 1000)); // simulación
      setConfirmada(true);
    } catch (err) {
      if (err.status === 409) {
        // El horario se ocupó mientras el paciente confirmaba
        setErrorEnvio('Ese horario ya no está disponible. Elige otro para continuar.');
        setPaso(2);
        setForm((f) => ({ ...f, hora: '' }));
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
    cambiarMotivo,
    confirmar,
  };
}