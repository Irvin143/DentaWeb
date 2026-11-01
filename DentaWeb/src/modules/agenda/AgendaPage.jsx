import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { citasApi } from '../../services/api.js';
import { BadgeEstado } from '../../utils/estadoCita.jsx';
import ModalDetalleCita from './ModalDetalleCita.jsx';

const LOCALE = 'es-MX';
const DIAS_CABECERA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const VISTAS = [
  { id: 'mes', etiqueta: 'Mes' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'dia', etiqueta: 'Día' },
];

const claseCampo =
  'h-10 w-full rounded-xl border border-outline-variant bg-on-primary px-3 text-sm text-on-surface focus:ring-2 focus:ring-teal-500/20 focus:outline-none';

const claseVista =
  'h-10 w-auto min-w-[8rem] rounded-xl border border-outline-variant bg-on-primary px-3 text-sm text-on-surface focus:ring-2 focus:ring-teal-500/20 focus:outline-none';

const comoLista = (resp) =>
  Array.isArray(resp) ? resp : resp?.citas ?? resp?.data ?? [];

const inicioDia = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const aYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (date, n) => {
  const x = inicioDia(date);
  x.setDate(x.getDate() + n);
  return x;
};

const lunesDe = (date) => {
  const x = inicioDia(date);
  const dia = x.getDay();
  x.setDate(x.getDate() + (dia === 0 ? -6 : 1 - dia));
  return x;
};

const primerDiaMes = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const ultimoDiaMes = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const capitalizar = (texto) => {
  const t = String(texto ?? '').trim();
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase(LOCALE) + t.slice(1);
};

const etiquetaRango = (lunes) => {
  const domingo = addDays(lunes, 6);
  const optsDia = { day: 'numeric', month: 'short' };
  const mismoAnio = lunes.getFullYear() === domingo.getFullYear();
  const inicio = lunes.toLocaleDateString(LOCALE, {
    ...optsDia,
    year: mismoAnio ? undefined : 'numeric',
  });
  const fin = domingo.toLocaleDateString(LOCALE, { ...optsDia, year: 'numeric' });
  return `${inicio} – ${fin}`;
};

const etiquetaPeriodo = (vista, ancla) => {
  if (vista === 'mes') {
    return capitalizar(ancla.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));
  }
  if (vista === 'semana') return etiquetaRango(lunesDe(ancla));
  return capitalizar(
    ancla.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
};

const minutosDe = (hhmm) => {
  const [h, m] = String(hhmm ?? '00:00')
    .split(':')
    .map((parte) => Number(parte));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const horaCorta = (valor) => String(valor ?? '').slice(0, 5);

const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const nombrePaciente = (paciente) =>
  [paciente?.nombre, paciente?.ape_pat, paciente?.ape_mat].filter(Boolean).join(' ').trim() ||
  'Paciente';

const nombreOdontologo = (odontologo) =>
  [odontologo?.nombre, odontologo?.ape_pat].filter(Boolean).join(' ').trim() || 'Odontólogo';

const nombreClinica = (clinica) => String(clinica?.nombre ?? '').trim() || 'Clínica';

const esUrgencia = (cita) => /urgenc/i.test(String(cita?.tipo ?? ''));

const opcionesUnicas = (citas, getId, getLabel) => {
  const mapa = new Map();
  for (const cita of citas) {
    const id = getId(cita);
    if (id == null || id === '') continue;
    const clave = String(id);
    if (!mapa.has(clave)) mapa.set(clave, getLabel(cita));
  }
  return [...mapa.entries()]
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, LOCALE));
};

const rangoConsulta = (vista, ancla) => {
  if (vista === 'mes') {
    return { desde: aYmd(primerDiaMes(ancla)), hasta: aYmd(ultimoDiaMes(ancla)) };
  }
  if (vista === 'semana') {
    const lunes = lunesDe(ancla);
    return { desde: aYmd(lunes), hasta: aYmd(addDays(lunes, 6)) };
  }
  const ymd = aYmd(ancla);
  return { desde: ymd, hasta: ymd };
};

const celdasDelMes = (ancla) => {
  const inicioGrid = lunesDe(primerDiaMes(ancla));
  const finGrid = addDays(lunesDe(ultimoDiaMes(ancla)), 6);
  const dias = [];
  let actual = inicioGrid;
  while (aYmd(actual) <= aYmd(finGrid)) {
    dias.push(actual);
    actual = addDays(actual, 1);
  }
  return dias;
};

