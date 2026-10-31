import {
    cancelarCita,
    obtenerCitasPaciente,
    obtenerIdPaciente,
} from '../../services/citas/misCitasServices.js';
import * as agendaPersonal from '../../services/citas/agendaPersonalServices.js';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const RANGO_MAX_DIAS = 31;

const limpiar = (valor) =>
    String(valor?.nombre ?? valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const identidades = (usuario) =>
    [usuario?.paquete, ...(usuario?.roles ?? [])].filter(Boolean).map(limpiar);

const tieneIdentidad = (usuario, nombre) => identidades(usuario).includes(limpiar(nombre));

const esPersonal = (usuario) =>
    ['admin', 'clinica', 'odontologo'].some((nombre) => tieneIdentidad(usuario, nombre));

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

function fechaValida(valor) {
    if (typeof valor !== 'string' || !FECHA_ISO.test(valor)) return false;
    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );
}

function diasInclusive(desde, hasta) {
    const inicio = Date.parse(`${desde}T00:00:00Z`);
    const fin = Date.parse(`${hasta}T00:00:00Z`);
    return Math.round((fin - inicio) / 86400000) + 1;
}

function enteroPositivo(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

async function listarCitasDelPersonal(req) {
    const { desde, hasta, estado, idclinica, idodontologo } = req.query ?? {};

    if (!fechaValida(desde) || !fechaValida(hasta)) {
        throw errorHttp(400, 'desde y hasta son obligatorios y deben tener formato AAAA-MM-DD.');
    }
    if (desde > hasta) {
        throw errorHttp(400, 'desde no puede ser posterior a hasta.');
    }
    if (diasInclusive(desde, hasta) > RANGO_MAX_DIAS) {
        throw errorHttp(400, 'El rango no puede superar 31 días.');
    }

    const usuario = req.usuario;
    const esAdmin = tieneIdentidad(usuario, 'admin');
    const esOdontologo = tieneIdentidad(usuario, 'odontologo');
    const esClinica = tieneIdentidad(usuario, 'clinica');

    let idOdontologo = null;
    let idsClinica = null;

    if (esAdmin) {
        const filtroOdontologo = enteroPositivo(idodontologo);
        if (idodontologo !== undefined && idodontologo !== null && idodontologo !== '' && filtroOdontologo === undefined) {
            throw errorHttp(400, 'idodontologo debe ser un entero positivo.');
        }
        const filtroClinica = enteroPositivo(idclinica);
        if (idclinica !== undefined && idclinica !== null && idclinica !== '' && filtroClinica === undefined) {
            throw errorHttp(400, 'idclinica debe ser un entero positivo.');
        }
        if (filtroOdontologo != null) idOdontologo = filtroOdontologo;
        if (filtroClinica != null) idsClinica = [filtroClinica];
    } else if (esOdontologo) {
        const id = await agendaPersonal.idOdontologoDeUsuario(usuario.sub);
        if (id == null) return [];
        idOdontologo = id;
    } else if (esClinica) {
        const ids = await agendaPersonal.idsClinicaDeUsuario(usuario.sub);
        if (ids.length === 0) return [];
        idsClinica = ids;
    } else {
        throw errorHttp(403, 'No tienes permiso para esta acción.');
    }

    return agendaPersonal.listarCitasPersonal({
        desde,
        hasta,
        incluirCanceladas: String(estado ?? '').trim().toLowerCase() === 'todos',
        idOdontologo,
        idsClinica,
    });
}

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
        if (esPersonal(req.usuario)) {
            const citas = await listarCitasDelPersonal(req);
            return res.json(citas);
        }

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