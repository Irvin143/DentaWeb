import { ChevronLeft, ChevronRight } from 'lucide-react';
import { aYmd, primerDiaMes } from './Utils.js';

const LOCALE = 'es-MX';
const DIAS_CABECERA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const inicioDia = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

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

const ultimoDiaMes = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const capitalizar = (texto) => {
  const t = String(texto ?? '').trim();
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase(LOCALE) + t.slice(1);
};

const etiquetaMes = (date) =>
  capitalizar(date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));

const etiquetaDia = (date) =>
  capitalizar(
    date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  );

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

const claseFlecha =
  'flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-primary hover:text-on-surface disabled:pointer-events-none disabled:opacity-40';

export default function CalendarioMes({
  mesVisible,
  fechaSeleccionada,
  disponibles,
  onSeleccionar,
  onMesAnterior,
  onMesSiguiente,
  onHoy,
  puedeAnterior,
  puedeSiguiente,
  disabled = false,
  botonHoyRef,
  primerClicableRef,
}) {
  const celdas = celdasDelMes(mesVisible);
  const hoyYmd = aYmd(inicioDia(new Date()));
  const mesActual = mesVisible.getMonth();
  const primerClicableYmd = celdas
    .map((dia) => ({ dia, ymd: aYmd(dia) }))
    .find(({ dia, ymd }) => dia.getMonth() === mesActual && disponibles.has(ymd))?.ymd;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-outline-variant bg-surface p-1">
          <button
            type="button"
            title="Mes anterior"
            aria-label="Mes anterior"
            onClick={onMesAnterior}
            disabled={disabled || !puedeAnterior}
            className={claseFlecha}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Mes siguiente"
            aria-label="Mes siguiente"
            onClick={onMesSiguiente}
            disabled={disabled || !puedeSiguiente}
            className={claseFlecha}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          ref={botonHoyRef}
          type="button"
          onClick={onHoy}
          disabled={disabled}
          className="rounded-xl bg-teal-50 dark:bg-teal-950 px-3.5 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 transition-colors hover:bg-teal-100 dark:hover:bg-teal-900 disabled:cursor-default disabled:opacity-60"
        >
          Hoy
        </button>
        <p className="text-sm font-semibold text-on-surface">{etiquetaMes(mesVisible)}</p>
      </div>

      <div role="grid" aria-label="Calendario de nueva fecha">
        <div role="row" className="grid grid-cols-7">
          {DIAS_CABECERA.map((etiqueta) => (
            <div
              key={etiqueta}
              role="columnheader"
              className="px-1 py-1.5 text-center text-[11px] font-bold tracking-wider uppercase text-on-surface-variant"
            >
              {etiqueta}
            </div>
          ))}
        </div>
        <div role="row" className="grid grid-cols-7">
          {celdas.map((dia) => {
            const ymd = aYmd(dia);
            const enMes = dia.getMonth() === mesActual;
            const esHoy = ymd === hoyYmd;
            const seleccionado = fechaSeleccionada === ymd;
            const clicable = enMes && disponibles.has(ymd);
            const esPrimerClicable = clicable && ymd === primerClicableYmd;

            return (
              <div key={ymd} role="gridcell" className="flex items-center justify-center p-0.5">
                <button
                  ref={esPrimerClicable ? primerClicableRef : null}
                  type="button"
                  aria-label={etiquetaDia(dia)}
                  aria-pressed={seleccionado}
                  aria-disabled={!clicable}
                  onClick={() => clicable && onSeleccionar(ymd)}
                  disabled={disabled || !clicable}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    seleccionado
                      ? 'bg-teal-600 text-white'
                      : clicable
                        ? esHoy
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'text-on-surface hover:bg-teal-50 dark:hover:bg-teal-950'
                        : esHoy && enMes
                          ? 'bg-teal-600/40 text-white'
                          : enMes
                            ? 'text-outline'
                            : 'text-outline/50'
                  } ${clicable ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
                >
                  {dia.getDate()}
                  {clicable && !seleccionado && !esHoy ? (
                    <span
                      className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
