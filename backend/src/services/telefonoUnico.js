import conexion from './conexion.js';

const FRASES = {
    paciente: 'Ese teléfono ya pertenece a un paciente.',
    odontologo: 'Ese teléfono ya pertenece a un odontólogo.',
};

// Busca los 10 dígitos en pacientes y odontólogos. El registro que se edita no cuenta.
export async function conflictoTelefono(digitos, { idPaciente = null, idOdontologo = null } = {}) {
    const { rows } = await conexion.query(
        `SELECT tipo FROM (
            SELECT 'paciente' AS tipo
            FROM Pacientes
            WHERE regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') = $1
              AND ($2::int IS NULL OR idPaciente <> $2)
            UNION ALL
            SELECT 'odontologo'
            FROM odontologos
            WHERE regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') = $1
              AND ($3::int IS NULL OR idOdontologo <> $3)
        ) ocupados
        LIMIT 1`,
        [digitos, idPaciente, idOdontologo]
    );
    return FRASES[rows[0]?.tipo] ?? null;
}
