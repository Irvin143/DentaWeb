import React, { useState, useEffect } from 'react';

export default function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensaje, 
  textoConfirmar = 'Confirmar', 
  esPeligro = false,
  palabraRequerida = ''
}) {
  const [input, setInput] = useState('');

  // Limpiar el campo de texto cada vez que se abre o cierra el modal
  useEffect(() => {
    if (!isOpen) setInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const requierePalabra = palabraRequerida.length > 0;
  const botonDeshabilitado = requierePalabra && input !== palabraRequerida;

  return (
    <div className="fixed inset-0 z-50 flex animate-modal-overlay-in items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm motion-reduce:animate-none">
      <div className={`w-full max-w-md animate-modal-panel-in overflow-hidden rounded-2xl bg-white shadow-xl motion-reduce:animate-none dark:bg-on-primary ${esPeligro ? '' : 'p-6'}`}>
        <h3 className={esPeligro ? 'bg-error px-6 py-4 text-lg font-bold text-white' : 'mb-2 text-lg font-bold text-slate-800 dark:text-on-surface'}>{titulo}</h3>
        <div className={esPeligro ? 'px-6 pb-6 pt-4' : undefined}>
        {typeof mensaje === 'string' ? (
          <p className={`mb-6 text-sm ${esPeligro ? 'font-medium text-error' : 'text-slate-600 dark:text-on-surface-variant'}`}>{mensaje}</p>
        ) : (
          <div className="mb-6 text-sm">{mensaje}</div>
        )}
        
        {/* Campo de validación de seguridad */}
        {requierePalabra && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-on-surface">
              Escribe <span className="font-bold text-slate-900 dark:text-on-surface">"{palabraRequerida}"</span> para continuar:
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-outline-variant dark:bg-surface-container dark:text-on-surface"
              placeholder={palabraRequerida}
              autoComplete="off"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-outline-variant dark:text-on-surface-variant dark:hover:bg-surface-container"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (botonDeshabilitado) return;
              onConfirm();
              onClose();
            }}
            disabled={botonDeshabilitado}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-all ${
              botonDeshabilitado 
                ? 'cursor-not-allowed bg-slate-300 dark:bg-surface-container-high'
                : esPeligro 
                  ? 'cursor-pointer bg-red-500 hover:bg-red-600' 
                  : 'cursor-pointer bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}