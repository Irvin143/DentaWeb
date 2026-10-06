export function AvisoCampo({ mensaje }) {
  if (!mensaje) return null;
  return <p className="mt-1 text-xs text-red-600">{mensaje}</p>;
}

export function AvisoGeneral({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 md:rounded-xl md:p-3 md:text-sm" role="alert">
      {mensaje}
    </p>
  );
}

export function scrollAlPrimerCampo(raiz, errores) {
  const campo = Object.keys(errores ?? {})[0];
  if (!campo || !raiz) return;
  raiz.querySelector(`[data-campo="${campo}"]`)?.scrollIntoView({ block: 'nearest' });
}
