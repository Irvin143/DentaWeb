import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// Traduce errores de Postgres a errores HTTP
const manejarErrorPg = (err) => {
    if (err.code === '23505') throw errorHttp(409, 'Ya existe una clínica con esos datos (nombre o identificación fiscal)');
    if (err.code === '23503') throw errorHttp(400, 'El usuario indicado no existe');
    throw err;
};

// Columnas que se devuelven siempre (incluye el correo del usuario)
const SELECT_BASE = `
    SELECT
        c.idClinica AS id_clinica,
        c.nombre,
        u.activo,
        c.direccion,
        c.identificacion_fiscal,
        c.idUsuario AS id_usuario,
        u.correo AS correo_usuario
    FROM Clinicas c
    LEFT JOIN Usuarios u ON u.idUsuario = c.idUsuario
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerClinicas = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        ${SELECT_BASE}
        WHERE ($1::text = 'todos' OR c.activo = ($1::text = 'true'))
        ORDER BY c.nombre, c.idClinica;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

export const crearClinica = async ({
    correo, contrasena, nombre, direccion = null, identificacion_fiscal = null,
}) => {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    try {
        const { rows } = await conexion.query(
            'SELECT * FROM fn_registrar_clinica($1, $2, $3, $4, $5)',
            [correo, hash, nombre, direccion, identificacion_fiscal]
        );
        return rows[0]; // { id_usuario, id_clinica, correo }
    } catch (err) {
        if (err.code === '23505') {
            const duplicadaFiscal = String(err.message).includes('identificación fiscal');
            const error = new Error(
                duplicadaFiscal
                    ? 'La identificación fiscal ya está registrada'
                    : 'El correo ya está registrado'
            );
            error.status = 409;
            throw error;
        }
        throw err;
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza todos los campos editables
export const actualizarClinica = async (id, { nombre, direccion, identificacion_fiscal, idusuario }) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE Clinicas
             SET nombre = $2, direccion = $3, identificacion_fiscal = $4, idUsuario = $5
             WHERE idClinica = $1 
             RETURNING idClinica AS id_clinica, nombre, activo, direccion,
                       identificacion_fiscal, idUsuario AS id_usuario`,
            [id, nombre, direccion, identificacion_fiscal, idusuario]
        );
        return rows[0] ?? null; // null = no existe o está desactivada
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarClinica = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE Clinicas SET activo = false WHERE idClinica = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivada
};

// ---------- REACTIVAR ----------
export const reactivarClinica = async (id) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE Clinicas
             SET activo = true
             WHERE idClinica = $1 AND NOT activo
             RETURNING idClinica AS id_clinica, nombre, activo, direccion,
                       identificacion_fiscal, idUsuario AS id_usuario`,
            [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activa
    } catch (err) {
        manejarErrorPg(err);
    }
};