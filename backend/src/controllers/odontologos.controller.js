import * as odontologoService from '../services/odontologosServices.js';

const FILTROS_VALIDOS = ['true', 'false', 'todos'];

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Credenciales de acceso (solo al crear)
const validarCredenciales = (body = {}) => {
    const correo = body.correo?.toString().trim().toLowerCase();
    if (!correo) return { error: 'El correo es obligatorio' };
    if (correo.length > 150) return { error: 'El correo no puede exceder 150 caracteres' };
    if (!REGEX_CORREO.test(correo)) return { error: 'El correo no es válido' };

    const errorContrasena = validarContrasena(body.contrasena);
    if (errorContrasena) return { error: errorContrasena };

    return { correo, contrasena: body.contrasena };
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// Texto opcional: devuelve null si viene vacío
const textoOpcional = (valor) => valor?.toString().trim() || null;

// Valida y normaliza el body (POST y PUT)
const validarBody = (body = {}) => {
    const nombre = body.nombre?.toString().trim();
    const ape_pat = body.ape_pat?.toString().trim();
    const ape_mat = textoOpcional(body.ape_mat);
    const telefono = textoOpcional(body.telefono);
    const cedula = textoOpcional(body.cedula);
    const idusuario = body.idusuario ?? null;
    const idclinica = body.idclinica ?? null;

    if (!nombre) return { error: 'El nombre es obligatorio' };
    if (nombre.length > 100) return { error: 'El nombre no puede exceder 100 caracteres' };
    if (!ape_pat) return { error: 'El apellido paterno es obligatorio' };
    if (ape_pat.length > 100) return { error: 'El apellido paterno no puede exceder 100 caracteres' };
    if (ape_mat && ape_mat.length > 100) return { error: 'El apellido materno no puede exceder 100 caracteres' };
    if (telefono && telefono.length > 20) return { error: 'El teléfono no puede exceder 20 caracteres' };
    if (cedula && cedula.length > 50) return { error: 'La cédula no puede exceder 50 caracteres' };
    if (idusuario !== null && !idValido(idusuario)) {
        return { error: 'idusuario debe ser un entero positivo' };
    }
    if (idclinica !== null && !idValido(idclinica)) {
        return { error: 'idclinica debe ser un entero positivo' };
    }

    return {
        datos: {
            nombre,
            ape_pat,
            ape_mat,
            telefono,
            cedula,
            idusuario: idusuario === null ? null : Number(idusuario),
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
        const odontologos = await odontologoService.obtenerOdontologos({
            filtroActivo,
            idClinica: idclinica !== undefined ? Number(idclinica) : null,
        });
        res.json(odontologos);
    } catch (err) {
        responderError(res, err);
    }
};

export const obtenerPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const odontologo = await odontologoService.obtenerOdontologoPorId(Number(id));
        if (!odontologo) return res.status(404).json({ error: 'Odontólogo no encontrado' });
        res.json(odontologo);
    } catch (err) {
        responderError(res, err);
    }
};

export const crear = async (req, res) => {
    const { datos, error } = validarBody(req.body);
    if (error) return res.status(400).json({ error });

    if (!req.body.correo || !req.body.contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    if(datos.idclinica == null) {
        return res.status(400).json({ error: 'No se proporciono id de clínica' });
    }

    const credenciales = validarCredenciales(req.body);
    if (credenciales.error) return res.status(400).json({ error: credenciales.error });

    try {
        const creado = await odontologoService.crearOdontologo({
            correo: credenciales.correo,
            contrasena: credenciales.contrasena,
            nombre: datos.nombre,
            ape_pat: datos.ape_pat,
            ape_mat: datos.ape_mat,
            telefono: datos.telefono,
            cedula: datos.cedula,
            id_clinica: datos.idclinica,
        });

        // La función SQL devuelve solo ids; traemos el registro completo
        const odontologo = await odontologoService.obtenerOdontologoPorId(creado.id_odontologo);
        res.status(201).json(odontologo ?? creado);
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
        const odontologo = await odontologoService.actualizarOdontologo(Number(id), datos);
        if (!odontologo) return res.status(404).json({ error: 'Odontólogo no encontrado o desactivado' });
        res.json(odontologo);
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await odontologoService.eliminarOdontologo(Number(id));
        if (!ok) return res.status(404).json({ error: 'Odontólogo no encontrado o ya desactivado' });
        res.status(200).json({ mensaje: 'Odontólogo eliminado correctamente' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const odontologo = await odontologoService.reactivarOdontologo(Number(id));
        if (!odontologo) return res.status(404).json({ error: 'Odontólogo no encontrado o ya activo' });
        res.json({ mensaje: 'Odontólogo reactivado correctamente', odontologo });
    } catch (err) {
        responderError(res, err);
    }
};