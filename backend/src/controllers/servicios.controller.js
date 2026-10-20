import * as servicioService from '../services/serviciosServices.js';

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
    const descripcion = body.descripcion?.toString().trim() || null;
    const idclinica = body.idclinica ?? null;

    if (!idclinica) return { error: 'La clínica es obligatoria' };

    if (!nombre) return { error: 'El nombre es obligatorio' };
    if (nombre.length > 100) return { error: 'El nombre no puede exceder 100 caracteres' };

    return { datos: { nombre, descripcion, idclinica } };
};

export const listar = async (req, res) => {
    const filtroActivo = req.query.activo ?? 'todos';
    const { paquete, sub } = req.usuario || {};

    if (!FILTROS_VALIDOS.includes(filtroActivo)) {
        return res.status(400).json({ error: "activo debe ser 'true', 'false' o 'todos'" });
    }
    try {
        res.json(await servicioService.obtenerServicios({ filtroActivo, idUsuario: sub, paquete }));
    } catch (err) {
        responderError(res, err);
    }
};

export async function listarCatalogo(req, res, next) {
    try {
        const servicios = await servicioService.obtenerCatalogoServicios();
        res.json(servicios);
    } catch (err) {
        next(err);
    }
}


export const obtenerPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const servicio = await servicioService.obtenerServicioPorId(Number(id));
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
        res.json(servicio);
    } catch (err) {
        responderError(res, err);
    }
};
const validarBodyCrear = (body) => {
    const { nombre } = body;
    const descripcion = body.descripcion ?? '';
    const ids = body.idsClinicas ?? (body.idclinica ? [body.idclinica] : []);

    if (typeof nombre !== 'string' || !nombre.trim())
        return { error: 'El nombre es obligatorio' };
    if (nombre.trim().length > 100)
        return { error: 'El nombre no puede exceder 100 caracteres' };
    if (typeof descripcion !== 'string')
        return { error: 'La descripción debe ser texto' };
    if (!Array.isArray(ids) || ids.length === 0)
        return { error: 'Debe asignarse al menos una clínica' };

    const idsClinicas = ids.map(Number);
    if (idsClinicas.some((id) => !Number.isInteger(id) || id <= 0))
        return { error: 'idsClinicas debe contener enteros positivos' };

    return {
        datos: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            idsClinicas: [...new Set(idsClinicas)],
        },
    };
};

export const crear = async (req, res) => {
    const { datos, error } = validarBodyCrear(req.body);

    if (error) return res.status(400).json({ error });
    try {
        const servicio = await servicioService.crearServicio(datos);
        res.status(201).json(servicio);
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
        const servicio = await servicioService.actualizarServicio(Number(id), datos);
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado o desactivado' });
        res.json(servicio);
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await servicioService.eliminarServicio(Number(id));
        if (!ok) return res.status(404).json({ error: 'Servicio no encontrado o ya desactivado' });
        res.status(200).json({ mensaje: 'Servicio eliminado correctamente.' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const servicio = await servicioService.reactivarServicio(Number(id));
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado o ya activo' });
        res.json({ mensaje: 'Servicio reactivado correctamente.', servicio });
    } catch (err) {
        responderError(res, err);
    }
};