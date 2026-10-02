import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un odontólogo con esa cédula');
    if (err.code === '23503') {
        // Distingue qué llave foránea falló según el nombre de la constraint
        const detalle = `${err.constraint ?? ''} ${err.detail ?? ''}`.toLowerCase();
        if (detalle.includes('usuario')) throw errorHttp(400, 'El usuario indicado no existe');
        if (detalle.includes('clinica')) throw errorHttp(400, 'La clínica indicada no existe');
        throw errorHttp(400, 'El usuario o la clínica indicados no existen');
    }
    throw err;
};

// Columnas que se devuelven siempre (incluye correo del usuario y nombre de la clínica).
// "o" es el alias del odontólogo, "u" el del usuario, "cl" el de la clínica.
const COLUMNAS = `
    o.idOdontologo AS id_odontologo,
    o.nombre,
    o.ape_pat,
    o.ape_mat,
    CONCAT_WS(' ', o.nombre, o.ape_pat, o.ape_mat) AS nombre_completo,
    o.telefono,
    o.cedula,
    u.activo,
    o.idUsuario AS id_usuario,
    u.correo AS correo_usuario,
    o.idClinica AS id_clinica,
    cl.nombre AS nombre_clinica
`;

const JOINS = `
    LEFT JOIN usuarios u ON u.idUsuario = o.idUsuario
    LEFT JOIN clinicas cl ON cl.idClinica = o.idClinica
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
// idClinica (opcional): filtra los odontólogos de una clínica
export const obtenerOdontologos = async ({ filtroActivo = 'todos', idClinica = null } = {}) => {
    const query = `
        SELECT ${COLUMNAS}
        FROM odontologos o
        ${JOINS}
        WHERE ($1::text = 'todos' OR o.activo = ($1::text = 'true'))
          AND ($2::int IS NULL OR o.idClinica = $2::int)
        ORDER BY o.ape_pat, o.ape_mat, o.nombre, o.idOdontologo;
    `;
    const { rows } = await conexion.query(query, [filtroActivo, idClinica]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerOdontologoPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT ${COLUMNAS}
         FROM odontologos o
         ${JOINS}
         WHERE o.idOdontologo = $1`,
        [id]
    );
    return rows[0] ?? null;
};

export async function crearOdontologo({
    correo, contrasena, nombre, ape_pat, ape_mat, telefono,
    cedula = null, id_clinica = null,
}) {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    try {
        const { rows } = await conexion.query(
            'SELECT * FROM fn_registrar_odontologo($1, $2, $3, $4, $5, $6, $7, $8)',
            [correo, hash, nombre, ape_pat, ape_mat, telefono, cedula, id_clinica]
        );
        return rows[0];
    } catch (err) {
        if (err.code === '23505') {
            const duplicadaCedula = String(err.message).includes('cédula');
            const error = new Error(
                duplicadaCedula ? 'La cédula ya está registrada' : 'El correo ya está registrado'
            );
            error.status = 409;
            throw error;
        }
        if (err.code === '23503') { // la clínica no existe
            const error = new Error('La clínica indicada no existe');
            error.status = 400;
            throw error;
        }
        throw err;
    }
}

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza todos los campos editables; los opcionales que vengan null se borran
export const actualizarOdontologo = async (
    id,
    { nombre, ape_pat, ape_mat, telefono, cedula, idusuario, idclinica }
) => {
    try {
        const { rows } = await conexion.query(
            `WITH o AS (
                UPDATE odontologos
                SET nombre = $2, ape_pat = $3, ape_mat = $4, telefono = $5,
                    cedula = $6, idUsuario = $7, idClinica = $8
                WHERE idOdontologo = $1
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM o
            ${JOINS}`,
            [id, nombre, ape_pat, ape_mat, telefono, cedula, idusuario, idclinica]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarOdontologo = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE odontologos SET activo = false WHERE idOdontologo = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};
export const reactivarOdontologo = async (id) => {
    // 1. Reactiva la cuenta de usuario ligada al odontólogo
    const { rowCount } = await conexion.query(
        `UPDATE usuarios
         SET activo = true
         WHERE idUsuario = (SELECT idUsuario FROM odontologos WHERE idOdontologo = $1)
           AND NOT activo`,
        [id]
    );
    if (rowCount === 0) return null; // no existe o ya estaba activo

    // 2. Devuelve el odontólogo ya con el estado actualizado
    const { rows } = await conexion.query(
        `WITH o AS (
            SELECT * FROM odontologos WHERE idOdontologo = $1
        )
        SELECT ${COLUMNAS}
        FROM o
        ${JOINS}`,
        [id]
    );
    return rows[0] ?? null;
};