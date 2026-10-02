import * as pacientesService from '../services/pacienteServices.js';

export async function obtenerPacientes(req, res, next) {
    try {
        // 2. Llamar al service
        const pacientes = await pacientesService.obtenerPacientes();

        // 3. Responder
        res.status(200).json({
        total: pacientes.length,
        pacientes,
        });
        
    } catch (err) {
        next(err); // lo maneja el middleware de errores de index.js
    }
}

const esTexto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const esOpcional = (v, max) => v === undefined || v === null || esTexto(v, max);

function leerId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export async function actualizar(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const { nombre, ape_pat, ape_mat, telefono, id_odontologo} = req.body ?? {};

        if (!esOpcional(nombre, 100) || !esOpcional(ape_pat, 100)) {
        return res.status(400).json({ error: 'Datos inválidos' });
        }
        if ([nombre, ape_pat, ape_mat, telefono].every((v) => v == null)) {
        return res.status(400).json({ error: 'No se envió ningún campo para actualizar' });
        }

        const paciente = await pacientesService.actualizarPaciente(id, {
        nombre: nombre?.trim() ?? null,
        ape_pat: ape_pat?.trim() ?? null,
        ape_mat: ape_mat?.trim() ?? null,
        telefono: telefono?.trim() ?? null,
        idOdontologo: id_odontologo ?? null,
        });

        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado o inactivo' });

        res.status(200).json(paciente);
    } catch (err) {
        next(err);
    }
}

export async function eliminar(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const eliminado = await pacientesService.eliminarPaciente(id);
        if (!eliminado) return res.status(404).json({ error: 'Paciente no encontrado' });

        res.status(200).json({ mensaje: 'Paciente desactivado correctamente' });
    } catch (err) {
        next(err);
    }
}

export async function reactivar(req, res, next) {
    try {
        const id = leerId(req);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        const reactivado = await pacientesService.reactivarPaciente(id);
        if (!reactivado) return res.status(404).json({ error: 'Paciente no encontrado o ya está activo' });

        res.status(200).json({ mensaje: 'Paciente reactivado correctamente' });
    } catch (err) {
        next(err);
    }
}

import * as loginServices from '../services/loginServices.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function crearPaciente(req, res, next) {
    try {
        const {
        correo, contrasena, nombre, ape_pat,
        ape_mat = null, telefono = null, id_odontologo = null,
        } = req.body ?? {};

        if (!esTexto(correo, 150) || !EMAIL_RE.test(correo.trim())) {
        return res.status(400).json({ error: 'Correo inválido' });
        }
        if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 72) {
        return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 72 caracteres' });
        }
        if (!esTexto(nombre, 100) || !esTexto(ape_pat, 100)) {
        return res.status(400).json({ error: 'Nombre y apellido paterno son obligatorios' });
        }
        if (id_odontologo !== null && !(Number.isInteger(id_odontologo) && id_odontologo > 0)) {
        return res.status(400).json({ error: 'id_odontologo inválido' });
        }

        const data = await loginServices.registrarPaciente({
        correo: correo.trim(),
        contrasena,
        nombre: nombre.trim(),
        ape_pat: ape_pat.trim(),
        ape_mat: ape_mat?.trim() || null,
        telefono: telefono?.trim() || null,
        id_odontologo,
        });

        res.status(201).json({ ...data, id_odontologo });
    } catch (err) {
        next(err);
    }
}