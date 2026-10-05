import * as especialidadesService from '../services/especialidades.js';


export async function obtenerEspecialidades(req, res, next) {
    try {
        let pagina = Number.parseInt(req.query.pagina, 10);
        let limite = Number.parseInt(req.query.limite, 10);

        if (!Number.isInteger(pagina) || pagina < 1) pagina = 1;
        if (!Number.isInteger(limite) || limite < 1) limite = 20;
        if (limite > 100) limite = 100;

        const offset = (pagina - 1) * limite;

        const { filas, total } = await especialidadesService.obtenerEspecialidades({ limite, offset });

        res.status(200).json({
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
        especialidades: filas,
        });
    } catch (err) {
        next(err);
    }
}

const esTexto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function leerId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export async function crearEspecialidad(req, res, next) {
    try {
        const { nombre } = req.body ?? {};

        if (!esTexto(nombre, 100)) {
        return res.status(400).json({ error: 'El nombre es obligatorio (máx. 100 caracteres)' });
        }

        const data = await especialidadesService.crearEspecialidad({ nombre: nombre.trim() });
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
}

export async function actualizarEspecialidad(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const { nombre } = req.body ?? {};
        if (!esTexto(nombre, 100)) {
        return res.status(400).json({ error: 'El nombre es obligatorio (máx. 100 caracteres)' });
        }

        const data = await especialidadesService.actualizarEspecialidad(id, { nombre: nombre.trim() });
        if (!data) return res.status(404).json({ error: 'Especialidad no encontrada' });

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}

export async function eliminarEspecialidad(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const eliminado = await especialidadesService.eliminarEspecialidad(id);
        if (!eliminado) return res.status(404).json({ error: 'Especialidad no encontrada' });

        res.status(200).json({ mensaje: 'Especialidad eliminada correctamente.' });
    } catch (err) {
        next(err);
    }
}

export async function reactivarEspecialidad(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const data = await especialidadesService.reactivarEspecialidad(id);
        if (!data) return res.status(404).json({ error: 'Especialidad no encontrada o ya está activa' });

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}