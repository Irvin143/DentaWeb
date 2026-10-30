import conexion from '../conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const ZONA = 'America/Mazatlan';

/* ============================================================
   PACIENTE
   ============================================================ */

// El token trae el usuario; las citas pertenecen al paciente.
export const obtenerIdPaciente = async (idUsuario) => {
    const { rows } = await conexion.query(
        `SELECT idPaciente AS id_paciente
         FROM pacientes
         WHERE idUsuario = $1::int`,
        [idUsuario]
    );
    if (!rows[0]) throw errorHttp(403, 'Solo los pacientes tienen citas');
    return rows[0].id_paciente;
};

/* ============================================================
   LISTAR MIS CITAS
   ============================================================ */

// Devuelve todas las citas del paciente (pasadas y futuras), la más reciente primero.
// `fecha` ('AAAA-MM-DD') y `hora` ('HH:mm') van separadas para evitar desfases de zona horaria.
// El motivo que se muestra es el nombre del servicio (la cita no guarda el servicio directo,
// sino idclinica_servicio). `observaciones` queda para el detalle.
// TODO: confirma servicios.nombre y odontologos.nombre/ape_pat/ape_mat
export const obtenerCitasPaciente = async (idPaciente) => {
    const { rows } = await conexion.query(
        `SELECT c.idCita                                    AS id,
                to_char(c.fecha, 'YYYY-MM-DD')              AS fecha,
                to_char(c.hora, 'HH24:MI')                  AS hora,
                to_char(c.hora_fin, 'HH24:MI')              AS hora_fin,
                COALESCE(s.nombre, 'Consulta')              AS motivo,
                NULLIF(CONCAT_WS(' ', o.nombre, o.ape_pat, o.ape_mat), '') AS doctor,
                c.estado                                    AS estado,
                cl.nombre                                   AS sede,
                cs.idClinica                                AS id_sede
         FROM citas c
         JOIN clinica_servicio cs ON cs.idClinica_Servicio = c.idClinica_Servicio
         LEFT JOIN servicios   s  ON s.idServicio   = cs.idServicio
         LEFT JOIN clinicas    cl ON cl.idClinica   = cs.idClinica
         LEFT JOIN odontologos o  ON o.idOdontologo = c.idOdontologo
         WHERE c.idPaciente = $1::int
         ORDER BY c.fecha DESC, c.hora DESC`,
        [idPaciente]
    );
    return rows;
};

/* ============================================================
   CANCELAR UNA CITA
   ============================================================ */

// Solo se cancela una cita propia, pendiente y que todavía no pasa.
// La condición va dentro del UPDATE para que sea atómica (nadie la cambia a la mitad).
// Estados en la base: 'pendiente' (por defecto) y 'cancelada' al cancelar.
export const cancelarCita = async ({ idCita, idPaciente }) => {
    const { rows } = await conexion.query(
        `UPDATE citas
         SET estado = 'CANCELADA'
         WHERE idCita = $1::int
           AND idPaciente = $2::int
           AND lower(estado) = 'pendiente'
           AND (fecha + hora) > (now() AT TIME ZONE '${ZONA}')
         RETURNING idCita AS id`,
        [idCita, idPaciente]
    );
    if (rows[0]) return { id: rows[0].id, estado: 'cancelada' };

    // No se actualizó nada: se averigua por qué para dar el mensaje correcto
    const { rows: existente } = await conexion.query(
        `SELECT lower(estado) AS estado,
                (fecha + hora) <= (now() AT TIME ZONE '${ZONA}') AS ya_paso
         FROM citas
         WHERE idCita = $1::int AND idPaciente = $2::int`,
        [idCita, idPaciente]
    );
    const cita = existente[0];
    if (!cita) throw errorHttp(404, 'No encontramos esa cita');
    if (cita.estado !== 'pendiente') {
        throw errorHttp(409, `Esta cita ya está ${cita.estado}, solo se pueden cancelar las pendientes`);
    }
    throw errorHttp(409, 'Esta cita ya pasó y no se puede cancelar');
};

/* ============================================================
   REAGENDAR UNA CITA
   ============================================================ */

// Mueve la cita a otra fecha y hora, en la misma sede y con el mismo odontólogo.
// Se mantiene la duración original (hora_fin - hora).
// Todo va en un solo UPDATE: la cita debe ser propia y pendiente, el nuevo horario debe ser
// futuro, estar entre los espacios disponibles de la sede y no empalmarse con otra cita
// del odontólogo.
// fecha: 'AAAA-MM-DD' · hora: 'HH:mm'
export const reagendarCita = async ({ idCita, idPaciente, fecha, hora }) => {
    const { rows } = await conexion.query(
        `UPDATE citas c
         SET fecha    = $3::date,
             hora     = $4::time,
             hora_fin = $4::time + (c.hora_fin - c.hora)
         FROM clinica_servicio cs
         WHERE c.idCita = $1::int
           AND c.idPaciente = $2::int
           AND cs.idClinica_Servicio = c.idClinica_Servicio
           AND lower(c.estado) = 'pendiente'
           AND (c.fecha + c.hora) > (now() AT TIME ZONE '${ZONA}')
           AND ($3::date + $4::time) > (now() AT TIME ZONE '${ZONA}')
           AND $4::time IN (SELECT f.hora FROM fn_slots_disponibles(cs.idClinica, $3::date) f)
           AND NOT EXISTS (
                 SELECT 1
                 FROM citas o
                 WHERE o.idOdontologo = c.idOdontologo
                   AND o.idCita <> c.idCita
                   AND lower(o.estado) <> 'cancelada'
                   AND o.fecha = $3::date
                   AND o.hora < ($4::time + (c.hora_fin - c.hora))
                   AND o.hora_fin > $4::time
           )
         RETURNING c.idCita AS id,
                   to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
                   to_char(c.hora, 'HH24:MI')     AS hora,
                   to_char(c.hora_fin, 'HH24:MI') AS hora_fin,
                   c.estado AS estado`,
        [idCita, idPaciente, fecha, hora]
    );
    if (rows[0]) return rows[0];

    // No se actualizó nada: se averigua por qué para dar el mensaje correcto
    const { rows: existente } = await conexion.query(
        `SELECT lower(estado) AS estado,
                (fecha + hora) <= (now() AT TIME ZONE '${ZONA}') AS ya_paso,
                ($3::date + $4::time) <= (now() AT TIME ZONE '${ZONA}') AS nueva_pasada
         FROM citas
         WHERE idCita = $1::int AND idPaciente = $2::int`,
        [idCita, idPaciente, fecha, hora]
    );
    const cita = existente[0];
    if (!cita) throw errorHttp(404, 'No encontramos esa cita');
    if (cita.estado !== 'pendiente') {
        throw errorHttp(409, `Esta cita ya está ${cita.estado}, solo se pueden reagendar las pendientes`);
    }
    if (cita.ya_paso) throw errorHttp(409, 'Esta cita ya pasó y no se puede reagendar');
    if (cita.nueva_pasada) throw errorHttp(400, 'Elige una fecha y hora que todavía no hayan pasado');
    throw errorHttp(409, 'Ese horario ya no está disponible. Elige otro.');
};