import conexion from '../conexion.js'; // la misma ruta que usas en los demás services
import { correoConfigurado, enviarConfirmacionCita } from './correoServices.js';

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Los time de Postgres llegan como 'HH:MM:SS'; la vista usa 'HH:MM'
const hhmm = (valor) => String(valor).slice(0, 5);

// Zona horaria de las sedes (para saber qué es "hoy" y qué espacios ya pasaron)
const ZONA = 'America/Mazatlan';

// Condición SQL: el odontólogo `col` puede hacer el servicio `srv` (ambos son expresiones SQL).
// Un servicio sin especialidad (idEspecialidad NULL) lo puede hacer cualquier odontólogo.
const PUEDE_HACER = (col, srv) => `EXISTS (
        SELECT 1 FROM servicios sv
        WHERE sv.idServicio = ${srv}
          AND (sv.idEspecialidad IS NULL
               OR EXISTS (SELECT 1 FROM espe_odon eo
                          WHERE eo.idOdontologo = ${col}
                            AND eo.idEspecialidad = sv.idEspecialidad))
    )`;

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
   ODONTÓLOGO DE CABECERA
   El primer odontólogo que atiende a un paciente en una consulta queda guardado en
   pacientes.idOdontologo. En sus siguientes consultas solo se le ofrecen los días y
   horarios de ese odontólogo, y las citas se le asignan a él.
   ============================================================ */

// Solo las consultas se atienden con el odontólogo de cabecera. Los estudios no (no todos
// los odontólogos los hacen) ni las urgencias (se registran con el odontólogo genérico).
const CATEGORIAS_CON_CABECERA = ['consulta'];

// Paciente ligado a la cuenta que inició sesión
export const obtenerIdPacientePorUsuario = async (idUsuario) => {
    const { rows } = await conexion.query(
        'SELECT idPaciente FROM pacientes WHERE idUsuario = $1::int LIMIT 1',
        [idUsuario]
    );
    return rows[0]?.idpaciente ?? null;
};

// Odontólogo de cabecera del paciente. null si no tiene o si ese odontólogo ya está inactivo
// (en ese caso se le asignará uno nuevo en su siguiente consulta).
// db: la conexión o el cliente de una transacción
const obtenerOdontologoDePaciente = async (idPaciente, db = conexion) => {
    const { rows } = await db.query(
        `SELECT o.idOdontologo AS id_odontologo,
                CONCAT_WS(' ', o.nombre, o.ape_pat, o.ape_mat) AS nombre,
                o.cedula
         FROM pacientes p
         JOIN odontologos o ON o.idOdontologo = p.idOdontologo
         JOIN usuarios u    ON u.idUsuario = o.idUsuario AND u.activo
         WHERE p.idPaciente = $1::int`,
        [idPaciente]
    );
    return rows[0] ?? null;
};

// Odontólogo con el que debe agendarse este servicio: el de cabecera del paciente si el servicio
// es una consulta y ya tiene uno. Devuelve { id_odontologo, nombre, cedula } o null (sin restricción).
export const obtenerOdontologoFijo = async ({ idPaciente, idServicio, db = conexion }) => {
    if (!idPaciente || !idServicio) return null;

    const { rows } = await db.query('SELECT categoria FROM servicios WHERE idServicio = $1::int', [
        idServicio,
    ]);
    if (!rows[0] || !CATEGORIAS_CON_CABECERA.includes(String(rows[0].categoria).toLowerCase())) {
        return null;
    }

    return obtenerOdontologoDePaciente(idPaciente, db);
};

/* ============================================================
   SEDES, DÍAS Y HORARIOS DISPONIBLES
   ============================================================ */

// Dirección en una sola línea (igual que en el service de clínicas)
const DIRECCION_COMPLETA = `
    concat_ws(', ',
        NULLIF(concat_ws(' ', d.calle, d.numero_exterior,
               CASE WHEN d.numero_interior IS NOT NULL THEN 'Int. ' || d.numero_interior END), ''),
        d.colonia,
        NULLIF(concat_ws(' ', 'CP', d.codigo_postal), 'CP'),
        d.ciudad,
        d.estado
    )
`;

