import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. sobre nombre WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un paquete activo con ese nombre');
    throw err;
};

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerPaquetes = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        SELECT
            idPaquete AS id_paquete,
            nombre,
            descripcion,
            activo
        FROM paquetes_roles
        WHERE ($1::text = 'todos' OR activo = ($1::text = 'true'))
        ORDER BY nombre, idPaquete;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerPaquetePorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT idPaquete AS id_paquete, nombre, descripcion, activo
         FROM paquetes_roles
         WHERE idPaquete = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
export const crearPaquete = async ({ nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
            `INSERT INTO paquetes_roles (nombre, descripcion)
             VALUES ($1, $2)
             RETURNING idPaquete AS id_paquete, nombre, descripcion, activo`,
            [nombre, descripcion]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza nombre y descripción; si descripcion es null, se borra
export const actualizarPaquete = async (id, { nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE paquetes_roles
             SET nombre = $2, descripcion = $3
             WHERE idPaquete = $1 AND activo
             RETURNING idPaquete AS id_paquete, nombre, descripcion, activo`,
            [id, nombre, descripcion]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarPaquete = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE paquetes_roles SET activo = false WHERE idPaquete = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarPaquete = async (id) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE paquetes_roles
             SET activo = true
             WHERE idPaquete = $1 AND NOT activo
             RETURNING idPaquete AS id_paquete, nombre, descripcion, activo`,
            [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activo
    } catch (err) {
        manejarErrorPg(err);
    }
};