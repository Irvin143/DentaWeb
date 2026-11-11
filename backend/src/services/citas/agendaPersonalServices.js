import conexion from '../conexion.js';

const ZONA = 'America/Mazatlan';

// Estados que solo se pueden aplicar cuando ya pasó la hora de la cita
const ESTADOS_SOLO_DESPUES_DE_LA_CITA = ['ATENDIDA', 'NO_ASISTIO'];

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Condición SQL para un odontólogo que consulta su agenda: únicamente sus propias citas.
// Agrega los parámetros que necesita a `params`. Requiere el alias c (citas).
function condicionOdontologo(params, idOdontologo) {
    params.push(idOdontologo);
    return `c.idOdontologo = $${params.length}::int`;
}

export async function idOdontologoDeUsuario(idUsuario) {
    const { rows } = await conexion.query(
        `SELECT o.idOdontologo AS id
         FROM odontologos o
         WHERE o.idUsuario = $1::int
         LIMIT 1`,
        [idUsuario]
    );
    return rows[0]?.id ?? null;
}

export async function idsClinicaDeUsuario(idUsuario) {
    const { rows } = await conexion.query(
        `SELECT c.idClinica AS id
         FROM clinicas c
         WHERE c.idUsuario = $1::int`,
        [idUsuario]
    );
    return rows.map((fila) => fila.id);
}

export async function listarCitasPersonal({
    desde,
    hasta,
    incluirCanceladas = false,
    idOdontologo = null,
    idsClinica = null,
} = {}) {
    const params = [desde, hasta];
    const where = ['c.fecha BETWEEN $1::date AND $2::date'];

    if (!incluirCanceladas) {
        where.push(`LOWER(c.estado) IS DISTINCT FROM 'cancelada'`);
    }

    if (idOdontologo != null) {
        where.push(condicionOdontologo(params, idOdontologo));
    }

    if (Array.isArray(idsClinica)) {
        params.push(idsClinica);
        where.push(`cl.idClinica = ANY($${params.length}::int[])`);
    }

    const { rows } = await conexion.query(
        `SELECT
            c.idCita AS id_cita,
            to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
            to_char(c.hora, 'HH24:MI') AS hora,
            to_char(c.hora_fin, 'HH24:MI') AS hora_fin,
            c.estado,
            c.observaciones,
            json_build_object(
                'nombre', p.nombre,
                'ape_pat', p.ape_pat,
                'ape_mat', p.ape_mat
            ) AS paciente,
            json_build_object(
                'id_odontologo', o.idOdontologo,
                'nombre', o.nombre,
                'ape_pat', o.ape_pat
            ) AS odontologo,
            json_build_object(
                'id_clinica', cl.idClinica,
                'nombre', cl.nombre
            ) AS clinica,
            s.nombre AS servicio,
            t.nombre AS tipo
         FROM citas c
         JOIN pacientes p ON p.idPaciente = c.idPaciente
         JOIN odontologos o ON o.idOdontologo = c.idOdontologo
         JOIN clinica_servicio cs ON cs.idClinica_Servicio = c.idClinica_Servicio
         JOIN clinicas cl ON cl.idClinica = cs.idClinica
         LEFT JOIN servicios s ON s.idServicio = cs.idServicio
         LEFT JOIN tipo_cita t ON t.idTipo = c.idTipo
         WHERE ${where.join(' AND ')}
         ORDER BY c.fecha, c.hora, c.idCita`,
        params
    );

    return rows;
}

export async function cambiarEstadoCita({
    idCita,
    estado,
    idOdontologo = null,
    idsClinica = null,
}) {
    const params = [idCita];
    const where = ['c.idCita = $1::int'];

    if (idOdontologo != null) {
        where.push(condicionOdontologo(params, idOdontologo));
    }
    if (Array.isArray(idsClinica)) {
        params.push(idsClinica);
        where.push(`cl.idClinica = ANY($${params.length}::int[])`);
    }

    const { rows } = await conexion.query(
        `SELECT c.idCita AS id,
                (c.fecha + c.hora) > (now() AT TIME ZONE '${ZONA}') AS futura
         FROM citas c
         JOIN clinica_servicio cs ON cs.idClinica_Servicio = c.idClinica_Servicio
         JOIN clinicas cl ON cl.idClinica = cs.idClinica
         WHERE ${where.join(' AND ')}
         LIMIT 1`,
        params
    );
    if (!rows[0]) throw errorHttp(404, 'No encontramos esa cita');
    if (ESTADOS_SOLO_DESPUES_DE_LA_CITA.includes(estado) && rows[0].futura) {
        const nombre = estado === 'ATENDIDA' ? 'atendida' : 'no asistió';
        throw errorHttp(409, `No se puede marcar como ${nombre} una cita que todavía no ocurre.`);
    }

    const { rows: actualizadas } = await conexion.query(
        `UPDATE citas
         SET estado = $2
         WHERE idCita = $1::int
         RETURNING idCita AS id, estado`,
        [idCita, estado]
    );
    return actualizadas[0];
}