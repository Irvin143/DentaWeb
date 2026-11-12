import nodemailer from 'nodemailer';
import conexion from '../conexion.js';

// Variables de entorno:
//   SMTP_HOST, SMTP_PORT (587 por defecto), SMTP_SECURE ('true' para el puerto 465),
//   SMTP_USER, SMTP_PASS, MAIL_FROM (opcional; por defecto SMTP_USER)
//   MAIL_DESTINO_PRUEBA (opcional): manda TODOS los correos a esta dirección, útil al probar

let transporte = null;

export const correoConfigurado = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const obtenerTransporte = () => {
    if (transporte) return transporte;
    if (!correoConfigurado()) {
        throw new Error('Falta configurar el correo (SMTP_HOST, SMTP_USER y SMTP_PASS)');
    }
    transporte = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transporte;
};

export const enviarCorreo = async ({ para, asunto, texto, html }) => {
    const desvio = process.env.MAIL_DESTINO_PRUEBA;
    await obtenerTransporte().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: desvio || para,
        subject: desvio ? `[PRUEBA] ${asunto}` : asunto,
        text: texto,
        html,
    });
};

/* ============================================================
   CORREO DE CITA AGENDADA
   ============================================================ */

const escaparHtml = (texto) =>
    String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// '2026-10-30' → 'Viernes, 30 de octubre'
const fechaLegible = (fechaISO) =>
    capitalizar(
        new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        })
    );

// '14:30' → '02:30 PM'
const horaLegible = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const urlMapa = (direccion) =>
    direccion
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
        : null;

// cita: { correo_paciente, nombre_paciente, servicio, fecha 'AAAA-MM-DD', hora 'HH:mm',
//         sede, direccion, odontologo }
export const enviarConfirmacionCita = async (cita, reagendada = false) => {
    const fecha = fechaLegible(cita.fecha);
    const hora = horaLegible(cita.hora);
    const mapa = urlMapa(cita.direccion);
    const saludo = cita.nombre_paciente ? `Hola ${cita.nombre_paciente},` : 'Hola,';

    const asunto = reagendada
        ? `Tu cita fue reagendada: ${fecha}, ${hora}`
        : `Tu cita: ${fecha}, ${hora}`;

    const texto = [
        saludo,
        '',
        reagendada ? 'Tu cita fue reagendada:' : 'Tu cita quedó agendada:',
        `• Servicio: ${cita.servicio}`,
        `• Fecha: ${fecha}`,
        `• Hora: ${hora}`,
        `• Sede: ${cita.sede}${cita.direccion ? ` (${cita.direccion})` : ''}`,
        `• Odontólogo: ${cita.odontologo}`,
        mapa ? `\nCómo llegar: ${mapa}` : '',
        '\nPuedes cancelar o reprogramar sin costo hasta 4 horas antes de tu cita.',
    ]
        .filter((linea) => linea !== '')
        .join('\n');

    const fila = (titulo, valor) =>
        `<tr>
            <td style="padding:6px 12px 6px 0;color:#64748b;font-size:14px;">${titulo}</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${valor}</td>
        </tr>`;

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#0f766e;margin:0 0 16px;">${reagendada ? 'Tu cita fue reagendada' : 'Tu cita está agendada'}</h2>
        <p style="color:#1e293b;font-size:15px;">${escaparHtml(saludo)}</p>
        <p style="color:#1e293b;font-size:15px;">Estos son los datos de tu cita:</p>
        <table style="border-collapse:collapse;margin:12px 0 20px;">
            ${fila('Servicio', escaparHtml(cita.servicio))}
            ${fila('Fecha', escaparHtml(fecha))}
            ${fila('Hora', escaparHtml(hora))}
            ${fila('Sede', escaparHtml(cita.sede))}
            ${cita.direccion ? fila('Dirección', escaparHtml(cita.direccion)) : ''}
            ${fila('Odontólogo', escaparHtml(cita.odontologo))}
        </table>
        ${
            mapa
                ? `<p><a href="${escaparHtml(mapa)}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;">Ver ubicación en el mapa</a></p>`
                : ''
        }
        <p style="color:#64748b;font-size:13px;margin-top:24px;">
            Puedes cancelar o reprogramar sin costo hasta 4 horas antes de tu cita.
        </p>
    </div>`;

    await enviarCorreo({ para: cita.correo_paciente, asunto, texto, html });
};

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
export const notificarCitaPorCorreo = async (idCita, reagendada = false) => {
    try {
        if (!correoConfigurado()) return; // sin SMTP configurado no se envía nada
        const datos = await obtenerDatosParaCorreo(idCita);
        if (!datos?.correo_paciente) return;
        await enviarConfirmacionCita(datos, reagendada);
    } catch (err) {
        console.error(`[correo] no se pudo enviar el correo de la cita ${idCita}: ${err.message}`);
    }
};