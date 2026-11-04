import conexion from '../conexion.js';

const ZONA = 'America/Mazatlan';

// Odontólogo genérico de urgencias (se identifica por el correo de su usuario)
const CORREO_ODONTOLOGO_URGENCIA = 'urgencia@clinicware.com';

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Condición SQL para un odontólogo que consulta su agenda: sus propias citas MÁS las urgencias
// de las sedes donde trabaja. Las urgencias se registran con el odontólogo genérico, pero las
// atiende quien esté libre, así que todos los odontólogos de la sede deben verlas.
// Agrega los parámetros que necesita a `params`. Requiere los alias c (citas) y cl (clinicas).
function condicionOdontologo(params, idOdontologo) {
    params.push(idOdontologo);
    const iOdo = params.length;
    params.push(CORREO_ODONTOLOGO_URGENCIA);
    const iCorreo = params.length;
    return `(
        c.idOdontologo = $${iOdo}::int
        OR (
            c.idOdontologo = (
                SELECT og.idOdontologo
                FROM odontologos og
                JOIN usuarios ug ON ug.idUsuario = og.idUsuario
                WHERE ug.correo = $${iCorreo}
            )
            AND cl.idClinica IN (
                SELECT oc.idClinica
                FROM odontologo_clinica oc
                WHERE oc.idOdontologo = $${iOdo}::int AND oc.activo
            )
        )
    )`;
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
    if (estado === 'NO_ASISTIO' && rows[0].futura) {
        throw errorHttp(409, 'No se puede marcar como no asistió una cita que todavía no ocurre.');
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