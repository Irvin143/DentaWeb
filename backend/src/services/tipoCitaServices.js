import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. sobre nombre WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un tipo de cita activo con ese nombre');
    throw err;
};

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerTiposCita = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        SELECT
            idTipo AS id_tipo,
            nombre,
            activo
        FROM tipo_cita
        WHERE ($1::text = 'todos' OR activo = ($1::text = 'true'))
        ORDER BY nombre, idTipo;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerTipoCitaPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT idTipo AS id_tipo, nombre, activo
         FROM tipo_cita
         WHERE idTipo = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
export const crearTipoCita = async ({ nombre }) => {
    try {
        const { rows } = await conexion.query(
            `INSERT INTO tipo_cita (nombre)
             VALUES ($1)
             RETURNING idTipo AS id_tipo, nombre, activo`,
            [nombre]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
export const actualizarTipoCita = async (id, { nombre }) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE tipo_cita
             SET nombre = $2
             WHERE idTipo = $1
             RETURNING idTipo AS id_tipo, nombre, activo`,
            [id, nombre]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarTipoCita = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE tipo_cita SET activo = false WHERE idTipo = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarTipoCita = async (id) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE tipo_cita
             SET activo = true
             WHERE idTipo = $1 AND NOT activo
             RETURNING idTipo AS id_tipo, nombre, activo`,
            [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activo
    } catch (err) {
        manejarErrorPg(err);
    }
};