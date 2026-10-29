import conexion from '../conexion.js'; // la misma ruta que usas en los demás services
import { correoConfigurado, enviarCorreo } from './correoServices.js';
import { crearCita, notificarCitaPorCorreo } from './agendarServices.js';

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Motivos que acepta el formulario y su texto legible
export const MOTIVOS_URGENCIA = {
    dolor: 'Dolor agudo o punzante',
    roto: 'Diente roto o fisurado',
    bracket: 'Bracket despegado',
    sangrado: 'Inflamación / Sangrado',
    corona: 'Pérdida de corona/calza',
    otro: 'Otro incidente',
};

const ZONA = 'America/Mazatlan';
const MINUTOS_LLEGADA_INMEDIATA = 30; // tiempo que se le da al paciente para llegar
const INTENTOS_MAXIMOS = 3; // veces que se busca otro espacio si alguien se adelanta

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

// Sedes que pueden recibir una urgencia: clínicas activas que tienen el servicio de urgencia
// activo y al menos un odontólogo activo.
// $1 = id de la sede (o null para listarlas todas)
const SQL_SEDES = `
    SELECT c.idClinica AS id_sede,
           c.nombre,
           ${DIRECCION_COMPLETA} AS direccion
    FROM clinicas c
    JOIN usuarios uc        ON uc.idUsuario = c.idUsuario AND uc.activo
    LEFT JOIN direcciones d ON d.idDireccion = c.idDireccion
    WHERE ($1::int IS NULL OR c.idClinica = $1::int)
      AND EXISTS (
            SELECT 1
            FROM clinica_servicio cs
            JOIN servicios s ON s.idServicio = cs.idServicio AND s.activo
            WHERE cs.idClinica = c.idClinica AND cs.activo AND s.categoria = 'urgencia'
      )
      AND EXISTS (
            SELECT 1
            FROM odontologo_clinica oc
            JOIN odontologos o ON o.idOdontologo = oc.idOdontologo
            JOIN usuarios uo   ON uo.idUsuario = o.idUsuario AND uo.activo
            WHERE oc.idClinica = c.idClinica AND oc.activo
      )
    ORDER BY c.nombre
`;

/* ============================================================
   SEDES
   ============================================================ */

export const obtenerSedesUrgencia = async () => {
    const { rows } = await conexion.query(SQL_SEDES, [null]);
    return rows;
};

/* ============================================================
   CREAR URGENCIA (se agenda como una cita)
   ============================================================ */

// Servicio de urgencia que ofrece la sede
const obtenerServicioUrgencia = async (idSede) => {
    const { rows } = await conexion.query(
        `SELECT cs.idServicio AS id_servicio
         FROM clinica_servicio cs
         JOIN servicios s ON s.idServicio = cs.idServicio AND s.activo
         WHERE cs.idClinica = $1::int AND cs.activo AND s.categoria = 'urgencia'
         ORDER BY cs.idClinica_Servicio DESC
         LIMIT 1`,
        [idSede]
    );
    return rows[0]?.id_servicio ?? null;
};

// Tipo de cita 'Urgencia'.
// TODO: ajusta esta consulta a la estructura real de tipos_cita
const obtenerIdTipoUrgencia = async () => {
    const { rows } = await conexion.query(
        `SELECT idTipo FROM tipos_cita WHERE lower(nombre) IN ('urgencia', 'urgencias') LIMIT 1`
    );
    if (!rows[0]) {
        throw errorHttp(
            500,
            "No hay un tipo de cita llamado 'Urgencia'. Créalo en el catálogo de tipos de cita."
        );
    }
    return rows[0].idtipo;
};

// Primer espacio libre de hoy en la sede, a partir de la hora indicada.
// Sin hora, se toma el que empieza dentro de MINUTOS_LLEGADA_INMEDIATA minutos o después.
// Devuelve { fecha: 'AAAA-MM-DD', hora: 'HH:mm' } o null si hoy ya no queda ninguno.
const primerEspacioDisponible = async (idSede, horaLlegada) => {
    const { rows } = await conexion.query(
        `SELECT
            to_char((now() AT TIME ZONE '${ZONA}')::date, 'YYYY-MM-DD') AS fecha,
            to_char(
                (SELECT MIN(hora)
                 FROM fn_slots_disponibles($1::int, (now() AT TIME ZONE '${ZONA}')::date)
                 WHERE hora >= COALESCE(
                     $2::time,
                     ((now() AT TIME ZONE '${ZONA}') + make_interval(mins => $3::int))::time
                 )),
                'HH24:MI'
            ) AS hora`,
        [idSede, horaLlegada, MINUTOS_LLEGADA_INMEDIATA]
    );
    const fila = rows[0];
    return fila?.hora ? { fecha: fila.fecha, hora: fila.hora } : null;
};

