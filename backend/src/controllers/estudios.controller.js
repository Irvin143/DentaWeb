import * as estudiosService from '../services/estudiosServices.js';

const esTexto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const esOpcional = (v, max) => v === undefined || v === null || (typeof v === 'string' && v.length <= max);

function leerId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export const obtenerEstudios = async (req, res) => {
    try {
        const filtroActivo = req.query.activo ?? 'todos';
        const estudios = await estudiosService.obtenerEstudios({ filtroActivo });
        res.json(estudios);
    } catch (error) {
        console.error("Error al obtener estudios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export async function crearEstudio(req, res, next) {
    try {
        const { nombre, descripcion = null } = req.body ?? {};

        if (!esTexto(nombre, 100)) {
        return res.status(400).json({ error: 'El nombre es obligatorio (máx. 100 caracteres)' });
        }
        if (!esOpcional(descripcion, 1000)) {
        return res.status(400).json({ error: 'Descripción inválida (máx. 1000 caracteres)' });
        }

        const data = await estudiosService.crearEstudio({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        });
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
}

export async function actualizarEstudio(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const { nombre, descripcion = null } = req.body ?? {};

        if (!esTexto(nombre, 100)) {
        return res.status(400).json({ error: 'El nombre es obligatorio (máx. 100 caracteres)' });
        }
        if (!esOpcional(descripcion, 1000)) {
        return res.status(400).json({ error: 'Descripción inválida (máx. 1000 caracteres)' });
        }

        const data = await estudiosService.actualizarEstudio(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        });
        if (!data) return res.status(404).json({ error: 'Estudio no encontrado' });

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}

export async function eliminarEstudio(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const eliminado = await estudiosService.eliminarEstudio(id);
        if (!eliminado) return res.status(404).json({ error: 'Estudio no encontrado' });

        res.status(200).json({ mensaje: 'Estudio desactivado correctamente' });
    } catch (err) {
        next(err);
    }
}

export async function reactivarEstudio(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const data = await estudiosService.reactivarEstudio(id);
        if (!data) return res.status(404).json({ error: 'Estudio no encontrado o ya está activo' });

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}