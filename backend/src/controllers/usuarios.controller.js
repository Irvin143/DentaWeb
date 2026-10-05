import * as usuarioService from '../services/usuariosServices.js';

const FILTROS_VALIDOS = ['true', 'false', 'todos'];
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// Valida la contraseña (bcrypt solo considera los primeros 72 bytes)
const validarContrasena = (contrasena) => {
    if (typeof contrasena !== 'string' || contrasena.length < 8) {
        return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (Buffer.byteLength(contrasena, 'utf8') > 72) {
        return 'La contraseña no puede exceder 72 bytes';
    }
    return null;
};

const validarDatosBase = (body = {}) => {
    const correo = body.correo?.toString().trim().toLowerCase();
    const idpaquete = body.idpaquete ?? null;
    const idtipousuario = body.idtipousuario ?? null;

    if (!correo) return { error: 'El correo es obligatorio' };
    if (correo.length > 150) return { error: 'El correo no puede exceder 150 caracteres' };
    if (!REGEX_CORREO.test(correo)) return { error: 'El correo no es válido' };
    if (!idValido(idtipousuario)) return { error: 'idtipousuario es obligatorio y debe ser un entero positivo' };
    if (idpaquete !== null && !idValido(idpaquete)) {
        return { error: 'idpaquete debe ser un entero positivo' };
    }

    return {
        datos: {
            correo,
            idtipousuario: Number(idtipousuario),
            idpaquete: idpaquete === null ? null : Number(idpaquete),
        },
    };
};

export const listar = async (req, res) => {
    const filtroActivo = req.query.activo ?? 'todos';
    if (!FILTROS_VALIDOS.includes(filtroActivo)) {
        return res.status(400).json({ error: "activo debe ser 'true', 'false' o 'todos'" });
    }
    try {
        res.json(await usuarioService.obtenerUsuarios({ filtroActivo }));
    } catch (err) {
        responderError(res, err);
    }
};

export const obtenerPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const usuario = await usuarioService.obtenerUsuarioPorId(Number(id));
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (err) {
        responderError(res, err);
    }
};

export const crear = async (req, res) => {
    const { datos, error } = validarDatosBase(req.body);
    if (error) return res.status(400).json({ error });

    const errorContrasena = validarContrasena(req.body?.contrasena);
    if (errorContrasena) return res.status(400).json({ error: errorContrasena });

    try {
        const usuario = await usuarioService.crearUsuario({
            ...datos, // correo, idtipousuario, idpaquete (ya validados y convertidos)
            contrasena: req.body.contrasena,
        });
        res.status(201).json(usuario);
    } catch (err) {
        responderError(res, err);
    }
};

export const actualizar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    const { datos, error } = validarDatosBase(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const usuario = await usuarioService.actualizarUsuario(Number(id), datos);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado o desactivado' });
        res.json(usuario);
    } catch (err) {
        responderError(res, err);
    }
};

export const cambiarContrasena = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });

    const errorContrasena = validarContrasena(req.body?.contrasena);
    if (errorContrasena) return res.status(400).json({ error: errorContrasena });

    try {
        const ok = await usuarioService.cambiarContrasena(Number(id), req.body.contrasena);
        if (!ok) return res.status(404).json({ error: 'Usuario no encontrado o desactivado' });
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await usuarioService.eliminarUsuario(Number(id));
        if (!ok) return res.status(404).json({ error: 'Usuario no encontrado o ya desactivado' });
        res.status(200).json({ mensaje: 'Usuario eliminado correctamente.' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const usuario = await usuarioService.reactivarUsuario(Number(id));
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado o ya activo' });
        res.json({ mensaje: 'Usuario reactivado correctamente.', usuario });
    } catch (err) {
        responderError(res, err);
    }
};