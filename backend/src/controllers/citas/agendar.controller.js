import * as agendarService from '../../services/citas/agendarServices.js';

import  { notificarCitaPorCorreo } from '../../services/citas/correoServices.js';

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// 'AAAA-MM-DD' real (rechaza por ejemplo 2026-02-31)
const fechaValida = (valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor ?? '')) return false;
    const fecha = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

// 'HH:mm' de 24 horas
const horaValida = (valor) => /^([01]\d|2[0-3]):[0-5]\d$/.test(valor ?? '');

const MAX_MOTIVO = 500;

// idservicio es opcional en las consultas; si viene, debe ser válido
const idServicioInvalido = (valor) => valor !== undefined && !idValido(valor);

// Odontólogo de cabecera que corresponde a este servicio para quien hace la petición:
// { id_odontologo, nombre, cedula } o null (sin restricción: no es paciente, no tiene
// odontólogo, o el servicio no es una consulta).
const odontologoFijoDe = async (req, idServicio) => {
    const { sub } = req.usuario || {};
    if (!sub || idServicio === undefined) return null;

    const idPaciente = await agendarService.obtenerIdPacientePorUsuario(sub);
    return agendarService.obtenerOdontologoFijo({ idPaciente, idServicio: Number(idServicio) });
};

// GET /agendar/sedes?idservicio=1
// Sedes que ofrecen el servicio (solo donde atiende su odontólogo de cabecera, si tiene).
export const listarSedes = async (req, res) => {
    const { idservicio } = req.query;
    if (!idValido(idservicio)) {
        return res.status(400).json({ error: 'idservicio debe ser un entero positivo' });
    }

    try {
        const { sub } = req.usuario || {};
        const idPaciente = sub ? await agendarService.obtenerIdPacientePorUsuario(sub) : null;
        res.json(
            await agendarService.obtenerSedesParaAgendar({
                idServicio: Number(idservicio),
                idPaciente,
            })
        );
    } catch (err) {
        responderError(res, err);
    }
};

// GET /agendar/odontologo-fijo?idservicio=1
// Odontólogo de cabecera del paciente para ese servicio. Responde { odontologo: {...} | null }
export const miOdontologo = async (req, res) => {
    const { idservicio } = req.query;
    if (!idValido(idservicio)) {
        return res.status(400).json({ error: 'idservicio debe ser un entero positivo' });
    }

    try {
        res.json({ odontologo: await odontologoFijoDe(req, idservicio) });
    } catch (err) {
        responderError(res, err);
    }
};

// GET /agendar/disponibilidad?idsede=1&fecha=2026-10-28&idservicio=1
export const listar = async (req, res) => {
    const { idsede, fecha, idservicio } = req.query;

    if (!idValido(idsede)) {
        return res.status(400).json({ error: 'idsede debe ser un entero positivo' });
    }
    if (!fechaValida(fecha)) {
        return res.status(400).json({ error: 'fecha debe tener el formato AAAA-MM-DD' });
    }
    if (idServicioInvalido(idservicio)) {
        return res.status(400).json({ error: 'idservicio debe ser un entero positivo' });
    }
    console.log('listar disponibilidad', { idsede, fecha, idservicio });
    try {
        const fijo = await odontologoFijoDe(req, idservicio);
        const disponibilidad = await agendarService.obtenerHorariosDisponibles({
            idClinica: Number(idsede),
            fecha,
            idOdontologo: fijo?.id_odontologo ?? null,
        });
        res.json(disponibilidad);
    } catch (err) {
        responderError(res, err);
    }
};

