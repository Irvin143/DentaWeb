import * as clinicaService from '../services/catalogos/clinicasServices.js';
import { errorContrasena } from './login.controller.js';

const FILTROS_VALIDOS = ['true', 'false', 'todos'];

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const mayus = (v) => v?.toString().trim().toLocaleUpperCase('es-MX') || '';

/* ============================================================
   DIRECCIÓN (objeto con los datos separados)
   ============================================================ */

const PAIS_POR_DEFECTO = 'MÉXICO';

// Textos de dirección: letras, números, espacios y signos comunes
const REGEX_TEXTO_DIRECCION = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s'.,#°&/-]*$/;
// Números exterior / interior: 12, 12-A, S/N, 4B
const REGEX_NUMERO = /^[A-Z0-9][A-Z0-9/-]*$/;
// Código postal (México): 5 dígitos
const REGEX_CP = /^\d{5}$/;

const CAMPOS_DIRECCION = [
    { campo: 'calle', etiqueta: 'calle', max: 150, tipo: 'texto' },
    { campo: 'numero_exterior', etiqueta: 'número exterior', max: 20, tipo: 'numero' },
    { campo: 'numero_interior', etiqueta: 'número interior', max: 20, tipo: 'numero' },
    { campo: 'colonia', etiqueta: 'colonia', max: 100, tipo: 'texto' },
    { campo: 'codigo_postal', etiqueta: 'código postal', max: 5, tipo: 'cp' },
    { campo: 'ciudad', etiqueta: 'ciudad', max: 100, tipo: 'texto' },
    { campo: 'estado', etiqueta: 'estado', max: 100, tipo: 'texto' },
    { campo: 'pais', etiqueta: 'país', max: 100, tipo: 'texto' },
    { campo: 'referencias', etiqueta: 'referencias', max: 300, tipo: 'texto' },
];

// Valida y normaliza la dirección.
// Devuelve { direccion } (objeto, o null si no hay dirección) o { error }.
// Si hay cualquier dato de dirección, la calle es obligatoria.
const validarDireccion = (valor) => {
    if (valor === undefined || valor === null || valor === '') return { direccion: null };
    if (typeof valor !== 'object' || Array.isArray(valor)) {
        return { error: 'La dirección debe ser un objeto con calle, colonia, código postal, etc.' };
    }

    const direccion = {};
    for (const { campo, etiqueta, max, tipo } of CAMPOS_DIRECCION) {
        const texto = mayus(valor[campo]);
        if (!texto) {
            direccion[campo] = null;
            continue;
        }
        if (texto.length > max) {
            return { error: `El campo ${etiqueta} no puede exceder ${max} caracteres` };
        }
        if (tipo === 'cp' && !REGEX_CP.test(texto)) {
            return { error: 'El código postal debe tener 5 dígitos' };
        }
        if (tipo === 'numero' && !REGEX_NUMERO.test(texto)) {
            return { error: `El campo ${etiqueta} solo admite letras, números, guiones y diagonales` };
        }
        if (tipo === 'texto' && !REGEX_TEXTO_DIRECCION.test(texto)) {
            return { error: `El campo ${etiqueta} contiene caracteres no permitidos` };
        }
        direccion[campo] = texto;
    }

    // El país por defecto no cuenta como "capturó una dirección"
    const hayDatos = CAMPOS_DIRECCION.some(({ campo }) => campo !== 'pais' && direccion[campo]);
    if (!hayDatos) return { direccion: null };
    if (!direccion.calle) {
        return { error: 'La calle es obligatoria si capturas una dirección' };
    }

    direccion.pais = direccion.pais ?? PAIS_POR_DEFECTO;
    return { direccion };
};

/* ============================================================
   VALIDACIÓN DEL BODY (PUT)
   ============================================================ */

// Valida y normaliza el body del PUT
const validarBody = (body = {}) => {
    const nombre = body.nombre?.toString().trim();
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

    const { direccion, error: errorDireccion } = validarDireccion(body.direccion);
    if (errorDireccion) return { error: errorDireccion };

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

// clinicas.controller.js
export async function listarPorServicio(req, res, next) {
    try {
        const id = Number(req.params.idServicio);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Servicio inválido' });
        }
        const sedes = await clinicaService.obtenerSedesPorServicio(id);
        res.json(sedes);
    } catch (err) {
        next(err);
    }
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const falloClave = errorContrasena(contrasena);
    if (falloClave) return res.status(400).json({ error: falloClave });

    // Datos de la clínica
    const nombre = mayus(body.nombre);
    const identificacion_fiscal = mayus(body.identificacion_fiscal) || null;

    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (nombre.length > 150) {
        return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres' });
    }
    if (identificacion_fiscal && identificacion_fiscal.length > 50) {
        return res.status(400).json({ error: 'La identificación fiscal no puede exceder 50 caracteres' });
    }

    const { direccion, error: errorDireccion } = validarDireccion(body.direccion);
    if (errorDireccion) return res.status(400).json({ error: errorDireccion });

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