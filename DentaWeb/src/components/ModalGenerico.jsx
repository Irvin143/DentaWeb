import React from 'react';

export function ModalGenerico({ isOpen, onClose, iconoCabecera, titulo, badgeCabecera, textoBotonGuardar, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        {/* Header del Modal */}
        <div className="modal-header">
          <h2>{iconoCabecera} {titulo}</h2>
          {badgeCabecera && <span className="badge">{badgeCabecera}</span>}
          <button onClick={onClose}>X</button>
        </div>

        {/* Body: Formulario inyectado (Clínica, Doctor, Paciente) */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer del Modal */}
        <div className="modal-footer">
          <p className="texto-seguridad">🔒 Cumple protocolo sanitario & HIPAA</p>
          <button onClick={onClose} className="btn-secundario">Cancelar</button>
          <button className="btn-guardar">{textoBotonGuardar}</button>
        </div>

      </div>
    </div>
  );
}