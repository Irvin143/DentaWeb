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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className={`w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ${esPeligro ? '' : 'p-6'}`}>
        <h3 className={esPeligro ? 'bg-error px-6 py-4 text-lg font-bold text-on-primary' : 'mb-2 text-lg font-bold text-slate-800'}>{titulo}</h3>
        <div className={esPeligro ? 'px-6 pb-6 pt-4' : undefined}>
        <p className={`mb-6 text-sm ${esPeligro ? 'font-medium text-error' : 'text-slate-600'}`}>{mensaje}</p>
        
        {/* Campo de validación de seguridad */}
        {requierePalabra && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Escribe <span className="font-bold text-slate-900">"{palabraRequerida}"</span> para continuar:
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              placeholder={palabraRequerida}
              autoComplete="off"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
                ? 'cursor-not-allowed bg-slate-300'
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