// Sedes que ofrecen el servicio. Si el paciente tiene odontólogo de cabecera para este servicio,
// solo las sedes donde ese odontólogo atiende.
// Devuelve [{ id_sede, nombre, direccion }]
export const obtenerSedesParaAgendar = async ({ idServicio, idPaciente = null }) => {
    const fijo = await obtenerOdontologoFijo({ idPaciente, idServicio });

    const { rows } = await conexion.query(
        `SELECT c.idClinica AS id_sede,
                c.nombre,
                ${DIRECCION_COMPLETA} AS direccion
         FROM clinicas c
         JOIN usuarios uc         ON uc.idUsuario = c.idUsuario AND uc.activo
         JOIN clinica_servicio cs ON cs.idClinica = c.idClinica AND cs.activo
         JOIN servicios s         ON s.idServicio = cs.idServicio AND s.activo
         LEFT JOIN direcciones d  ON d.idDireccion = c.idDireccion
         WHERE cs.idServicio = $1::int
           AND EXISTS (
                SELECT 1
                FROM odontologo_clinica oc
                JOIN odontologos o ON o.idOdontologo = oc.idOdontologo
                JOIN usuarios u    ON u.idUsuario = o.idUsuario AND u.activo
                WHERE oc.idClinica = c.idClinica
                  AND oc.activo
                  AND ($2::int IS NULL OR oc.idOdontologo = $2::int)
                  AND ${PUEDE_HACER('oc.idOdontologo', '$1::int')}
           )
         ORDER BY c.nombre`,
        [idServicio, fijo?.id_odontologo ?? null]
    );
    return rows;
};

// Horarios en los que al menos un odontólogo de la sede está libre (o solo `idOdontologo`,
// si se indica). Si se manda `idServicio`, solo cuentan los odontólogos que pueden hacerlo.
// Si no hay ninguno ese día, devuelve también el próximo día con disponibilidad.
// fecha: 'AAAA-MM-DD'
export const obtenerHorariosDisponibles = async ({
    idClinica,
    fecha,
    idOdontologo = null,
    idServicio = null,
}) => {
    const { rows } = await conexion.query(
        `SELECT f.hora
         FROM fn_slots_disponibles($1::int, $2::date) f
         WHERE ($3::int IS NULL OR f.idodontologo = $3::int)
           AND ($4::int IS NULL OR ${PUEDE_HACER('f.idodontologo', '$4::int')})
         GROUP BY f.hora
         ORDER BY f.hora`,
        [idClinica, fecha, idOdontologo, idServicio]
    );
    const horas = rows.map((r) => hhmm(r.hora));

    let proximoDia = null;
    if (horas.length === 0) {
        // to_char evita que el driver convierta la fecha a un Date con zona horaria
        const { rows: prox } = await conexion.query(
            `SELECT to_char(d::date, 'YYYY-MM-DD') AS dia
             FROM generate_series(
                    GREATEST($2::date + 1, (now() AT TIME ZONE '${ZONA}')::date)::timestamp,
                    (GREATEST($2::date + 1, (now() AT TIME ZONE '${ZONA}')::date) + 60)::timestamp,
                    interval '1 day'
                  ) AS d
             WHERE EXISTS (
                    SELECT 1
                    FROM fn_slots_disponibles($1::int, d::date) s
                    WHERE ($3::int IS NULL OR s.idodontologo = $3::int)
                      AND ($4::int IS NULL OR ${PUEDE_HACER('s.idodontologo', '$4::int')})
             )
             ORDER BY d
             LIMIT 1`,
            [idClinica, fecha, idOdontologo, idServicio]
        );
        proximoDia = prox[0]?.dia ?? null;
    }

    return { fecha, horas, proximo_dia: proximoDia };
};

