import {
    cancelarCita,
    obtenerCitasPaciente,
    obtenerIdPaciente,
} from '../../services/citas/misCitasServices.js';

// Misma forma de error que tu middleware: { error: '...' }
const responderError = (res, error) => {
    const status = error.status ?? 500;
    if (status === 500) console.error('[citas]', error);
    res.status(status).json({
        error: status === 500 ? 'Error interno del servidor' : error.message,
    });
};

// Tu middleware guarda el id del usuario en req.usuario.sub
const idUsuarioDe = (req) => req.usuario?.sub;

export const listarMisCitas = async (req, res) => {
    try {
        const idPaciente = await obtenerIdPaciente(idUsuarioDe(req));
        const citas = await obtenerCitasPaciente(idPaciente);
        res.json(citas);
    } catch (error) {
        responderError(res, error);
    }
};

export const cancelarMiCita = async (req, res) => {
    try {
        const idCita = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(idCita)) {
            return res.status(400).json({ error: 'El id de la cita no es válido' });
        }

        const idPaciente = await obtenerIdPaciente(idUsuarioDe(req));
        const cita = await cancelarCita({ idCita, idPaciente });
        res.json(cita);
    } catch (error) {
        responderError(res, error);
    }
};

export const reagendarMiCita = async (req, res) => {
    try {
        const idCita = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(idCita)) {
            return res.status(400).json({ error: 'El id de la cita no es válido' });
        }

        const { fecha, hora } = req.body ?? {};
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora ?? '')) {
            return res.status(400).json({ error: 'Indica la nueva fecha (AAAA-MM-DD) y hora (HH:mm)' });
        }

        const idPaciente = await obtenerIdPaciente(idUsuarioDe(req));
        const cita = await reagendarCita({ idCita, idPaciente, fecha, hora });
        res.json(cita);
    } catch (error) {
        responderError(res, error);
    }
};