import * as urgenciasService from '../../services/citas/urgenciasServices .js';
import * as agendarService from '../../services/citas/agendarServices.js';

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// 'HH:mm' de 24 horas
const horaValida = (valor) => /^([01]\d|2[0-3]):[0-5]\d$/.test(valor ?? '');

const MIN_SINTOMAS = 5;
const MAX_SINTOMAS = 1000;

// GET /urgencias/sedes
// Sedes que pueden recibir una urgencia
export const listarSedes = async (req, res) => {
    try {
        res.json(await urgenciasService.obtenerSedesUrgencia());
    } catch (err) {
        responderError(res, err);
    }
};

// POST /urgencias
// body: { id_sede, motivo, sintomas, hora_llegada?: 'HH:mm' }  (sin hora_llegada = lo antes posible)
// Agenda la urgencia como una cita en el primer espacio libre de hoy.
// Responde { id_cita, fecha, hora, hora_fin, odontologo, sede }, o 409 si hoy no hay espacio.
// El paciente sale de la sesión.
export const crear = async (req, res) => {
    const { sub } = req.usuario || {};
    const { id_sede, motivo, hora_llegada } = req.body ?? {};
    const sintomas = req.body?.sintomas?.toString().trim() ?? '';

    if (!idValido(id_sede)) {
        return res.status(400).json({ error: 'id_sede debe ser un entero positivo' });
    }
    if (!Object.keys(urgenciasService.MOTIVOS_URGENCIA).includes(motivo)) {
        return res.status(400).json({ error: 'El motivo de la urgencia no es válido' });
    }
    if (sintomas.length < MIN_SINTOMAS) {
        return res.status(400).json({ error: 'Describe brevemente tus síntomas' });
    }
    if (sintomas.length > MAX_SINTOMAS) {
        return res
            .status(400)
            .json({ error: `La descripción no puede exceder ${MAX_SINTOMAS} caracteres` });
    }
    if (hora_llegada != null && !horaValida(hora_llegada)) {
        return res.status(400).json({ error: 'hora_llegada debe tener el formato HH:mm' });
    }

    try {
        const idPaciente = await agendarService.obtenerIdPacientePorUsuario(sub);
        if (!idPaciente) {
            return res.status(403).json({ error: 'Tu cuenta no tiene un perfil de paciente' });
        }

        const urgencia = await urgenciasService.crearUrgencia({
            idPaciente,
            idSede: Number(id_sede),
            motivo,
            sintomas,
            horaLlegada: hora_llegada ?? null,
        });

        res.status(201).json(urgencia);
    } catch (err) {
        responderError(res, err);
    }
};