// Días (desde hoy y hasta `dias` días adelante) en los que la sede tiene horarios libres
// (o solo `idOdontologo`, si se indica; o solo odontólogos que pueden hacer `idServicio`).
// Devuelve { dias: ['AAAA-MM-DD', ...] }
export const obtenerDiasDisponibles = async ({
    idClinica,
    dias = 30,
    idOdontologo = null,
    idServicio = null,
}) => {
    // to_char evita que el driver convierta la fecha a un Date con zona horaria
    const { rows } = await conexion.query(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS dia
         FROM generate_series(
                (now() AT TIME ZONE '${ZONA}')::date::timestamp,
                ((now() AT TIME ZONE '${ZONA}')::date + $2::int)::timestamp,
                interval '1 day'
              ) AS d
         WHERE EXISTS (
                SELECT 1
                FROM fn_slots_disponibles($1::int, d::date) s
                WHERE ($3::int IS NULL OR s.idodontologo = $3::int)
                  AND ($4::int IS NULL OR ${PUEDE_HACER('s.idodontologo', '$4::int')})
         )
         ORDER BY d`,
        [idClinica, dias, idOdontologo, idServicio]
    );
    return { dias: rows.map((r) => r.dia) };
};

/* ============================================================
   CREAR CITA
   ============================================================ */

// Estado con el que nace una cita agendada por el paciente
const ESTADO_INICIAL = 'PENDIENTE';

// Duración que se reserva a una urgencia (no depende de la agenda de ningún odontólogo)
const DURACION_URGENCIA_MIN = 30;

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
// $4 = si no es null, solo se considera a ese odontólogo (el de cabecera del paciente)
// $5 = id del servicio: solo odontólogos que pueden hacerlo (null = sin filtro)
const SQL_CANDIDATOS = `
    WITH candidatos AS (
        SELECT fs.idodontologo, fs.hora_fin
        FROM fn_slots_disponibles($1::int, $2::date) fs
        WHERE fs.hora = $3::time
          AND ($4::int IS NULL OR fs.idodontologo = $4::int)
          AND ($5::int IS NULL OR ${PUEDE_HACER('fs.idodontologo', '$5::int')})
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
          AND upper(c.estado) <> 'CANCELADA'
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

/* ============================================================
   LÍMITE DE CITAS POR PACIENTE
   ============================================================ */

// Un paciente puede tener, al mismo tiempo, como máximo:
//   - UNA cita normal (consulta, estudio...) pendiente o confirmada que todavía no termina, y
//   - UNA urgencia pendiente o confirmada que todavía no termina.
// Con una cita normal pendiente no puede sacar otra hasta que la atiendan o la cancele,
// pero sí puede registrar una urgencia (y al revés).
const ES_URGENCIA_SQL = `EXISTS (
    SELECT 1 FROM tipo_cita t
    WHERE t.idTipo = c.idTipo AND lower(t.nombre) IN ('urgencia', 'urgencias')
)`;

const fechaCorta = (iso) => String(iso).split('-').reverse().join('/'); // 2026-11-20 → 20/11/2026

// '14:30' → '02:30 PM'
const horaLegible = (valor) => {
    const [h, m] = String(valor).split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Se llama al inicio de la transacción de crearCita. Con el candado por paciente, dos
// solicitudes simultáneas del mismo paciente se esperan una a la otra y no se cuelan las dos.
const verificarLimiteCitas = async (cliente, { idPaciente, esUrgencia }) => {
    await cliente.query('SELECT pg_advisory_xact_lock(1001, $1::int)', [idPaciente]);

    const { rows } = await cliente.query(
        `SELECT to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
                to_char(c.hora, 'HH24:MI')     AS hora
         FROM citas c
         WHERE c.idPaciente = $1::int
           AND upper(c.estado) IN ('PENDIENTE', 'CONFIRMADA')
           AND (c.fecha + c.hora_fin) > (now() AT TIME ZONE '${ZONA}')
           AND (${ES_URGENCIA_SQL}) = $2::boolean
         ORDER BY c.fecha, c.hora
         LIMIT 1`,
        [idPaciente, esUrgencia]
    );
    const activa = rows[0];
    if (!activa) return;

    if (esUrgencia) {
        throw errorHttp(
            409,
            `Ya tienes una urgencia registrada para hoy a las ${horaLegible(activa.hora)}. Si necesitas cambiarla, cancélala primero en Mis citas.`
        );
    }
    throw errorHttp(
        409,
        `Ya tienes una cita pendiente el ${fechaCorta(activa.fecha)} a las ${horaLegible(activa.hora)}. Podrás agendar otra cuando la atiendan o la canceles. Si se trata de una urgencia, puedes registrarla aparte.`
    );
};

// Agenda la cita: vuelve a revisar la disponibilidad, escoge al odontólogo libre con menos
// carga y la guarda, todo en una transacción. Si otra persona se adelanta con ese odontólogo,
// la restricción contra traslapes de la tabla lo rechaza y se prueba con el siguiente.
//
// Odontólogo de cabecera (solo servicios de consulta):
//   - Si el paciente ya tiene uno, la cita es con él (si no está libre a esa hora, no se agenda).
//   - Si no tiene, el odontólogo asignado queda como su odontólogo de cabecera.
// usarOdontologoDelPaciente = false lo desactiva.
//
// URGENCIAS (esUrgencia = true): se registran con `idOdontologo` (el odontólogo genérico
// "Odontólogo Urgencia"). No se consulta fn_slots_disponibles, ni la carga de los odontólogos,
// ni el odontólogo de cabecera. El paciente es atendido por quien esté libre al llegar.
//
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
    usarOdontologoDelPaciente = true,
    idOdontologo = null, // solo urgencias: odontólogo genérico
    esUrgencia = false,
}) => {
    const cliente = await conexion.connect();

    try {
        await cliente.query('BEGIN');

        // 0. Límite por paciente: una cita normal y una urgencia a la vez
        await verificarLimiteCitas(cliente, { idPaciente, esUrgencia });

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

        // 2.1 URGENCIA: se registra con el odontólogo genérico, sin buscar disponibilidad
        if (esUrgencia) {
            if (!idOdontologo) throw errorHttp(500, 'Falta el odontólogo genérico de urgencias');

            let fila;
            try {
                const { rows } = await cliente.query(
                    `INSERT INTO citas
                        (fecha, hora, hora_fin, idPaciente, idOdontologo,
                         idClinica_Servicio, idTipo, estado, observaciones)
                     VALUES (
                        $1::date, $2::time,
                        CASE WHEN $2::time < '23:59'::time - make_interval(mins => $3::int)
                             THEN $2::time + make_interval(mins => $3::int)
                             ELSE '23:59'::time END,
                        $4, $5, $6, $7, $8, $9)
                     RETURNING idCita AS id_cita, hora_fin`,
                    [
                        fecha,
                        hora,
                        DURACION_URGENCIA_MIN,
                        idPaciente,
                        idOdontologo,
                        relacion[0].id_clinica_servicio,
                        tipo,
                        ESTADO_INICIAL,
                        motivo,
                    ]
                );
                fila = rows[0];
            } catch (err) {
                if (err.code === '23P01') {
                    if (String(err.constraint ?? '').includes('paciente')) {
                        throw errorHttp(409, 'Ya tienes una cita en ese horario');
                    }
                    // La restricción del odontólogo no excluye al genérico (ver migración)
                    throw errorHttp(
                        409,
                        'Ya hay una urgencia registrada a esa hora. Elige otra hora de llegada.'
                    );
                }
                throw err;
            }

            const { rows: odo } = await cliente.query(
                `SELECT CONCAT_WS(' ', nombre, ape_pat, ape_mat) AS nombre
                 FROM odontologos
                 WHERE idOdontologo = $1`,
                [idOdontologo]
            );

            await cliente.query('COMMIT');

            return {
                id_cita: fila.id_cita,
                fecha,
                hora,
                hora_fin: hhmm(fila.hora_fin),
                odontologo: {
                    id_odontologo: idOdontologo,
                    nombre: odo[0]?.nombre ?? 'Odontólogo Urgencia',
                    cedula: null,
                },
                cabecera_nueva: false,
            };
        }

        // 3. Odontólogos libres a esa hora, del menos al más cargado.
        //    Si el paciente tiene odontólogo de cabecera, solo cuenta él.
        const fijo = usarOdontologoDelPaciente
            ? await obtenerOdontologoFijo({ idPaciente, idServicio, db: cliente })
            : null;

        const { rows: candidatos } = await cliente.query(SQL_CANDIDATOS, [
            idSede,
            fecha,
            hora,
            fijo?.id_odontologo ?? null,
            idServicio,
        ]);
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

        // 5. Primera consulta (o su odontólogo ya no está activo): queda como su odontólogo de cabecera
        const esConsulta = CATEGORIAS_CON_CABECERA.includes(String(relacion[0].categoria).toLowerCase());
        const cabeceraNueva = usarOdontologoDelPaciente && esConsulta && !fijo;
        if (cabeceraNueva) {
            await cliente.query(
                'UPDATE pacientes SET idOdontologo = $1::int WHERE idPaciente = $2::int',
                [creada.candidato.idodontologo, idPaciente]
            );
        }

        // 6. Nombre del odontólogo asignado, para mostrárselo al paciente
        const { rows: odontologo } = await cliente.query(
            `SELECT CONCAT_WS(' ', nombre, ape_pat, ape_mat) AS nombre, cedula
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
                cedula: odontologo[0]?.cedula ?? null,
            },
            cabecera_nueva: cabeceraNueva,
        };
    } catch (err) {
        await cliente.query('ROLLBACK').catch(() => {});
        if (err.status) throw err;
        manejarErrorPg(err);
    } finally {
        cliente.release();
    }
};

/* ============================================================
   CORREO DE CITA AGENDADA
   ============================================================ */

// Datos de una cita para armar el correo. fecha y hora salen como texto para evitar
// problemas de zona horaria con el driver.
const obtenerDatosParaCorreo = async (idCita) => {
    const { rows } = await conexion.query(
        `SELECT
            to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
            to_char(c.hora, 'HH24:MI') AS hora,
            u.correo AS correo_paciente,
            p.nombre AS nombre_paciente,
            s.nombre AS servicio,
            cl.nombre AS sede,
            ${DIRECCION_COMPLETA} AS direccion,
            CONCAT_WS(' ', o.nombre, o.ape_pat, o.ape_mat) AS odontologo
         FROM citas c
         JOIN pacientes p         ON p.idPaciente = c.idPaciente
         JOIN usuarios u          ON u.idUsuario = p.idUsuario
         JOIN clinica_servicio cs ON cs.idClinica_Servicio = c.idClinica_Servicio
         JOIN servicios s         ON s.idServicio = cs.idServicio
         JOIN clinicas cl         ON cl.idClinica = cs.idClinica
         LEFT JOIN direcciones d  ON d.idDireccion = cl.idDireccion
         JOIN odontologos o       ON o.idOdontologo = c.idOdontologo
         WHERE c.idCita = $1::int`,
        [idCita]
    );
    return rows[0] ?? null;
};

// Manda al paciente un correo con los datos de su cita. Nunca lanza error: la cita ya está
// guardada, y si el correo falla solo se registra en la consola.
export const notificarCitaPorCorreo = async (idCita) => {
    try {
        if (!correoConfigurado()) return; // sin SMTP configurado no se envía nada
        const datos = await obtenerDatosParaCorreo(idCita);
        if (!datos?.correo_paciente) return;
        await enviarConfirmacionCita(datos);
    } catch (err) {
        console.error(`[correo] no se pudo enviar el correo de la cita ${idCita}: ${err.message}`);
    }
};

/* ============================================================
   ODONTÓLOGO PROPUESTO
   ============================================================ */

// Odontólogo al que se asignaría la cita ahora mismo, con el mismo criterio que usa crearCita.
// Es solo una propuesta para mostrarla antes de confirmar: al confirmar se vuelve a calcular,
// así que si alguien toma ese horario antes, se asigna a otro disponible.
// idOdontologo: si se indica, solo se considera a ese odontólogo (el de cabecera).
// idServicio: solo odontólogos que pueden hacer ese servicio.
// Devuelve null si ya no queda nadie libre a esa hora.
export const obtenerOdontologoPropuesto = async ({
    idClinica,
    fecha,
    hora,
    idOdontologo = null,
    idServicio = null,
}) => {
    const { rows: candidatos } = await conexion.query(SQL_CANDIDATOS, [
        idClinica,
        fecha,
        hora,
        idOdontologo,
        idServicio,
    ]);
    if (candidatos.length === 0) return null;

    const { rows } = await conexion.query(
        `SELECT idOdontologo AS id_odontologo,
                CONCAT_WS(' ', nombre, ape_pat, ape_mat) AS nombre,
                cedula
         FROM odontologos
         WHERE idOdontologo = $1`,
        [candidatos[0].idodontologo]
    );
    return rows[0] ?? null;
};