import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. sobre nombre WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un rol activo con ese nombre');
    throw err;
};

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerRoles = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        SELECT
            idRol AS id_rol,
            nombre,
            descripcion,
            activo
        FROM Roles
        WHERE ($1::text = 'todos' OR activo = ($1::text = 'true'))
        ORDER BY nombre, idRol;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerRolPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT idRol AS id_rol, nombre, descripcion, activo
         FROM Roles
         WHERE idRol = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
export const crearRol = async ({ nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
            `INSERT INTO Roles (nombre, descripcion)
             VALUES ($1, $2)
             RETURNING idRol AS id_rol, nombre, descripcion, activo`,
            [nombre, descripcion]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza nombre y descripción; si descripcion es null, se borra
export const actualizarRol = async (id, { nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE Roles
             SET nombre = $2, descripcion = $3
             WHERE idRol = $1 AND activo
             RETURNING idRol AS id_rol, nombre, descripcion, activo`,
            [id, nombre, descripcion]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarRol = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE Roles SET activo = false WHERE idRol = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarRol = async (id) => {
    try {
        const { rows } = await conexion.query(
            `UPDATE Roles
             SET activo = true
             WHERE idRol = $1 AND NOT activo
             RETURNING idRol AS id_rol, nombre, descripcion, activo`,
            [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activo
    } catch (err) {
        manejarErrorPg(err);
    }
};