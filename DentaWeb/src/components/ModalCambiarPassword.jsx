import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, Check, Circle } from 'lucide-react';
import { authApi } from '../services/api';

// Reglas de contraseña tomadas de register.jsx
const REGLAS_CONTRASENA = [
  {
    id: "espacios",
    label: "No puede ser solo espacios",
    mensaje: "La contraseña no puede ser solo espacios.",
    cumple: (contrasena) => contrasena.trim().length > 0,
  },
  {
    id: "longitud",
    label: "Entre 8 y 72 caracteres",
    mensaje: "La contraseña debe tener entre 8 y 72 caracteres.",
    cumple: (contrasena) => contrasena.length >= 8 && contrasena.length <= 72,
  },
  {
    id: "mayuscula",
    label: "Una mayúscula",
    mensaje: "La contraseña debe incluir al menos una mayúscula.",
    cumple: (contrasena) => /\p{Lu}/u.test(contrasena),
  },
  {
    id: "minuscula",
    label: "Una minúscula",
    mensaje: "La contraseña debe incluir al menos una minúscula.",
    cumple: (contrasena) => /\p{Ll}/u.test(contrasena),
  },
  {
    id: "numero",
    label: "Un número",
    mensaje: "La contraseña debe incluir al menos un número.",
    cumple: (contrasena) => /\p{Nd}/u.test(contrasena),
  },
  {
    id: "especial",
    label: "Un carácter especial",
    mensaje: "La contraseña debe incluir al menos un carácter especial.",
    cumple: (contrasena) => /[^\p{L}\p{N}\s]/u.test(contrasena),
  },
];

function errorContrasena(contrasena) {
  const fallo = REGLAS_CONTRASENA.find((regla) => !regla.cumple(contrasena));
  return fallo ? fallo.mensaje : null;
}

export default function ModalCambiarPassword({ isOpen, onClose, onExito }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const ocupadoRef = useRef(cargando);
  ocupadoRef.current = cargando;

  const resetearYcerrar = () => {
    setPasswordActual('');
    setPasswordNueva('');
    setShowPasswordActual(false);
    setShowPasswordNueva(false);
    setError(null);
    onClose();
  };
  const cerrarRef = useRef(resetearYcerrar);
  cerrarRef.current = resetearYcerrar;

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

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar usando las mismas reglas del registro
    const errorClave = errorContrasena(passwordNueva);
    if (errorClave) {
      setError(errorClave);
      return; 
    }

    try {
      setCargando(true);
      
      await authApi.cambiarPassword({ 
        actual: passwordActual, 
        nueva: passwordNueva 
      });

      onExito?.();
      resetearYcerrar();
    } catch (err) {
      setError(err.data?.mensaje || err.message || 'Error al actualizar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-on-primary">
        <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-on-surface">Cambiar contraseña</h3>

          <form onSubmit={handleGuardar} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-error-container dark:text-error">{error}</p>
            )}
            
            {/* Campo: Contraseña Actual */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-on-surface">Contraseña actual</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="text-slate-400 dark:text-outline" size={18} />
                </div>
                <input
                  type={showPasswordActual ? "text" : "password"}
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 pl-10 pr-12! text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-outline-variant dark:bg-surface-container dark:text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordActual(!showPasswordActual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-on-surface"
                >
                  {showPasswordActual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Campo: Nueva Contraseña */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-on-surface">Nueva contraseña</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="text-slate-400 dark:text-outline" size={18} />
                </div>
                <input
                  type={showPasswordNueva ? "text" : "password"}
                  required
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 pl-10 pr-12! text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-outline-variant dark:bg-surface-container dark:text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordNueva(!showPasswordNueva)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-on-surface"
                >
                  {showPasswordNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Reglas de validación visuales */}
              <ul className="mt-2 flex flex-col gap-1">
                {REGLAS_CONTRASENA.map((regla) => {
                  const cumplida = regla.cumple(passwordNueva);
                  // Solo evaluamos si el usuario ya empezó a escribir
                  const mostrarFeedback = passwordNueva.length > 0;
                  
                  return (
                    <li
                      key={regla.id}
                      className={`flex items-center gap-2 text-xs ${
                        !mostrarFeedback ? "text-slate-400 dark:text-outline" : cumplida ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-outline"
                      }`}
                    >
                      {mostrarFeedback && cumplida ? (
                        <Check className="shrink-0 text-teal-600 dark:text-teal-400" size={14} strokeWidth={2.5} />
                      ) : (
                        <Circle className="shrink-0 text-slate-300" size={14} />
                      )}
                      {regla.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetearYcerrar}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-outline-variant dark:text-on-surface-variant dark:hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando || !passwordActual || !passwordNueva}
                className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-surface-container-high"
              >
                {cargando ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}