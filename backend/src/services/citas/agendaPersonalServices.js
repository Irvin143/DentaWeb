import conexion from '../conexion.js';

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
        params.push(idOdontologo);
        where.push(`c.idOdontologo = $${params.length}::int`);
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
