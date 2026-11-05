import conexion from '../conexion.js'; // services/catalogos/ → services/conexion.js (igual que odontologosServices.js)

// Odontólogo genérico de urgencias: es del sistema y no se le asigna perfil.
const CORREO_ODONTOLOGO_URGENCIA = 'urgencia@clinicware.com';

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

/* ============================================================
   ALCANCE (qué clínicas puede manejar quien hace la petición)
   ============================================================ */

// Cuentas de tipo Clínica: solo manejan el horario de SU clínica.
// Devuelve null (sin restricción, por ejemplo el administrador) o la lista de ids de clínica.
export const resolverAlcance = async ({ paquete, idUsuario }) => {
    if (paquete !== 'Clinica') return null;
    const { rows } = await conexion.query(
        'SELECT idClinica AS id FROM clinicas WHERE idUsuario = $1::int',
        [idUsuario]
    );
    if (rows.length === 0) throw errorHttp(403, 'Tu cuenta no tiene una clínica registrada');
    return rows.map((r) => r.id);
};

// El odontólogo debe existir, no ser el del sistema y, si hay alcance, trabajar en una
// de las clínicas permitidas.
const verificarAcceso = async (idOdontologo, alcance, db = conexion) => {
    const { rows } = await db.query(
        `SELECT u.correo
         FROM odontologos o
         LEFT JOIN usuarios u ON u.idUsuario = o.idUsuario
         WHERE o.idOdontologo = $1::int`,
        [idOdontologo]
    );
    if (!rows[0]) throw errorHttp(404, 'No encontramos a ese odontólogo');
    if (rows[0].correo === CORREO_ODONTOLOGO_URGENCIA) {
        throw errorHttp(403, 'Ese odontólogo es del sistema (atiende las urgencias) y no se puede modificar');
    }

    if (alcance) {
        const { rows: trabaja } = await db.query(
            `SELECT 1
             FROM odontologo_clinica
             WHERE idOdontologo = $1::int AND activo AND idClinica = ANY($2::int[])`,
            [idOdontologo, alcance]
        );
        if (!trabaja[0]) throw errorHttp(403, 'Ese odontólogo no trabaja en tu clínica');
    }
};

/* ============================================================
   CATÁLOGO
   ============================================================ */

// Especialidades que se pueden asignar a un odontólogo
export const obtenerCatalogoPerfil = async () => {
    const { rows } = await conexion.query(
        `SELECT idEspecialidad AS id_especialidad, nombre
         FROM especialidades
         WHERE activo
         ORDER BY nombre`
    );
    return { especialidades: rows };
};

/* ============================================================
   LEER PERFIL (especialidades + horario semanal)
   ============================================================ */

// Devuelve { ids_especialidades: [int], horarios: [{ id_clinica, dia_semana, hora_inicio,
// hora_fin, duracion_cita_min }] }. Solo los horarios activos y vigentes; una cuenta de
// clínica ve únicamente los de su clínica.
export const obtenerPerfil = async ({ idOdontologo, alcance = null }) => {
    await verificarAcceso(idOdontologo, alcance);

    const { rows: esp } = await conexion.query(
        'SELECT idEspecialidad AS id FROM espe_odon WHERE idOdontologo = $1::int',
        [idOdontologo]
    );

    const { rows: hor } = await conexion.query(
        `SELECT idClinica AS id_clinica,
                dia_semana,
                to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
                to_char(hora_fin, 'HH24:MI')    AS hora_fin,
                duracion_cita_min
         FROM horarios_odontologo
         WHERE idOdontologo = $1::int
           AND activo
           AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
           AND ($2::int[] IS NULL OR idClinica = ANY($2::int[]))
         ORDER BY idClinica, dia_semana, hora_inicio`,
        [idOdontologo, alcance]
    );

    return { ids_especialidades: esp.map((r) => r.id), horarios: hor };
};

/* ============================================================
   GUARDAR PERFIL
   ============================================================ */

