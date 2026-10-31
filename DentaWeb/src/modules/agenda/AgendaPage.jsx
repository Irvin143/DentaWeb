import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { citasApi } from '../../services/api.js';
import { BadgeEstado } from '../../utils/estadoCita.jsx';

const LOCALE = 'es-MX';
const DIAS_CABECERA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const comoLista = (resp) =>
  Array.isArray(resp) ? resp : resp?.citas ?? resp?.data ?? [];

const aYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (date, n) => {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

const lunesDe = (date) => {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dia = x.getDay();
  x.setDate(x.getDate() + (dia === 0 ? -6 : 1 - dia));
  return x;
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

const minutosDe = (hhmm) => {
  const [h, m] = String(hhmm ?? '00:00')
    .split(':')
    .map((parte) => Number(parte));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const nombrePaciente = (paciente) =>
  [paciente?.nombre, paciente?.ape_pat, paciente?.ape_mat].filter(Boolean).join(' ').trim() ||
  'Paciente';

const esUrgencia = (cita) => /urgenc/i.test(String(cita?.tipo ?? ''));

function TarjetaCita({ cita }) {
  const urgencia = esUrgencia(cita);
  const hora = [cita.hora, cita.hora_fin].filter(Boolean).join(' – ');

  return (
    <article
      className={`rounded-xl border border-outline-variant border-l-4 px-3 py-2.5 ${
        urgencia ? 'border-l-error bg-error-container/40' : 'border-l-teal-600 bg-surface'
      }`}
    >
      <p className="text-xs font-bold text-on-surface-variant">{hora}</p>
      <p className="mt-0.5 text-sm font-semibold wrap-break-word text-on-surface">
        {nombrePaciente(cita.paciente)}
      </p>
      {cita.estado ? (
        <div className="mt-2">
          <BadgeEstado estado={cita.estado} />
        </div>
      ) : null}
    </article>
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

export default function AgendaPage() {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const { desde, hasta } = useMemo(
    () => ({ desde: aYmd(lunes), hasta: aYmd(addDays(lunes, 6)) }),
    [lunes]
  );

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(lunes, i)), [lunes]);
  const hoyYmd = aYmd(new Date());

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

  const citasPorDia = useMemo(() => {
    const mapa = Object.fromEntries(dias.map((d) => [aYmd(d), []]));
    for (const cita of citas) {
      const fecha = String(cita?.fecha ?? '').slice(0, 10);
      if (mapa[fecha]) mapa[fecha].push(cita);
    }
    for (const lista of Object.values(mapa)) {
      lista.sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora));
    }
    return mapa;
  }, [citas, dias]);

  const hayCitas = citas.length > 0;

  return (
    <section className="flex min-h-full flex-col gap-6 overflow-x-hidden bg-surface p-4 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-on-surface">Agenda</h1>
        <p className="text-sm text-on-surface-variant">
          Consulta las citas agendadas de la semana.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-on-primary p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-outline-variant bg-surface p-1">
            <button
              type="button"
              title="Semana anterior"
              aria-label="Semana anterior"
              onClick={() => setLunes((prev) => addDays(prev, -7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-primary hover:text-on-surface"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              title="Semana siguiente"
              aria-label="Semana siguiente"
              onClick={() => setLunes((prev) => addDays(prev, 7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-primary hover:text-on-surface"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLunes(lunesDe(new Date()))}
            className="rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100"
          >
            Hoy
          </button>
        </div>
        <p className="text-base font-bold capitalize text-on-surface">{etiquetaRango(lunes)}</p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-on-primary shadow-sm">
        {cargando ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">Cargando...</p>
        ) : errorCarga ? (
          <p className="px-5 py-12 text-center text-sm text-error">{errorCarga}</p>
        ) : !hayCitas ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">
            No hay citas en esta semana.
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-7 border-b border-outline-variant lg:grid">
              {dias.map((dia, i) => {
                const ymd = aYmd(dia);
                return (
                  <div
                    key={ymd}
                    className={`px-2 py-3 ${ymd === hoyYmd ? 'bg-teal-50' : ''}`}
                  >
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
                      <TarjetaCita key={cita.id_cita} cita={cita} />
                    ))}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
