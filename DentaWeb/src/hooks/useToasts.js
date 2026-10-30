import { useCallback, useEffect, useRef, useState } from 'react';

// Maneja la lista de notificaciones que muestra <ToastContainer />.
//
//   const { toasts, exito, error, cerrar } = useToasts();
//   exito('Cita agendada');
//   error('No pudimos guardar');
//   <ToastContainer toasts={toasts} onCerrar={cerrar} />
//
// Cada toast: { id, tipo: 'exito' | 'error', mensaje, visible }. "visible" controla la animación:
// entra con visible = false y pasa a true un instante después; al cerrar vuelve a false y se
// quita de la lista cuando termina la animación de salida.

const DURACION_EXITO = 4000; // ms que se ve un mensaje de éxito
const DURACION_ERROR = 7000; // los errores se dejan más tiempo para poder leerlos
const TIEMPO_ENTRADA = 20; // ms antes de pasar a visible, para que la animación de entrada corra
const TIEMPO_SALIDA = 300; // igual que la animación del contenedor (duration-300)
const MAXIMO = 3; // toasts a la vez; si llega otro, sale el más viejo

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(1);
  const temporizadores = useRef(new Set()); // todos los timeouts, para limpiarlos al desmontar
  const cierres = useRef(new Map()); // id → timeout del cierre automático

  const programar = useCallback((funcion, ms) => {
    const t = setTimeout(() => {
      temporizadores.current.delete(t);
      funcion();
    }, ms);
    temporizadores.current.add(t);
    return t;
  }, []);

  // Animación de salida y, al terminar, se quita de la lista
  const cerrar = useCallback(
    (id) => {
      const pendiente = cierres.current.get(id);
      if (pendiente) {
        clearTimeout(pendiente);
        temporizadores.current.delete(pendiente);
        cierres.current.delete(id);
      }
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
      programar(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TIEMPO_SALIDA);
    },
    [programar]
  );

  const agregar = useCallback(
    (tipo, mensaje, duracion) => {
      const id = siguienteId.current;
      siguienteId.current += 1;

      setToasts((prev) => [...prev, { id, tipo, mensaje, visible: false }].slice(-MAXIMO));
      programar(
        () => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t))),
        TIEMPO_ENTRADA
      );
      cierres.current.set(
        id,
        programar(() => cerrar(id), duracion ?? (tipo === 'error' ? DURACION_ERROR : DURACION_EXITO))
      );
      return id;
    },
    [cerrar, programar]
  );

  const exito = useCallback((mensaje, duracion) => agregar('exito', mensaje, duracion), [agregar]);
  const error = useCallback((mensaje, duracion) => agregar('error', mensaje, duracion), [agregar]);

  // Al salir de la pantalla no debe quedar ningún temporizador activo
  useEffect(() => {
    const activos = temporizadores.current;
    return () => {
      activos.forEach(clearTimeout);
      activos.clear();
    };
  }, []);

  return { toasts, exito, error, cerrar };
}