import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const mainEl = document.querySelector('main');
    const prevMainOverflow = mainEl?.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (mainEl) mainEl.style.overflow = 'hidden';

    const alPresionar = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (ocupadoRef.current) return;
      cerrarRef.current();
    };
    window.addEventListener('keydown', alPresionar);

    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (mainEl) mainEl.style.overflow = prevMainOverflow ?? '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !ocupadoRef.current) cerrarRef.current();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-on-primary"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-outline-variant">
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
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 dark:text-on-surface">{children}</div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-outline-variant">
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
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}