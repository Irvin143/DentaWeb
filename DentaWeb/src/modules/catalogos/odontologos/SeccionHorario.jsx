import { Clock, Plus, Trash2 } from 'lucide-react';
import { DIAS, DURACIONES } from './services/horarios.js';
import { Etiqueta, MensajeError, inputClass } from './Campos.jsx';

/* Horario semanal: una tarjeta por bloque (clínica + días + horas + duración de cita). */
export default function SeccionHorario({ bloques, perfilListo, clinicasSeleccionadas, error, acciones }) {
  const { agregarBloque, cambiarBloque, toggleDia, quitarBloque } = acciones;

  return (
    <div data-campo="horarios" className="flex flex-col gap-3">
      <p className="text-xs text-slate-500 md:text-sm dark:text-on-surface-variant">
        Elige los días y las horas en que atiende en cada clínica. Sin horario no se le asignan citas.
      </p>

      {!perfilListo && (
        <p className="text-sm text-slate-500 dark:text-on-surface-variant">Cargando horario...</p>
      )}

      {perfilListo &&
        bloques.map((b) => (
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

      {perfilListo && bloques.length === 0 && (
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

      <MensajeError>{error}</MensajeError>
    </div>
  );
}