const anclaAlCambiarVista = (vistaActual, nuevaVista, ancla) => {
  if (vistaActual === nuevaVista || vistaActual !== 'mes') return ancla;
  const hoy = inicioDia(new Date());
  const mismoMes =
    hoy.getFullYear() === ancla.getFullYear() && hoy.getMonth() === ancla.getMonth();
  return mismoMes ? hoy : primerDiaMes(ancla);
};

const moverPeriodo = (ancla, vista, dir) => {
  if (vista === 'mes') return new Date(ancla.getFullYear(), ancla.getMonth() + dir, 1);
  if (vista === 'semana') return addDays(ancla, dir * 7);
  return addDays(ancla, dir);
};

const mensajeVacio = {
  mes: 'No hay citas en este mes.',
  semana: 'No hay citas en esta semana.',
  dia: 'No hay citas en este día.',
};

const etiquetaNav = {
  mes: { prev: 'Mes anterior', next: 'Mes siguiente' },
  semana: { prev: 'Semana anterior', next: 'Semana siguiente' },
  dia: { prev: 'Día anterior', next: 'Día siguiente' },
};

function TarjetaCita({ cita, densa, onAbrir }) {
  const urgencia = esUrgencia(cita);
  const hora = densa
    ? horaCorta(cita.hora)
    : [horaCorta(cita.hora), horaCorta(cita.hora_fin)].filter(Boolean).join(' – ');

  return (
    <button
      type="button"
      onClick={() => onAbrir(cita)}
      className={`w-full cursor-pointer rounded-xl border border-l-4 border-outline-variant text-left transition-colors ${
        densa ? 'px-2 py-1.5' : 'px-3 py-2.5'
      } ${
        urgencia
          ? 'border-l-error bg-error-container/40 hover:bg-error-container'
          : 'border-l-teal-600 bg-surface hover:bg-surface-container'
      }`}
    >
      <p className={`font-bold text-on-surface-variant ${densa ? 'text-[11px]' : 'text-xs'}`}>
        {hora}
      </p>
      <p
        className={`mt-0.5 font-semibold wrap-break-word text-on-surface ${
          densa ? 'text-xs' : 'text-sm'
        }`}
      >
        {nombrePaciente(cita.paciente)}
      </p>
      {!densa && cita.estado ? (
        <div className="mt-2">
          <BadgeEstado estado={cita.estado} />
        </div>
      ) : null}
    </button>
  );
}

