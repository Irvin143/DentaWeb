import { useState } from 'react';

export const CLAVE_TEMA = 'clinicware-tema';
// Sin clave o valor distinto de 'oscuro': claro. Nunca se usa prefers-color-scheme.

export function temaDesdeDom() {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro';
}

export function aplicarTema(tema) {
  const oscuro = tema === 'oscuro';
  document.documentElement.classList.toggle('dark', oscuro);
  try {
    localStorage.setItem(CLAVE_TEMA, oscuro ? 'oscuro' : 'claro');
  } catch {
    /* almacenamiento no disponible */
  }
}

export function useTema() {
  const [tema, setTema] = useState(temaDesdeDom);

  function alternarTema() {
    const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro';
    aplicarTema(siguiente);
    setTema(siguiente);
  }

  return { tema, oscuro: tema === 'oscuro', alternarTema };
}
