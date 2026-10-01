import * as odontologoService from '../services/odontologosServices.js';

const FILTROS_VALIDOS = ['true', 'false', 'todos'];

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
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
    try {
        const odontologo = await odontologoService.crearOdontologo(datos);
        res.status(201).json(odontologo);
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