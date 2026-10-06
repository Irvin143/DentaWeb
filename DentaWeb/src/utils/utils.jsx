import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function CampoContrasena({ className, ...props }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={mostrar ? 'text' : 'password'}
        className={`${className} pr-11 md:pr-12`}
      />
      <button
        type="button"
        onClick={() => setMostrar((v) => !v)}
        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
      >
        {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}