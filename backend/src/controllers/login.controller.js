import * as authService from '../services/loginServices.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esTexto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function errorContrasena(contrasena) {
    if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 72) {
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
    if (!/[^\p{L}\p{N}]/u.test(contrasena)) {
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
        if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo.trim() || !contrasena) {
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