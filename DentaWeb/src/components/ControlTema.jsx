import { Moon, Sun } from 'lucide-react';
import { useTema } from '../hooks/useTema.js';

export default function ControlTema() {
  const { oscuro, alternarTema } = useTema();

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-pressed={oscuro}
      aria-label="Tema oscuro"
      className="relative h-8 w-14 shrink-0 cursor-pointer rounded-full bg-slate-200 p-1 transition-colors dark:bg-surface-container-high"
    >
      <span
        className={`theme-switch-thumb flex h-6 w-6 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm transition-transform ${
          oscuro ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {oscuro ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
      </span>
    </button>
  );
}