// Reemplaza TODAS las especialidades y TODO el horario activo del odontólogo, en una
// transacción. Una cuenta de clínica solo reemplaza el horario de su propia clínica
// (el de otras clínicas donde también trabaje el odontólogo no se toca).
// Las citas ya agendadas no se tocan (no dependen de la tabla de horarios).
// Cada horario debe ser de una clínica donde el odontólogo trabaja (odontologo_clinica).
// horarios: [{ id_clinica, dia_semana (1=lunes … 7=domingo), hora_inicio 'HH:mm',
//              hora_fin 'HH:mm', duracion_cita_min }]
export const guardarPerfil = async ({
    idOdontologo,
    idsEspecialidades = [],
    horarios = [],
    alcance = null,
}) => {
    const cliente = await conexion.connect();
    try {
        await cliente.query('BEGIN');
        await verificarAcceso(idOdontologo, alcance, cliente);

        // 1. Especialidades
        await cliente.query('DELETE FROM espe_odon WHERE idOdontologo = $1::int', [idOdontologo]);
        if (idsEspecialidades.length > 0) {
            await cliente.query(
                `INSERT INTO espe_odon (idOdontologo, idEspecialidad)
                 SELECT $1::int, e.idEspecialidad
                 FROM especialidades e
                 WHERE e.idEspecialidad = ANY($2::int[]) AND e.activo`,
                [idOdontologo, idsEspecialidades]
            );
        }

        // 2. Los horarios solo pueden ser de clínicas donde el odontólogo trabaja
        //    (y, para una cuenta de clínica, de las clínicas que le corresponden)
        const { rows: sedes } = await cliente.query(
            `SELECT idClinica AS id
             FROM odontologo_clinica
             WHERE idOdontologo = $1::int
               AND activo
               AND ($2::int[] IS NULL OR idClinica = ANY($2::int[]))`,
            [idOdontologo, alcance]
        );
        const permitidas = new Set(sedes.map((s) => s.id));
        for (const h of horarios) {
            if (!permitidas.has(h.id_clinica)) {
                throw errorHttp(400, 'Hay un horario de una clínica donde no puedes asignarle horario');
            }
        }

        // 3. Horario semanal: el anterior se desactiva (no se borra, para conservar el historial,
        //    igual que al quitarle una clínica) y se insertan los bloques nuevos.
        await cliente.query(
            `UPDATE horarios_odontologo
             SET activo = false
             WHERE idOdontologo = $1::int
               AND activo
               AND ($2::int[] IS NULL OR idClinica = ANY($2::int[]))`,
            [idOdontologo, alcance]
        );
        if (horarios.length > 0) {
            await cliente.query(
                `INSERT INTO horarios_odontologo
                    (idOdontologo, idClinica, dia_semana, hora_inicio, hora_fin, duracion_cita_min)
                 SELECT $1::int, x.clinica, x.dia, x.inicio::time, x.fin::time, x.duracion
                 FROM unnest($2::int[], $3::int[], $4::text[], $5::text[], $6::int[])
                      AS x(clinica, dia, inicio, fin, duracion)`,
                [
                    idOdontologo,
                    horarios.map((h) => h.id_clinica),
                    horarios.map((h) => h.dia_semana),
                    horarios.map((h) => h.hora_inicio),
                    horarios.map((h) => h.hora_fin),
                    horarios.map((h) => h.duracion_cita_min),
                ]
            );
        }

        await cliente.query('COMMIT');
        return { ok: true, total_horarios: horarios.length };
    } catch (err) {
        await cliente.query('ROLLBACK').catch(() => {});
        if (err.status) throw err;
        // Dos bloques del horario se empalman (la restricción de la tabla lo rechaza)
        if (err.code === '23P01') {
            throw errorHttp(409, 'Hay horarios que se empalman entre sí. Revisa los días y las horas.');
        }
        if (err.code === '23503') {
            throw errorHttp(400, 'Alguno de los datos del horario no existe');
        }
        if (['22007', '22008', '22P02'].includes(err.code)) {
            throw errorHttp(400, 'Alguna hora del horario no es válida');
        }
        throw err;
    } finally {
        cliente.release();
    }
};