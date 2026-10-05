import * as consultorioService from '../services/consultorioServices.js';

const FILTROS_VALIDOS = ['true', 'false', 'todos'];

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// Valida y normaliza el body (POST y PUT)
const validarBody = (body = {}) => {
    const nombre = body.nombre?.toString().trim();
    const idclinica = body.idclinica ?? null;

    if (!nombre) return { error: 'El nombre es obligatorio' };
    if (nombre.length > 100) return { error: 'El nombre no puede exceder 100 caracteres' };
    if (idclinica !== null && !idValido(idclinica)) {
        return { error: 'idclinica debe ser un entero positivo' };
    }

    return {
        datos: {
            nombre,
            idclinica: idclinica === null ? null : Number(idclinica),
        },
    };
};

export const listar = async (req, res) => {
    const filtroActivo = req.query.activo ?? 'todos';
    const { idclinica } = req.query;

    if (!FILTROS_VALIDOS.includes(filtroActivo)) {
        return res.status(400).json({ error: "activo debe ser 'true', 'false' o 'todos'" });
    }
    if (idclinica !== undefined && !idValido(idclinica)) {
        return res.status(400).json({ error: 'idclinica debe ser un entero positivo' });
    }

    try {
        const consultorios = await consultorioService.obtenerConsultorios({
            filtroActivo,
            idClinica: idclinica !== undefined ? Number(idclinica) : null,
        });
        res.json(consultorios);
    } catch (err) {
        responderError(res, err);
    }
};

export const obtenerPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const consultorio = await consultorioService.obtenerConsultorioPorId(Number(id));
        if (!consultorio) return res.status(404).json({ error: 'Consultorio no encontrado' });
        res.json(consultorio);
    } catch (err) {
        responderError(res, err);
    }
};

export const crear = async (req, res) => {
    const { datos, error } = validarBody(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const consultorio = await consultorioService.crearConsultorio(datos);
        res.status(201).json(consultorio);
    } catch (err) {
        responderError(res, err);
    }
};

export const actualizar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    const { datos, error } = validarBody(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const consultorio = await consultorioService.actualizarConsultorio(Number(id), datos);
        if (!consultorio) return res.status(404).json({ error: 'Consultorio no encontrado o desactivado' });
        res.json(consultorio);
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await consultorioService.eliminarConsultorio(Number(id));
        if (!ok) return res.status(404).json({ error: 'Consultorio no encontrado o ya desactivado' });
        res.status(200).json({ mensaje: 'Consultorio eliminado correctamente.' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const consultorio = await consultorioService.reactivarConsultorio(Number(id));
        if (!consultorio) return res.status(404).json({ error: 'Consultorio no encontrado o ya activo' });
        res.json({ mensaje: 'Consultorio reactivado correctamente.', consultorio });
    } catch (err) {
        responderError(res, err);
    }
};