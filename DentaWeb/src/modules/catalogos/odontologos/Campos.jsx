import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AvisoCampo } from '../../../components/avisosFormulario.jsx';

// Mobile: compacto. Desktop (md:): más amplio y cómodo
export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-5 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 md:rounded-xl md:px-4 md:py-3 md:text-base dark:border-outline-variant dark:bg-surface-container dark:text-on-surface dark:placeholder:text-on-surface-variant';

// Clase del input; si hay error se marca en rojo
export const claseInput = (error) =>
  error ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-500` : inputClass;

export const Etiqueta = ({ children, requerido }) => (
  <label className="mb-1 block text-xs font-medium text-slate-700 md:mb-1.5 md:text-sm dark:text-on-surface">
    {children}
    {requerido && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

export const Seccion = ({ titulo, children }) => (
  <section className="flex flex-col gap-3 md:gap-5">
    <h3 className="hidden border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800 md:block dark:border-outline-variant dark:text-on-surface">
      {titulo}
    </h3>
    {children}
  </section>
);

export const MensajeError = ({ children }) =>
  children ? <p className="mt-1 text-xs text-red-600 dark:text-error">{children}</p> : null;

// "(2 seleccionadas)" junto a una etiqueta
export const ContadorSeleccion = ({ cantidad }) =>
  cantidad > 0 ? (
    <span className="ml-2 font-normal text-slate-500 dark:text-on-surface-variant">
      ({cantidad} {cantidad === 1 ? 'seleccionada' : 'seleccionadas'})
    </span>
  ) : null;

/* Campo de texto con etiqueta y mensaje de error.
   `campo` es la clave del form y también el data-campo para el scroll al error. */
export function CampoTexto({ campo, etiqueta, requerido, error, className = '', ...inputProps }) {
  return (
    <div data-campo={campo} className={className}>
      <Etiqueta requerido={requerido}>{etiqueta}</Etiqueta>
      <input className={claseInput(error)} {...inputProps} />
      <MensajeError>{error}</MensajeError>
    </div>
  );
}

/* Campo de contraseña con ojito. El estado de "mostrar" vive aquí. */
export function CampoContrasena({ campo, etiqueta, error, children, ...inputProps }) {
  const [ver, setVer] = useState(false);
  return (
    <div data-campo={campo}>
      <Etiqueta requerido>{etiqueta}</Etiqueta>
      <div className="relative">
        <input
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          maxLength={72}
          className={`${claseInput(error)} pr-12! md:pr-12!`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 dark:text-outline dark:hover:text-on-surface"
        >
          {ver ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {children}
      <AvisoCampo mensaje={error} />
    </div>
  );
}

/* Lista con casillas (clínicas, especialidades).
   items: [{ id, nombre, inactivo? }] */
export function ListaChecks({ items, seleccionados, onToggle, vacio, cargando, textoCargando, error }) {
  return (
    <div
      className={`max-h-48 overflow-y-auto rounded-lg border bg-white p-1 md:rounded-xl md:p-2 dark:bg-surface-container ${
        error ? 'border-red-400' : 'border-slate-200 dark:border-outline-variant'
      }`}
    >
      {cargando ? (
        <p className="px-2 py-2 text-sm text-slate-500 dark:text-on-surface-variant">{textoCargando}</p>
      ) : items.length === 0 ? (
        <p className="px-2 py-2 text-sm text-slate-500 dark:text-on-surface-variant">{vacio}</p>
      ) : (
        items.map((item) => {
          const marcada = seleccionados.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors md:gap-3 md:py-2 md:text-base ${
                marcada
                  ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-400'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-on-surface dark:hover:bg-surface-container-high'
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-teal-600"
                checked={marcada}
                onChange={() => onToggle(item.id)}
              />
              <span className="flex-1">{item.nombre}</span>
              {item.inactivo && <span className="text-xs text-slate-400 dark:text-outline">Inactiva</span>}
            </label>
          );
        })
      )}
    </div>
  );
}