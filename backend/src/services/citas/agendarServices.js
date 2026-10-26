import conexion from '../conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Los time de Postgres llegan como 'HH:MM:SS'; la vista usa 'HH:MM'
const hhmm = (valor) => String(valor).slice(0, 5);

// Traduce errores de Postgres a errores HTTP
const manejarErrorPg = (err) => {
    if (err.code === '23503') throw errorHttp(400, 'Alguno de los datos de la cita no existe');
    // fecha u hora con formato inválido
    if (['22007', '22008', '22P02'].includes(err.code)) {
        throw errorHttp(400, 'La fecha o la hora no son válidas');
    }
    throw err;
};

/* ============================================================
   HORARIOS DISPONIBLES
   ============================================================ */

// Horarios en los que al menos un odontólogo de la sede está libre.
// Si no hay ninguno ese día, devuelve también el próximo día con disponibilidad.
// fecha: 'AAAA-MM-DD'
export const obtenerHorariosDisponibles = async ({ idClinica, fecha }) => {
    const { rows } = await conexion.query(
        `SELECT hora
         FROM fn_slots_disponibles($1::int, $2::date)
         GROUP BY hora
         ORDER BY hora`,
        [idClinica, fecha]
    );
    const horas = rows.map((r) => hhmm(r.hora));

    let proximoDia = null;
    if (horas.length === 0) {
        // to_char evita que el driver convierta la fecha a un Date con zona horaria
        const { rows: prox } = await conexion.query(
            `SELECT to_char(fn_proximo_dia_disponible($1::int, $2::date + 1), 'YYYY-MM-DD') AS dia`,
            [idClinica, fecha]
        );
        proximoDia = prox[0]?.dia ?? null;
    }

    return { fecha, horas, proximo_dia: proximoDia };
};

/* ============================================================
   CREAR CITA
   ============================================================ */

// Estado con el que nace una cita agendada por el paciente
const ESTADO_INICIAL = 'confirmada';

// Paciente ligado a la cuenta que inició sesión
export const obtenerIdPacientePorUsuario = async (idUsuario) => {
    const { rows } = await conexion.query(
        'SELECT idPaciente FROM pacientes WHERE idUsuario = $1::int LIMIT 1',
        [idUsuario]
    );
    return rows[0]?.idpaciente ?? null;
};

// Tipo de cita cuando la vista no manda uno: el que se llame igual que la categoría
// del servicio ('consulta' / 'estudio').
// TODO: ajusta esta consulta a la estructura real de tipos_cita
const resolverIdTipo = async (cliente, categoria) => {
    const { rows } = await cliente.query(
        'SELECT idTipo FROM tipo_cita WHERE lower(nombre) = $1 LIMIT 1',
        [String(categoria).toLowerCase()]
    );
    if (!rows[0]) {
        throw errorHttp(500, `No hay un tipo de cita configurado para "${categoria}"`);
    }
    return rows[0].idtipo;
};

// Odontólogos libres a esa hora, del menos al más cargado.
//   1. Menor ocupación en los próximos 14 días en esa sede (minutos con cita / minutos de agenda)
//   2. Menos citas en ese periodo
//   3. Id más bajo, para que el resultado siempre sea el mismo
// TODO: cuando exista el odontólogo de cabecera, agregarlo como criterio de desempate
const SQL_CANDIDATOS = `
    WITH candidatos AS (
        SELECT idodontologo, hora_fin
        FROM fn_slots_disponibles($1::int, $2::date)
        WHERE hora = $3::time
    ),
    dias AS (
        SELECT d::date AS dia
        FROM generate_series($2::date::timestamp, ($2::date + 13)::timestamp, interval '1 day') AS d
    ),
    agenda AS (
        SELECT h.idodontologo,
               SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio)) / 60) AS minutos
        FROM horarios_odontologo h
        JOIN dias ON h.dia_semana = EXTRACT(ISODOW FROM dias.dia)::int
                 AND dias.dia BETWEEN h.vigente_desde AND COALESCE(h.vigente_hasta, 'infinity'::date)
        WHERE h.idclinica = $1::int
          AND h.activo
          AND h.idodontologo IN (SELECT idodontologo FROM candidatos)
        GROUP BY h.idodontologo
    ),
    carga AS (
        SELECT c.idodontologo,
               COUNT(*) AS citas,
               SUM(EXTRACT(EPOCH FROM (c.hora_fin - c.hora)) / 60) AS minutos
        FROM citas c
        JOIN clinica_servicio cs ON cs.idclinica_servicio = c.idclinica_servicio
        WHERE cs.idclinica = $1::int
          AND c.estado <> 'cancelada'
          AND c.fecha BETWEEN $2::date AND $2::date + 13
          AND c.idodontologo IN (SELECT idodontologo FROM candidatos)
        GROUP BY c.idodontologo
    )
    SELECT ca.idodontologo,
           ca.hora_fin,
           COALESCE(cg.minutos, 0) / NULLIF(ag.minutos, 0) AS ocupacion,
           COALESCE(cg.citas, 0) AS citas
    FROM candidatos ca
    LEFT JOIN agenda ag ON ag.idodontologo = ca.idodontologo
    LEFT JOIN carga  cg ON cg.idodontologo = ca.idodontologo
    ORDER BY ocupacion NULLS LAST, citas, ca.idodontologo
`;

