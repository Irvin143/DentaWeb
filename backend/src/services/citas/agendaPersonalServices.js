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

/* ============================================================
   REAGENDAR (PERSONAL)
   ============================================================ */

// Mueve una cita a otra fecha y hora, en la misma sede y con el mismo odontólogo, respetando
// el alcance de quien la pide (admin: todas · odontólogo: las suyas · clínica: las de sus sedes).
// Misma lógica que reagendarCita del paciente, pero sin exigir que la cita sea del usuario.
// Se mantiene la duración original (hora_fin - hora). Las urgencias no se reagendan.
// fecha: 'AAAA-MM-DD' · hora: 'HH:mm'
export async function reagendarCitaPersonal({
    idCita,
    fecha,
    hora,
    idOdontologo = null,
    idsClinica = null,
}) {
    const params = [idCita, fecha, hora];
    const alcance = [];

    if (idOdontologo != null) {
        alcance.push(condicionOdontologo(params, idOdontologo));
    }
    if (Array.isArray(idsClinica)) {
        params.push(idsClinica);
        alcance.push(`cs.idClinica = ANY($${params.length}::int[])`);
    }
    const filtroAlcance = alcance.length ? `AND ${alcance.join(' AND ')}` : '';

    let rows;
    try {
        ({ rows } = await conexion.query(
            `UPDATE citas c
             SET fecha    = $2::date,
                 hora     = $3::time,
                 hora_fin = $3::time + (c.hora_fin - c.hora)
             FROM clinica_servicio cs
             WHERE c.idCita = $1::int
               AND cs.idClinica_Servicio = c.idClinica_Servicio
               ${filtroAlcance}
               AND lower(c.estado) IN ('pendiente', 'confirmada')
               AND (c.fecha + c.hora) > (now() AT TIME ZONE '${ZONA}')
               AND ($2::date + $3::time) > (now() AT TIME ZONE '${ZONA}')
               AND NOT EXISTS (
                     SELECT 1 FROM tipo_cita t
                     WHERE t.idTipo = c.idTipo AND lower(t.nombre) IN ('urgencia', 'urgencias')
               )
               AND EXISTS (
                     SELECT 1
                     FROM fn_slots_disponibles(cs.idClinica, $2::date) f
                     WHERE f.hora = $3::time AND f.idodontologo = c.idOdontologo
               )
               AND NOT EXISTS (
                     SELECT 1
                     FROM citas o
                     WHERE o.idOdontologo = c.idOdontologo
                       AND o.idCita <> c.idCita
                       AND lower(o.estado) <> 'cancelada'
                       AND o.fecha = $2::date
                       AND o.hora < ($3::time + (c.hora_fin - c.hora))
                       AND o.hora_fin > $3::time
               )
               AND NOT EXISTS (
                     SELECT 1
                     FROM citas o
                     WHERE o.idPaciente = c.idPaciente
                       AND o.idCita <> c.idCita
                       AND lower(o.estado) <> 'cancelada'
                       AND o.fecha = $2::date
                       AND o.hora < ($3::time + (c.hora_fin - c.hora))
                       AND o.hora_fin > $3::time
               )
             RETURNING c.idCita AS id,
                       to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
                       to_char(c.hora, 'HH24:MI')     AS hora,
                       to_char(c.hora_fin, 'HH24:MI') AS hora_fin,
                       c.estado AS estado`,
            params
        ));
    } catch (err) {
        // Alguien tomó el horario justo ahora (la restricción de la tabla lo rechazó)
        if (err.code === '23P01') {
            if (String(err.constraint ?? '').includes('paciente')) {
                throw errorHttp(409, 'El paciente ya tiene otra cita en ese horario. Elige otro.');
            }
            throw errorHttp(409, 'Ese horario ya no está disponible. Elige otro.');
        }
        // fecha u hora con formato inválido
        if (['22007', '22008', '22P02'].includes(err.code)) {
            throw errorHttp(400, 'La fecha o la hora no son válidas');
        }
        throw err;
    }

    if (rows[0]) return rows[0];

    // No se actualizó nada: se averigua por qué para dar el mensaje correcto
    const { rows: existente } = await conexion.query(
        `SELECT lower(c.estado) AS estado,
                (c.fecha + c.hora) <= (now() AT TIME ZONE '${ZONA}') AS ya_paso,
                ($2::date + $3::time) <= (now() AT TIME ZONE '${ZONA}') AS nueva_pasada,
                EXISTS (
                    SELECT 1 FROM tipo_cita t
                    WHERE t.idTipo = c.idTipo AND lower(t.nombre) IN ('urgencia', 'urgencias')
                ) AS es_urgencia,
                EXISTS (
                    SELECT 1
                    FROM citas o
                    WHERE o.idPaciente = c.idPaciente
                      AND o.idCita <> c.idCita
                      AND lower(o.estado) <> 'cancelada'
                      AND o.fecha = $2::date
                      AND o.hora < ($3::time + (c.hora_fin - c.hora))
                      AND o.hora_fin > $3::time
                ) AS choque_paciente
         FROM citas c
         JOIN clinica_servicio cs ON cs.idClinica_Servicio = c.idClinica_Servicio
         WHERE c.idCita = $1::int
           ${filtroAlcance}`,
        params
    );
    const cita = existente[0];
    if (!cita) throw errorHttp(404, 'No encontramos esa cita');
    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
        throw errorHttp(
            409,
            `Esta cita ya está ${cita.estado}, solo se pueden reagendar las pendientes o confirmadas`
        );
    }
    if (cita.ya_paso) throw errorHttp(409, 'Esta cita ya pasó y no se puede reagendar');
    if (cita.es_urgencia) {
        throw errorHttp(
            409,
            'Las urgencias no se pueden reagendar. Cancélala y registra otra con la hora que necesites.'
        );
    }
    if (cita.nueva_pasada) throw errorHttp(400, 'Elige una fecha y hora que todavía no hayan pasado');
    if (cita.choque_paciente) {
        throw errorHttp(409, 'El paciente ya tiene otra cita en ese horario. Elige otro.');
    }
    throw errorHttp(409, 'Ese horario ya no está disponible. Elige otro.');
}