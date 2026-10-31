import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { citasApi } from '../../services/api.js';

const LOCALE = 'es-MX';
const DIAS_CABECERA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const HORA_INICIO_DEFAULT = 8;
const HORA_FIN_DEFAULT = 20;
const PIXELS_HORA = 56;

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

const presentarEstado = (estado) => {
  const texto = String(estado ?? '').trim();
  if (!texto) return '';
  return texto.charAt(0).toLocaleUpperCase(LOCALE) + texto.slice(1).toLocaleLowerCase(LOCALE);
};

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

  const { horaInicio, horaFin } = useMemo(() => {
    let inicio = HORA_INICIO_DEFAULT * 60;
    let fin = HORA_FIN_DEFAULT * 60;
    for (const cita of citas) {
      const a = minutosDe(cita.hora);
      const b = minutosDe(cita.hora_fin || cita.hora) || a + 60;
      inicio = Math.min(inicio, Math.floor(a / 60) * 60);
      fin = Math.max(fin, Math.ceil(b / 60) * 60);
    }
    if (fin <= inicio) fin = inicio + 60;
    return { horaInicio: inicio / 60, horaFin: fin / 60 };
  }, [citas]);

  const horas = useMemo(
    () => Array.from({ length: horaFin - horaInicio }, (_, i) => horaInicio + i),
    [horaInicio, horaFin]
  );

  const alturaGrilla = (horaFin - horaInicio) * PIXELS_HORA;
  const hayCitas = citas.length > 0;

  return (
    <section className="flex min-h-full flex-col gap-6 bg-surface p-4 md:p-8">
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
            className="rounded-xl bg-surface-container px-3.5 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Hoy
          </button>
        </div>
        <p className="text-base font-bold capitalize text-on-surface">{etiquetaRango(lunes)}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-on-primary shadow-sm">
        <div className="grid grid-cols-7 border-b border-outline-variant">
          {dias.map((dia, i) => {
            const ymd = aYmd(dia);
            const esHoy = ymd === hoyYmd;
            return (
              <div
                key={ymd}
                className={`flex flex-col items-center gap-1 px-1 py-3 ${
                  esHoy ? 'bg-secondary-container/30' : ''
                }`}
              >
                <span
                  className={`text-[11px] font-bold tracking-wider uppercase ${
                    esHoy ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {DIAS_CABECERA[i]}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                    esHoy ? 'bg-primary text-on-primary' : 'text-on-surface'
                  }`}
                >
                  {dia.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {cargando ? (
          <p className="px-5 py-12 text-center text-sm text-on-surface-variant">Cargando...</p>
        ) : errorCarga ? (
          <p className="px-5 py-12 text-center text-sm text-error">{errorCarga}</p>
        ) : (
          <div className="relative overflow-x-auto">
            {!hayCitas ? (
              <p className="border-b border-outline-variant px-5 py-8 text-center text-sm text-on-surface-variant">
                No hay citas en esta semana.
              </p>
            ) : null}
            <div className="flex min-w-[52rem]">
              <div
                className="w-16 shrink-0 border-r border-outline-variant bg-surface"
                style={{ height: alturaGrilla }}
              >
                {horas.map((hora) => (
                  <div
                    key={hora}
                    className="relative border-b border-outline-variant/60"
                    style={{ height: PIXELS_HORA }}
                  >
                    <span className="absolute top-1 right-2 text-[10px] font-semibold text-on-surface-variant">
                      {String(hora).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-7">
                {dias.map((dia) => {
                  const ymd = aYmd(dia);
                  const esHoy = ymd === hoyYmd;
                  const delDia = citasPorDia[ymd] ?? [];
                  return (
                    <div
                      key={ymd}
                      className={`relative border-r border-outline-variant last:border-r-0 ${
                        esHoy ? 'bg-secondary-container/15' : 'bg-surface/40'
                      }`}
                      style={{ height: alturaGrilla }}
                    >
                      {horas.map((hora) => (
                        <div
                          key={hora}
                          className="border-b border-outline-variant/60"
                          style={{ height: PIXELS_HORA }}
                        />
                      ))}
                      {delDia.map((cita) => {
                        const inicio = minutosDe(cita.hora);
                        const finRaw = minutosDe(cita.hora_fin || cita.hora);
                        const fin = finRaw > inicio ? finRaw : inicio + 30;
                        const top = ((inicio - horaInicio * 60) / 60) * PIXELS_HORA;
                        const height = Math.max(((fin - inicio) / 60) * PIXELS_HORA, 28);
                        const urgencia = esUrgencia(cita);
                        return (
                          <article
                            key={cita.id_cita}
                            className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-2 px-1.5 py-1 ${
                              urgencia
                                ? 'border-error bg-error-container text-error'
                                : 'border-primary bg-secondary-container/50 text-primary'
                            }`}
                            style={{ top, height }}
                            title={[
                              nombrePaciente(cita.paciente),
                              cita.hora,
                              cita.hora_fin ? `– ${cita.hora_fin}` : '',
                              presentarEstado(cita.estado),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          >
                            <p className="truncate text-[11px] font-bold leading-tight">
                              {cita.hora}
                              {cita.hora_fin ? ` – ${cita.hora_fin}` : ''}
                            </p>
                            <p className="truncate text-[11px] font-semibold leading-tight text-on-surface">
                              {nombrePaciente(cita.paciente)}
                            </p>
                            {cita.estado ? (
                              <p className="truncate text-[10px] font-medium leading-tight text-on-surface-variant">
                                {presentarEstado(cita.estado)}
                              </p>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
