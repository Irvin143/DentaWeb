import jwt from 'jsonwebtoken';
import * as authService from '../services/loginServices.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esTexto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function errorContrasena(contrasena) {
    if (typeof contrasena !== 'string' || contrasena.trim().length === 0) {
        return 'La contraseña no puede ser solo espacios.';
    }
    if (contrasena.length < 8 || contrasena.length > 72) {
        return 'La contraseña debe tener entre 8 y 72 caracteres.';
    }
    if (!/\p{Lu}/u.test(contrasena)) {
        return 'La contraseña debe incluir al menos una mayúscula.';
    }
    if (!/\p{Ll}/u.test(contrasena)) {
        return 'La contraseña debe incluir al menos una minúscula.';
    }
    if (!/\p{Nd}/u.test(contrasena)) {
        return 'La contraseña debe incluir al menos un número.';
    }
    if (!/[^\p{L}\p{N}\s]/u.test(contrasena)) {
        return 'La contraseña debe incluir al menos un carácter especial.';
    }
    return null;
}

export async function registro(req, res, next) {
    try {
        const { correo, contrasena, nombre, ape_pat, ape_mat = null, telefono = null } = req.body ?? {};

        // 1. Validaciones
        if (!esTexto(correo, 150) || !EMAIL_RE.test(correo.trim())) {
        return res.status(400).json({ error: 'Correo inválido' });
        }
        const errorClave = errorContrasena(contrasena);
        if (errorClave) {
        return res.status(400).json({ error: errorClave });
        }
        if (!esTexto(nombre, 100) || !esTexto(ape_pat, 100)) {
        return res.status(400).json({ error: 'Nombre y apellido paterno son obligatorios' });
        }
        if(telefono !== 10 && telefono !== 0 && telefono !== null) {
            return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos o no tener valor' });
        }

        // 2. Llamar al service
        const data = await authService.registrarPaciente({
        correo: correo.trim(),
        contrasena,
        nombre: nombre.trim(),
        ape_pat: ape_pat.trim(),
        ape_mat: ape_mat?.trim() || null,
        telefono: telefono?.trim() || null,
        });

        // 3. Responder
        res.status(201).json(data);
    } catch (err) {
        next(err); // lo maneja el middleware de errores de app.js
    }
}


export async function login(req, res, next) {
    try {
        const { correo, contrasena } = req.body ?? {};

        // 1. Validación básica
        if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo.trim() || !contrasena.trim()) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }

        // 2. Llamar al service
        const data = await authService.login({
        correo: correo.trim(),
        contrasena,
        });

        // 3. Responder con { token, usuario }
        res.status(200).json(data);
    } catch (err) {
        next(err); // el 401 del service llega al manejador de errores
    }
}

// El id sale solo del token. Se ignora cualquier id del cuerpo o de la URL.
export async function cambiarContrasenaPropia(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        let payload;
        try {
            payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const idUsuario = Number(payload?.sub);
        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { actual, nueva } = req.body ?? {};
        if (typeof actual !== 'string') {
            return res.status(400).json({ error: 'La contraseña actual es obligatoria' });
        }

        const errorClave = errorContrasena(nueva);
        if (errorClave) {
            return res.status(400).json({ error: errorClave });
        }

        await authService.cambiarContrasenaPropia({ idUsuario, actual, nueva });
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        next(err);
    }
}