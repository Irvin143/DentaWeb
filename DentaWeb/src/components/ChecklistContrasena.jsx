import { Check, Circle } from 'lucide-react';

export const REGLAS_CONTRASENA = [
  {
    id: 'espacios',
    label: 'No puede ser solo espacios',
    mensaje: 'La contraseña no puede ser solo espacios.',
    cumple: (contrasena) => contrasena.trim().length > 0,
  },
  {
    id: 'longitud',
    label: 'Entre 8 y 72 caracteres',
    mensaje: 'La contraseña debe tener entre 8 y 72 caracteres.',
    cumple: (contrasena) => contrasena.length >= 8 && contrasena.length <= 72,
  },
  {
    id: 'mayuscula',
    label: 'Una mayúscula',
    mensaje: 'La contraseña debe incluir al menos una mayúscula.',
    cumple: (contrasena) => /\p{Lu}/u.test(contrasena),
  },
  {
    id: 'minuscula',
    label: 'Una minúscula',
    mensaje: 'La contraseña debe incluir al menos una minúscula.',
    cumple: (contrasena) => /\p{Ll}/u.test(contrasena),
  },
  {
    id: 'numero',
    label: 'Un número',
    mensaje: 'La contraseña debe incluir al menos un número.',
    cumple: (contrasena) => /\p{Nd}/u.test(contrasena),
  },
  {
    id: 'especial',
    label: 'Un carácter especial',
    mensaje: 'La contraseña debe incluir al menos un carácter especial.',
    cumple: (contrasena) => /[^\p{L}\p{N}\s]/u.test(contrasena),
  },
];

export function errorContrasena(contrasena) {
  const fallo = REGLAS_CONTRASENA.find((regla) => !regla.cumple(contrasena));
  return fallo ? fallo.mensaje : null;
}

export function ChecklistContrasena({ contrasena }) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {REGLAS_CONTRASENA.map((regla) => {
        const cumplida = regla.cumple(contrasena ?? '');
        return (
          <li
            key={regla.id}
            className={`flex items-center gap-2 text-xs ${cumplida ? 'text-teal-600' : 'text-slate-400'}`}
          >
            {cumplida ? (
              <Check className="shrink-0 text-teal-600" size={14} strokeWidth={2.5} />
            ) : (
              <Circle className="shrink-0 text-slate-300" size={14} />
            )}
            {regla.label}
          </li>
        );
      })}
    </ul>
  );
}
