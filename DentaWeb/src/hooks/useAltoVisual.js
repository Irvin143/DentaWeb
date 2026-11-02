import { useEffect } from 'react';

// iOS 26 Safari compacto: svh/dvh no coinciden con el hueco visible (Liquid Glass).
export function useAltoVisual() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const sync = () => {
      document.documentElement.style.setProperty('--app-vvh', `${vv.height}px`);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);
}