// Agenda la cita: vuelve a revisar la disponibilidad, escoge al odontólogo libre con menos
// carga y la guarda, todo en una transacción. Si otra persona se adelanta con ese odontólogo,
// la restricción contra traslapes de la tabla lo rechaza y se prueba con el siguiente.
// hora: 'HH:mm' · fecha: 'AAAA-MM-DD' · idTipo: opcional
// Requiere que `conexion` sea un Pool de pg.
export const crearCita = async ({
    idPaciente,
    idSede,
    idServicio,
    fecha,
    hora,
    motivo = null,
    idTipo = null,
}) => {
    const cliente = await conexion.connect();

    try {
        await cliente.query('BEGIN');

        // 1. La sede debe ofrecer el servicio (y el servicio estar activo)
        const { rows: relacion } = await cliente.query(
            `SELECT x.idClinica_Servicio AS id_clinica_servicio, s.categoria
             FROM clinica_servicio x
             JOIN servicios s ON s.idServicio = x.idServicio AND s.activo
             WHERE x.idClinica = $1::int AND x.idServicio = $2::int AND x.activo`,
            [idSede, idServicio]
        );
        if (!relacion[0]) throw errorHttp(400, 'La sede no ofrece ese servicio');

        // 2. Tipo de cita
        const tipo = idTipo ?? (await resolverIdTipo(cliente, relacion[0].categoria));

        // 3. Odontólogos libres a esa hora, del menos al más cargado
        const { rows: candidatos } = await cliente.query(SQL_CANDIDATOS, [idSede, fecha, hora]);
        if (candidatos.length === 0) {
            throw errorHttp(409, 'Ese horario ya no está disponible. Elige otro.');
        }

        // 4. Se intenta con cada candidato hasta que uno acepte la cita
        let creada = null;
        for (const candidato of candidatos) {
            await cliente.query('SAVEPOINT intento');
            try {
                const { rows } = await cliente.query(
                    `INSERT INTO citas
                        (fecha, hora, hora_fin, idPaciente, idOdontologo,
                         idClinica_Servicio, idTipo, estado, observaciones)
                     VALUES ($1::date, $2::time, $3::time, $4, $5, $6, $7, $8, $9)
                     RETURNING idCita AS id_cita`,
                    [
                        fecha,
                        hora,
                        candidato.hora_fin,
                        idPaciente,
                        candidato.idodontologo,
                        relacion[0].id_clinica_servicio,
                        tipo,
                        ESTADO_INICIAL,
                        motivo,
                    ]
                );
                await cliente.query('RELEASE SAVEPOINT intento');
                creada = { id_cita: rows[0].id_cita, candidato };
                break;
            } catch (err) {
                await cliente.query('ROLLBACK TO SAVEPOINT intento');
                if (err.code === '23P01') {
                    // Traslape con otra cita. Si es del paciente, no hay a quién más probar
                    if (String(err.constraint ?? '').includes('paciente')) {
                        throw errorHttp(409, 'Ya tienes una cita en ese horario');
                    }
                    continue; // alguien tomó a este odontólogo; se prueba con el siguiente
                }
                throw err;
            }
        }

        if (!creada) throw errorHttp(409, 'Ese horario ya no está disponible. Elige otro.');

        // 5. Nombre del odontólogo asignado, para mostrárselo al paciente
        const { rows: odontologo } = await cliente.query(
            `SELECT CONCAT_WS(' ', nombre, ape_pat, ape_mat) AS nombre
             FROM odontologos
             WHERE idOdontologo = $1`,
            [creada.candidato.idodontologo]
        );

        await cliente.query('COMMIT');

        return {
            id_cita: creada.id_cita,
            fecha,
            hora,
            hora_fin: hhmm(creada.candidato.hora_fin),
            odontologo: {
                id_odontologo: creada.candidato.idodontologo,
                nombre: odontologo[0]?.nombre ?? null,
            },
        };
    } catch (err) {
        await cliente.query('ROLLBACK').catch(() => {});
        if (err.status) throw err;
        manejarErrorPg(err);
    } finally {
        cliente.release();
    }
};