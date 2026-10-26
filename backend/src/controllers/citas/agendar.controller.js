import * as agendarService from '../../services/citas/agendarServices.js';

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

// GET /disponibilidad?idsede=1&fecha=2026-10-28
export const listar = async (req, res) => {
    const { idsede, fecha } = req.query;

    if (!idValido(idsede)) {
        return res.status(400).json({ error: 'idsede debe ser un entero positivo' });
    }
    if (!fechaValida(fecha)) {
        return res.status(400).json({ error: 'fecha debe tener el formato AAAA-MM-DD' });
    }

    try {
        const disponibilidad = await agendarService.obtenerHorariosDisponibles({
            idClinica: Number(idsede),
            fecha,
        });
        res.json(disponibilidad);
    } catch (err) {
        responderError(res, err);
    }
};

// POST /citas
// body: { id_servicio, id_sede, fecha: 'AAAA-MM-DD', hora: 'HH:mm', motivo?, idtipo? }
// El paciente sale de la sesión; el odontólogo lo asigna el sistema.
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
        res.status(201).json(cita);
    } catch (err) {
        responderError(res, err);
    }
};