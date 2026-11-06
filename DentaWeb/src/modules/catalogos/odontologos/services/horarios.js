// Lógica del horario semanal del odontólogo. Sin React: solo funciones puras.

// 1 = lunes … 7 = domingo (igual que ISODOW en la base de datos)
export const DIAS = [
  { n: 1, corto: 'L', nombre: 'Lunes' },
  { n: 2, corto: 'M', nombre: 'Martes' },
  { n: 3, corto: 'X', nombre: 'Miércoles' },
  { n: 4, corto: 'J', nombre: 'Jueves' },
  { n: 5, corto: 'V', nombre: 'Viernes' },
  { n: 6, corto: 'S', nombre: 'Sábado' },
  { n: 7, corto: 'D', nombre: 'Domingo' },
];

export const DURACIONES = [15, 20, 30, 45, 60];

export const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

let contadorBloques = 0;
export const bloqueNuevo = (idClinica) => {
  contadorBloques += 1;
  return {
    clave: `b${contadorBloques}`,
    id_clinica: idClinica,
    dias: [1, 2, 3, 4, 5],
    hora_inicio: '09:00',
    hora_fin: '14:00',
    duracion: 30,
  };
};

// Un bloque (clínica + varios días + horas) → una fila por día, como las guarda la base de datos
export const expandirBloques = (bloques) =>
  bloques.flatMap((b) =>
    b.dias.map((dia) => ({
      id_clinica: Number(b.id_clinica),
      dia_semana: dia,
      hora_inicio: b.hora_inicio,
      hora_fin: b.hora_fin,
      duracion_cita_min: Number(b.duracion),
    }))
  );

// Filas de la base de datos → bloques (junta los días que comparten clínica, horas y duración)
export const agruparHorarios = (filas = []) => {
  const mapa = new Map();
  filas.forEach((f) => {
    const llave = `${f.id_clinica}|${f.hora_inicio}|${f.hora_fin}|${f.duracion_cita_min}`;
    if (!mapa.has(llave)) {
      const bloque = bloqueNuevo(Number(f.id_clinica));
      bloque.dias = [];
      bloque.hora_inicio = f.hora_inicio;
      bloque.hora_fin = f.hora_fin;
      bloque.duracion = Number(f.duracion_cita_min);
      mapa.set(llave, bloque);
    }
    mapa.get(llave).dias.push(Number(f.dia_semana));
  });
  return [...mapa.values()].map((b) => ({ ...b, dias: [...b.dias].sort((a, c) => a - c) }));
};

export const validarHorarios = (bloques, idsClinicas) => {
  for (const b of bloques) {
    if (!b.id_clinica || !idsClinicas.includes(Number(b.id_clinica)))
      return 'Cada horario necesita una clínica de las seleccionadas';
    if (b.dias.length === 0) return 'Elige al menos un día en cada horario';
    if (!b.hora_inicio || !b.hora_fin) return 'Indica la hora de inicio y de fin en cada horario';
    if (aMinutos(b.hora_fin) <= aMinutos(b.hora_inicio))
      return 'La hora de fin debe ser posterior a la de inicio';
    if (aMinutos(b.hora_fin) - aMinutos(b.hora_inicio) < Number(b.duracion))
      return 'Un horario es más corto que la duración de una cita';
  }

  // Un odontólogo no puede estar en dos lugares a la vez: ningún día se empalma,
  // ni siquiera entre clínicas distintas.
  const filas = expandirBloques(bloques);
  for (let i = 0; i < filas.length; i += 1) {
    for (let j = i + 1; j < filas.length; j += 1) {
      const a = filas[i];
      const b = filas[j];
      if (
        a.dia_semana === b.dia_semana &&
        aMinutos(a.hora_inicio) < aMinutos(b.hora_fin) &&
        aMinutos(b.hora_inicio) < aMinutos(a.hora_fin)
      ) {
        const dia = DIAS.find((d) => d.n === a.dia_semana)?.nombre ?? 'un día';
        return `Los horarios se empalman el ${dia.toLowerCase()}`;
      }
    }
  }
  return null;
};