import { useState } from 'react';

export const CLAVE_TEMA = 'clinicware-tema';
const DURACION_TRANSICION_TEMA = 180;
let temporizadorTransicion;
// Sin clave o valor distinto de 'oscuro': claro. Nunca se usa prefers-color-scheme.

export function temaDesdeDom() {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro';
}

export function aplicarTema(tema) {
  const oscuro = tema === 'oscuro';
  const raiz = document.documentElement;
  const reducirMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  clearTimeout(temporizadorTransicion);

  if (!reducirMovimiento) {
    raiz.classList.add('theme-transitioning');
    void raiz.offsetWidth;
  }

  raiz.classList.toggle('dark', oscuro);
  try {
    localStorage.setItem(CLAVE_TEMA, oscuro ? 'oscuro' : 'claro');
  } catch {
    /* almacenamiento no disponible */
  }

  if (!reducirMovimiento) {
    temporizadorTransicion = window.setTimeout(() => {
      raiz.classList.remove('theme-transitioning');
    }, DURACION_TRANSICION_TEMA);
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