// Agenda la urgencia como una cita en el primer espacio libre de hoy, con el odontólogo libre
// de menor carga (el mismo criterio que al agendar normal).
// horaLlegada: 'HH:mm' o null (lo antes posible)
// Si hoy no queda ningún espacio, responde 409 y avisa a la clínica por correo para que
// pueda contactar al paciente.
export const crearUrgencia = async ({ idPaciente, idSede, motivo, sintomas, horaLlegada = null }) => {
    // 1. La sede debe recibir urgencias
    const { rows: sedes } = await conexion.query(SQL_SEDES, [idSede]);
    if (!sedes[0]) throw errorHttp(400, 'La sede indicada no está disponible para urgencias');
    const sede = sedes[0];

    const idServicio = await obtenerServicioUrgencia(idSede);
    if (!idServicio) throw errorHttp(400, 'La sede indicada no atiende urgencias');
    const idTipo = await obtenerIdTipoUrgencia();

    // Queda en la cita como observaciones, para que el odontólogo sepa a qué viene el paciente
    const observaciones = `URGENCIA - ${MOTIVOS_URGENCIA[motivo] ?? motivo}: ${sintomas}`;

    // 2. Se busca el primer espacio libre. Si alguien lo toma antes, se busca el siguiente.
    for (let intento = 0; intento < INTENTOS_MAXIMOS; intento += 1) {
        const espacio = await primerEspacioDisponible(idSede, horaLlegada);
        if (!espacio) break;

        try {
            const cita = await crearCita({
                idPaciente,
                idSede,
                idServicio,
                fecha: espacio.fecha,
                hora: espacio.hora,
                motivo: observaciones,
                idTipo,
            });

            // Aviso a la clínica y correo de la cita al paciente (ninguno lanza error)
            await Promise.all([
                avisarClinica({ idPaciente, idSede, motivo, sintomas, horaLlegada, cita }),
                notificarCitaPorCorreo(cita.id_cita),
            ]);

            return { ...cita, sede };
        } catch (err) {
            // Otra persona tomó ese espacio justo antes: se prueba con el siguiente
            if (err.status === 409 && /ya no está disponible/i.test(err.message)) continue;
            throw err;
        }
    }

    // 3. No hay ningún espacio libre hoy: la clínica se entera de todos modos
    await avisarClinica({ idPaciente, idSede, motivo, sintomas, horaLlegada, cita: null });
    throw errorHttp(
        409,
        'Hoy no hay espacio disponible en esta sede. Ya avisamos a la clínica; si es muy urgente, llámales directamente o prueba con otra sede.'
    );
};

/* ============================================================
   AVISO A LA CLÍNICA POR CORREO
   ============================================================ */

const escaparHtml = (texto) =>
    String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// '14:30' → '02:30 PM'
const horaLegible = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Avisa a la clínica que entró una urgencia, con la cita asignada o, si no hubo espacio
// (cita = null), con la indicación de contactar al paciente de inmediato.
// Nunca lanza error: si el correo falla solo se registra en la consola.
// TODO: ajusta nombre, ape_pat, ape_mat y telefono a las columnas reales de pacientes
const avisarClinica = async ({ idPaciente, idSede, motivo, sintomas, horaLlegada, cita }) => {
    try {
        if (!correoConfigurado()) return; // sin SMTP configurado no se envía nada

        const { rows } = await conexion.query(
            `SELECT
                CONCAT_WS(' ', p.nombre, p.ape_pat, p.ape_mat) AS paciente,
                p.telefono AS telefono_paciente,
                up.correo AS correo_paciente,
                c.nombre AS sede,
                uc.correo AS correo_clinica
             FROM pacientes p
             JOIN usuarios up ON up.idUsuario = p.idUsuario
             CROSS JOIN clinicas c
             JOIN usuarios uc ON uc.idUsuario = c.idUsuario
             WHERE p.idPaciente = $1::int AND c.idClinica = $2::int`,
            [idPaciente, idSede]
        );
        const d = rows[0];
        if (!d?.correo_clinica) return;

        const motivoTexto = MOTIVOS_URGENCIA[motivo] ?? motivo;
        const llegada = horaLlegada
            ? `Hoy a las ${horaLegible(horaLlegada)}`
            : 'Lo antes posible (30 a 45 minutos)';
        const citaTexto = cita
            ? `Cita asignada: hoy a las ${horaLegible(cita.hora)} con ${cita.odontologo?.nombre ?? 'un odontólogo'}`
            : 'NO HAY ESPACIO HOY EN LA AGENDA. Comunícate con el paciente de inmediato.';

        const asunto = cita
            ? `URGENCIA agendada: ${motivoTexto} - ${d.paciente}`
            : `URGENCIA SIN ESPACIO: ${motivoTexto} - ${d.paciente}`;

        const texto = [
            citaTexto,
            '',
            `Paciente: ${d.paciente}`,
            `Teléfono: ${d.telefono_paciente ?? 'No registrado'}`,
            `Correo: ${d.correo_paciente}`,
            `Motivo: ${motivoTexto}`,
            `Llegada estimada: ${llegada}`,
            '',
            'Síntomas:',
            sintomas,
        ].join('\n');

        const fila = (titulo, valor) =>
            `<tr>
                <td style="padding:6px 12px 6px 0;color:#64748b;font-size:14px;vertical-align:top;">${titulo}</td>
                <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${valor}</td>
            </tr>`;

        const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#b91c1c;margin:0 0 8px;">${cita ? 'Urgencia agendada' : 'Urgencia sin espacio'}</h2>
            <p style="color:#1e293b;font-size:15px;margin:0 0 16px;">${escaparHtml(citaTexto)}</p>
            <table style="border-collapse:collapse;margin:0 0 16px;">
                ${fila('Paciente', escaparHtml(d.paciente))}
                ${fila('Teléfono', escaparHtml(d.telefono_paciente ?? 'No registrado'))}
                ${fila('Correo', escaparHtml(d.correo_paciente))}
                ${fila('Motivo', escaparHtml(motivoTexto))}
                ${fila('Llegada estimada', escaparHtml(llegada))}
            </table>
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Síntomas descritos:</p>
            <p style="color:#1e293b;font-size:14px;background:#f8fafc;border-radius:8px;padding:12px;white-space:pre-wrap;">${escaparHtml(sintomas)}</p>
        </div>`;

        await enviarCorreo({ para: d.correo_clinica, asunto, texto, html });
    } catch (err) {
        console.error(`[correo] no se pudo avisar a la clínica de la urgencia: ${err.message}`);
    }
};