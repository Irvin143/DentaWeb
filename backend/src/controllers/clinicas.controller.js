import * as clinicaService from '../services/clinicasServices.js';

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
    const direccion = body.direccion?.toString().trim() || null;
    const identificacion_fiscal = body.identificacion_fiscal?.toString().trim() || null;
    const idusuario = body.idusuario ?? null;

    if (!nombre) return { error: 'El nombre es obligatorio' };
    if (nombre.length > 150) return { error: 'El nombre no puede exceder 150 caracteres' };
    if (identificacion_fiscal && identificacion_fiscal.length > 50) {
        return { error: 'La identificación fiscal no puede exceder 50 caracteres' };
    }
    if (idusuario !== null && !idValido(idusuario)) {
        return { error: 'idusuario debe ser un entero positivo' };
    }

    return {
        datos: {
            nombre,
            direccion,
            identificacion_fiscal,
            idusuario: idusuario === null ? null : Number(idusuario),
        },
    };
};

const leerFiltro = (req) => {
    const filtro = req.query.activo ?? 'todos';
    return FILTROS_VALIDOS.includes(filtro) ? filtro : null;
};

export const listar = async (req, res) => {
    const filtroActivo = leerFiltro(req);
    if (!filtroActivo) return res.status(400).json({ error: "activo debe ser 'true', 'false' o 'todos'" });
    try {
        res.json(await clinicaService.obtenerClinicas({ filtroActivo }));
    } catch (err) {
        responderError(res, err);
    }
};

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mayus = (v) => v?.toString().trim().toLocaleUpperCase('es-MX') || '';

export const crear = async (req, res) => {
    const body = req.body ?? {};

    // Cuenta de acceso
    const correo = body.correo?.toString().trim().toLowerCase();
    if (!correo) return res.status(400).json({ error: 'El correo es obligatorio' });
    if (correo.length > 150) {
        return res.status(400).json({ error: 'El correo no puede exceder 150 caracteres' });
    }
    if (!REGEX_CORREO.test(correo)) {
        return res.status(400).json({ error: 'El correo no es válido' });
    }

    const contrasena = body.contrasena;
    if (typeof contrasena !== 'string' || contrasena.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (Buffer.byteLength(contrasena, 'utf8') > 72) {
        return res.status(400).json({ error: 'La contraseña no puede exceder 72 bytes' });
    }

    // Datos de la clínica
    const nombre = mayus(body.nombre);
    const direccion = mayus(body.direccion) || null;
    const identificacion_fiscal = mayus(body.identificacion_fiscal) || null;

    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (nombre.length > 150) {
        return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres' });
    }
    if (identificacion_fiscal && identificacion_fiscal.length > 50) {
        return res.status(400).json({ error: 'La identificación fiscal no puede exceder 50 caracteres' });
    }

    try {
        const clinica = await clinicaService.crearClinica({
            correo, contrasena, nombre, direccion, identificacion_fiscal,
        });
        res.status(201).json(clinica);
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
        const clinica = await clinicaService.actualizarClinica(Number(id), datos);
        if (!clinica) return res.status(404).json({ error: 'Clínica no encontrada o desactivada' });
        res.json(clinica);
    } catch (err) {
        responderError(res, err);
    }
};

export const eliminar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const ok = await clinicaService.eliminarClinica(Number(id));
        if (!ok) return res.status(404).json({ error: 'Clínica no encontrada o ya desactivada' });
        res.status(200).json({ mensaje: 'Clínica eliminada correctamente.' });
    } catch (err) {
        responderError(res, err);
    }
};

export const reactivar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'ID inválido' });
    try {
        const clinica = await clinicaService.reactivarClinica(Number(id));
        if (!clinica) return res.status(404).json({ error: 'Clínica no encontrada o ya activa' });
        res.json(clinica);
    } catch (err) {
        responderError(res, err);
    }
};