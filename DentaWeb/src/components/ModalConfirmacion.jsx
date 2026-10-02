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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="mb-6 text-sm text-slate-600">{mensaje}</p>
        
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
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
                ? 'bg-slate-300 cursor-not-allowed'
                : esPeligro 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}