// GET /agendar/dias-disponibles?idsede=1&dias=30&idservicio=1
// Días con al menos un horario libre en la sede. Responde { dias: ['AAAA-MM-DD', ...] }
export const listarDias = async (req, res) => {
    const { idsede, idservicio, idodontologo } = req.query;
    const dias = req.query.dias === undefined ? 30 : Number(req.query.dias);

    if (!idValido(idsede)) {
        return res.status(400).json({ error: 'idsede debe ser un entero positivo' });
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > 60) {
        return res.status(400).json({ error: 'dias debe ser un entero entre 1 y 60' });
    }
    if (idServicioInvalido(idservicio)) {
        return res.status(400).json({ error: 'idservicio debe ser un entero positivo' });
    }
    if (idodontologo !== undefined && !idValido(idodontologo)) {
        return res.status(400).json({ error: 'idodontologo debe ser un entero positivo' });
    }
    try {
        const fijo = await odontologoFijoDe(req, idservicio);
        // El de cabecera del paciente manda; si no hay (admin reagendando), se usa el que viene en la URL
        const idOdontologo =
            fijo?.id_odontologo ?? (idodontologo !== undefined ? Number(idodontologo) : null);
        res.json(
            await agendarService.obtenerDiasDisponibles({
                idClinica: Number(idsede),
                dias,
                idOdontologo,
                idServicio: idservicio !== undefined ? Number(idservicio) : null,
            })
        );
    } catch (err) {
        responderError(res, err);
    }
};

// GET /agendar/odontologo-propuesto?idsede=1&fecha=2026-10-28&hora=09:30&idservicio=1
// Odontólogo que se asignaría hoy a ese horario. Responde { odontologo: {...} | null }
export const proponerOdontologo = async (req, res) => {
    const { idsede, fecha, hora, idservicio } = req.query;

    if (!idValido(idsede)) {
        return res.status(400).json({ error: 'idsede debe ser un entero positivo' });
    }
    if (!fechaValida(fecha)) {
        return res.status(400).json({ error: 'fecha debe tener el formato AAAA-MM-DD' });
    }
    if (!horaValida(hora)) {
        return res.status(400).json({ error: 'hora debe tener el formato HH:mm' });
    }
    if (idServicioInvalido(idservicio)) {
        return res.status(400).json({ error: 'idservicio debe ser un entero positivo' });
    }

    try {
        const fijo = await odontologoFijoDe(req, idservicio);
        const odontologo = await agendarService.obtenerOdontologoPropuesto({
            idClinica: Number(idsede),
            fecha,
            hora,
            idOdontologo: fijo?.id_odontologo ?? null,
        });
        res.json({ odontologo });
    } catch (err) {
        responderError(res, err);
    }
};

// POST /citas
// body: { id_servicio, id_sede, fecha: 'AAAA-MM-DD', hora: 'HH:mm', motivo?, idtipo? }
// El paciente sale de la sesión; el odontólogo lo asigna el sistema (el de cabecera, si tiene).
export const crear = async (req, res) => {
    const { sub } = req.usuario || {};
    const { id_servicio, id_sede, fecha, hora, idtipo } = req.body ?? {};
    const motivo = req.body?.motivo?.toString().trim() || null;

    if (!idValido(id_servicio)) {
        return res.status(400).json({ error: 'id_servicio debe ser un entero positivo' });
    }
    if (!idValido(id_sede)) {
        return res.status(400).json({ error: 'id_sede debe ser un entero positivo' });
    }
    if (!fechaValida(fecha)) {
        return res.status(400).json({ error: 'fecha debe tener el formato AAAA-MM-DD' });
    }
    if (!horaValida(hora)) {
        return res.status(400).json({ error: 'hora debe tener el formato HH:mm' });
    }
    if (idtipo != null && !idValido(idtipo)) {
        return res.status(400).json({ error: 'idtipo debe ser un entero positivo' });
    }
    if (motivo && motivo.length > MAX_MOTIVO) {
        return res.status(400).json({ error: `El motivo no puede exceder ${MAX_MOTIVO} caracteres` });
    }

    try {
        const idPaciente = await agendarService.obtenerIdPacientePorUsuario(sub);
        if (!idPaciente) {
            return res.status(403).json({ error: 'Tu cuenta no tiene un perfil de paciente' });
        }

        const cita = await agendarService.crearCita({
            idPaciente,
            idSede: Number(id_sede),
            idServicio: Number(id_servicio),
            fecha,
            hora,
            motivo,
            idTipo: idtipo != null ? Number(idtipo) : null,
        });

        // Se espera el correo antes de responder: en Vercel, el trabajo posterior a la respuesta
        // puede cortarse. Esta función nunca lanza error.
        await notificarCitaPorCorreo(cita.id_cita);

        res.status(201).json(cita);
    } catch (err) {
        responderError(res, err);
    }
};