import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function ModalGenerico({
  isOpen = true,
  onClose,
  onGuardar,
  iconoCabecera,
  titulo,
  badgeCabecera,
  textoBotonGuardar,
  guardando = false,
  children,
}) {
  const cerrarRef = useRef(onClose);
  const ocupadoRef = useRef(guardando);
  cerrarRef.current = onClose;
  ocupadoRef.current = guardando;

  useEffect(() => {
    if (!isOpen) return undefined;
    const alPresionar = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (ocupadoRef.current) return;
      cerrarRef.current();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-on-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-outline-variant">
          <div className="flex items-center gap-3">
            {React.isValidElement(iconoCabecera) &&
              React.cloneElement(iconoCabecera, {
                size: 18,
                'aria-hidden': true,
                className: 'text-teal-600 dark:text-teal-400',
              })}
            <h2 className="text-lg font-bold text-slate-800 dark:text-on-surface">{titulo}</h2>
            {badgeCabecera && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                {badgeCabecera}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-surface-container dark:hover:text-on-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 dark:text-on-surface">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-outline-variant">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-outline-variant dark:text-on-surface-variant dark:hover:bg-surface-container"
            >
              Cancelar
            </button>
          <button
            onClick={onGuardar ?? onClose}
            disabled={guardando}
            className="cursor-pointer rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {textoBotonGuardar}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}