import React from 'react';

export function ModalGenerico({
  isOpen = true,
  onClose,
  onGuardar,
  iconoCabecera,
  titulo,
  badgeCabecera,
  textoBotonGuardar,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              {iconoCabecera} {titulo}
            </h2>
            {badgeCabecera && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {badgeCabecera}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onGuardar ?? onClose}
              className="cursor-pointer rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              {textoBotonGuardar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}