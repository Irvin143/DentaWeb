import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un tipo de usuario con ese nombre');
    if (err.code === '23502') throw errorHttp(400, 'Faltan datos obligatorios');
    throw err;
};

// Columnas que se devuelven siempre
const COLUMNAS = `
    idTipoUsuario AS id_tipo_usuario,
    nombre,
    activo
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerTiposUsuario = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        SELECT ${COLUMNAS}
        FROM tipo_usuario
        WHERE ($1::text = 'todos' OR activo = ($1::text = 'true'))
        ORDER BY nombre, idTipoUsuario;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerTipoUsuarioPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT ${COLUMNAS}
         FROM tipo_usuario
         WHERE idTipoUsuario = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
export const crearTipoUsuario = async ({ nombre }) => {
    try {
        const { rows } = await conexion.query(
            `INSERT INTO tipo_usuario (nombre)
             VALUES ($1)
             RETURNING ${COLUMNAS}`,
            [nombre]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
export const actualizarTipoUsuario = async (id, { nombre }) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE tipo_usuario
             SET nombre = $2
             WHERE idTipoUsuario = $1 AND activo
             RETURNING ${COLUMNAS}`,
            [id, nombre]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarTipoUsuario = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE tipo_usuario SET activo = false WHERE idTipoUsuario = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarTipoUsuario = async (id) => {
    const { rows } = await conexion.query(
        `UPDATE tipo_usuario
         SET activo = true
         WHERE idTipoUsuario = $1 AND NOT activo
         RETURNING ${COLUMNAS}`,
        [id]
    );
    return rows[0] ?? null; // null = no existe o ya estaba activo
};