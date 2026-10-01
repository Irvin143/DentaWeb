import * as paqueteRolService from '../services/paqueteRolServices.js';

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

    if (!nombre) return { error: 'El nombre es obligatorio' };
    if (nombre.length > 50) return { error: 'El nombre no puede exceder 50 caracteres' };

    return { datos: { nombre, descripcion } };
};

export const listar = async (req, res) => {
    const filtroActivo = req.query.activo ?? 'todos';
    if (!FILTROS_VALIDOS.includes(filtroActivo)) {
        return res.status(400).json({ error: "activo debe ser 'true', 'false' o 'todos'" });
    }
    try {
        res.json(await paqueteRolService.obtenerPaquetes({ filtroActivo }));
    } catch (err) {
        responderError(res, err);
    }
};

export const obtenerPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const paquete = await paqueteRolService.obtenerPaquetePorId(Number(id));
        if (!paquete) return res.status(404).json({ error: 'Paquete no encontrado' });
        res.json(paquete);
    } catch (err) {
        responderError(res, err);
    }
};

export const crear = async (req, res) => {
    const { datos, error } = validarBody(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const paquete = await paqueteRolService.crearPaquete(datos);
        res.status(201).json(paquete);
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
        const paquete = await paqueteRolService.actualizarPaquete(Number(id), datos);
        if (!paquete) return res.status(404).json({ error: 'Paquete no encontrado o desactivado' });
        res.json(paquete);
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await paqueteRolService.eliminarPaquete(Number(id));
        if (!ok) return res.status(404).json({ error: 'Paquete no encontrado o ya desactivado' });
        res.status(200).json({ mensaje: 'Paquete eliminado correctamente' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const paquete = await paqueteRolService.reactivarPaquete(Number(id));
        if (!paquete) return res.status(404).json({ error: 'Paquete no encontrado o ya activo' });
        res.json({ mensaje: 'Paquete reactivado correctamente', paquete });
    } catch (err) {
        responderError(res, err);
    }
};