function CabeceraDia({ dia, etiqueta, esHoy }) {
  return (
    <div className="flex items-center gap-2 lg:flex-col lg:gap-1">
      <span
        className={`text-[11px] font-bold tracking-wider uppercase ${
          esHoy ? 'text-teal-700' : 'text-on-surface-variant'
        }`}
      >
        {etiqueta}
      </span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
          esHoy ? 'bg-teal-600 text-white' : 'text-on-surface'
        }`}
      >
        {dia.getDate()}
      </span>
    </div>
  );
}

function VistaMes({ celdas, mesVisible, hoyYmd, citasPorDia, onAbrir }) {
  const enMes = (dia) => dia.getMonth() === mesVisible;

  return (
    <>
      <div className="hidden grid-cols-7 border-b border-outline-variant lg:grid">
        {DIAS_CABECERA.map((etiqueta) => (
          <div
            key={etiqueta}
            className="px-2 py-2 text-center text-[11px] font-bold tracking-wider uppercase text-on-surface-variant"
          >
            {etiqueta}
          </div>
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-7">
        {celdas.map((dia) => {
          const ymd = aYmd(dia);
          const pertenece = enMes(dia);
          const esHoy = pertenece && ymd === hoyYmd;
          const delDia = pertenece ? (citasPorDia[ymd] ?? []) : [];
          return (
            <section
              key={ymd}
              className={`flex min-h-[7.5rem] max-h-44 min-w-0 flex-col gap-1 overflow-y-auto border-r border-b border-outline-variant p-1.5 ${
                !pertenece ? 'bg-surface/70' : esHoy ? 'bg-teal-50/60' : ''
              }`}
            >
              <span
                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                  !pertenece
                    ? 'text-outline'
                    : esHoy
                      ? 'bg-teal-600 text-white'
                      : 'text-on-surface'
                }`}
              >
                {dia.getDate()}
              </span>
              {delDia.map((cita) => (
                <TarjetaCita key={cita.id_cita} cita={cita} densa onAbrir={onAbrir} />
              ))}
            </section>
          );
        })}
      </div>

      <div className="flex flex-col divide-y divide-outline-variant lg:hidden">
        {celdas.filter(enMes).map((dia) => {
          const ymd = aYmd(dia);
          const esHoy = ymd === hoyYmd;
          const delDia = citasPorDia[ymd] ?? [];
          const indice = (dia.getDay() + 6) % 7;
          return (
            <section
              key={ymd}
              className={`flex min-w-0 flex-col gap-2 p-3 ${esHoy ? 'bg-teal-50/60' : ''}`}
            >
              <CabeceraDia dia={dia} etiqueta={DIAS_CABECERA[indice]} esHoy={esHoy} />
              {delDia.map((cita) => (
                <TarjetaCita key={cita.id_cita} cita={cita} densa onAbrir={onAbrir} />
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

function VistaSemana({ dias, hoyYmd, citasPorDia, onAbrir }) {
  return (
    <>
      <div className="hidden grid-cols-7 border-b border-outline-variant lg:grid">
        {dias.map((dia, i) => {
          const ymd = aYmd(dia);
          return (
            <div key={ymd} className={`px-2 py-3 ${ymd === hoyYmd ? 'bg-teal-50' : ''}`}>
              <CabeceraDia dia={dia} etiqueta={DIAS_CABECERA[i]} esHoy={ymd === hoyYmd} />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col divide-y divide-outline-variant lg:grid lg:grid-cols-7 lg:divide-x lg:divide-y-0">
        {dias.map((dia, i) => {
          const ymd = aYmd(dia);
          const esHoy = ymd === hoyYmd;
          const delDia = citasPorDia[ymd] ?? [];
          return (
            <section
              key={ymd}
              className={`flex min-w-0 flex-col gap-2 p-3 ${esHoy ? 'bg-teal-50/60' : ''}`}
            >
              <div className="lg:hidden">
                <CabeceraDia dia={dia} etiqueta={DIAS_CABECERA[i]} esHoy={esHoy} />
              </div>
              {delDia.map((cita) => (
                <TarjetaCita key={cita.id_cita} cita={cita} onAbrir={onAbrir} />
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

function VistaDia({ dia, hoyYmd, citasDelDia, onAbrir }) {
  const ymd = aYmd(dia);
  const esHoy = ymd === hoyYmd;
  const indice = (dia.getDay() + 6) % 7;

  return (
    <section className={`flex min-w-0 flex-col gap-3 p-4 md:p-6 ${esHoy ? 'bg-teal-50/60' : ''}`}>
      <CabeceraDia dia={dia} etiqueta={DIAS_CABECERA[indice]} esHoy={esHoy} />
      {citasDelDia.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">No hay citas en este día.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {citasDelDia.map((cita) => (
            <TarjetaCita key={cita.id_cita} cita={cita} onAbrir={onAbrir} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AgendaPage() {
  const [vista, setVista] = useState('mes');
  const [ancla, setAncla] = useState(() => inicioDia(new Date()));
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [idClinica, setIdClinica] = useState('');
  const [idOdontologo, setIdOdontologo] = useState('');
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [citaAbierta, setCitaAbierta] = useState(null);

  const { desde, hasta } = useMemo(() => rangoConsulta(vista, ancla), [vista, ancla]);

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(lunesDe(ancla), i)),
    [ancla]
  );
  const celdasMes = useMemo(() => celdasDelMes(ancla), [ancla]);
  const hoyYmd = aYmd(inicioDia(new Date()));

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await citasApi.listar({ desde, hasta });
      setCitas(comoLista(data));
    } catch (err) {
      setCitas([]);
      setErrorCarga(err.message || 'No se pudieron cargar las citas.');
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const opcionesClinica = useMemo(
    () => opcionesUnicas(citas, (c) => c?.clinica?.id_clinica, (c) => nombreClinica(c.clinica)),
    [citas]
  );
  const opcionesOdontologo = useMemo(
    () =>
      opcionesUnicas(
        citas,
        (c) => c?.odontologo?.id_odontologo,
        (c) => nombreOdontologo(c.odontologo)
      ),
    [citas]
  );

  const idClinicaEfectivo = opcionesClinica.some((op) => op.id === idClinica) ? idClinica : '';
  const idOdontologoEfectivo = opcionesOdontologo.some((op) => op.id === idOdontologo)
    ? idOdontologo
    : '';

  const citasFiltradas = useMemo(() => {
    const q = normalizar(busquedaPaciente);
    return citas.filter((cita) => {
      if (idClinicaEfectivo && String(cita?.clinica?.id_clinica ?? '') !== idClinicaEfectivo) {
        return false;
      }
      if (
        idOdontologoEfectivo &&
        String(cita?.odontologo?.id_odontologo ?? '') !== idOdontologoEfectivo
      ) {
        return false;
      }
      if (q && !normalizar(nombrePaciente(cita.paciente)).includes(q)) return false;
      return true;
    });
  }, [citas, idClinicaEfectivo, idOdontologoEfectivo, busquedaPaciente]);

  const citasPorDia = useMemo(() => {
    const mapa = {};
    for (const cita of citasFiltradas) {
      const fecha = String(cita?.fecha ?? '').slice(0, 10);
      if (!fecha) continue;
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(cita);
    }
    for (const lista of Object.values(mapa)) {
      lista.sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora));
    }
    return mapa;
  }, [citasFiltradas]);

  const hayCitas = citas.length > 0;
  const hayFiltradas = citasFiltradas.length > 0;
  const nav = etiquetaNav[vista];

  const cambiarVista = (nueva) => {
    setAncla((prev) => anclaAlCambiarVista(vista, nueva, prev));
    setVista(nueva);
  };

  return (
    <section className="flex min-h-full flex-col gap-6 overflow-x-hidden bg-surface p-4 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-on-surface">Agenda</h1>
        <p className="text-sm text-on-surface-variant">Consulta las citas agendadas.</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-on-primary p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-outline-variant bg-surface p-1">
            <button
              type="button"
              title={nav.prev}
              aria-label={nav.prev}
              onClick={() => setAncla((prev) => moverPeriodo(prev, vista, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-primary hover:text-on-surface"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              title={nav.next}
              aria-label={nav.next}
              onClick={() => setAncla((prev) => moverPeriodo(prev, vista, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-primary hover:text-on-surface"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAncla(inicioDia(new Date()))}
            className="rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100"
          >
            Hoy
          </button>
          <label>
            <span className="sr-only">Vista del calendario</span>
            <select
              aria-label="Vista del calendario"
              className={claseVista}
              value={vista}
              onChange={(e) => cambiarVista(e.target.value)}
            >
              {VISTAS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-base font-bold text-on-surface">{etiquetaPeriodo(vista, ancla)}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">Clínica</span>
          <select
            className={claseCampo}
            value={idClinicaEfectivo}
            onChange={(e) => setIdClinica(e.target.value)}
          >
            <option value="">Todas las clínicas</option>
            {opcionesClinica.map((op) => (
              <option key={op.id} value={op.id}>
                {op.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">Odontólogo</span>
          <select
            className={claseCampo}
            value={idOdontologoEfectivo}
            onChange={(e) => setIdOdontologo(e.target.value)}
          >
            <option value="">Todos los odontólogos</option>
            {opcionesOdontologo.map((op) => (
              <option key={op.id} value={op.id}>
                {op.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="relative block min-w-[12rem] flex-1">
          <span className="sr-only">Buscar paciente</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline"
          />
          <input
            type="search"
            value={busquedaPaciente}
            onChange={(e) => setBusquedaPaciente(e.target.value)}
            placeholder="Buscar paciente..."
            className="h-10 w-full rounded-xl border border-outline-variant bg-on-primary pr-4 pl-9 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </label>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant bg-on-primary shadow-sm">
        {cargando ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">Cargando...</p>
        ) : errorCarga ? (
          <p className="px-5 py-12 text-center text-sm text-error">{errorCarga}</p>
        ) : !hayCitas ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">
            {mensajeVacio[vista]}
          </p>
        ) : !hayFiltradas ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">
            Ninguna cita coincide con los filtros.
          </p>
        ) : vista === 'mes' ? (
          <VistaMes
            celdas={celdasMes}
            mesVisible={ancla.getMonth()}
            hoyYmd={hoyYmd}
            citasPorDia={citasPorDia}
            onAbrir={setCitaAbierta}
          />
        ) : vista === 'semana' ? (
          <VistaSemana
            dias={diasSemana}
            hoyYmd={hoyYmd}
            citasPorDia={citasPorDia}
            onAbrir={setCitaAbierta}
          />
        ) : (
          <VistaDia
            dia={ancla}
            hoyYmd={hoyYmd}
            citasDelDia={citasPorDia[aYmd(ancla)] ?? []}
            onAbrir={setCitaAbierta}
          />
        )}
      </div>

      {citaAbierta ? (
        <ModalDetalleCita cita={citaAbierta} onCerrar={() => setCitaAbierta(null)} />
      ) : null}
    </section>
  );
}
