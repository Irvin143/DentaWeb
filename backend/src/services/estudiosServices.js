import conexion from '../services/conexion.js';// la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

// ---------- LISTAR (paginado) ----------
// filtroActivo: 'true' (default) | 'false' | 'todos'
export const obtenerEstudios = async ({ limite, offset, filtroActivo = 'todos' }) => {  
    
    const filtro = `($1::text = 'todos' OR activo = ($1::text = 'true'))`;

    const [datos, conteo] = await Promise.all([
        conexion.query(
        `SELECT idEstudio AS id_estudio, nombre, descripcion, activo
        FROM Estudios
        WHERE ${filtro}
        ORDER BY nombre, idEstudio
        LIMIT $2 OFFSET $3`,
        [filtroActivo, limite, offset]
        ),
        conexion.query(
        `SELECT COUNT(*)::int AS total FROM Estudios WHERE ${filtro}`,
        [filtroActivo]
        ),
    ]);

    return { filas: datos.rows, total: conteo.rows[0].total };
};

// ---------- CREAR ----------
export const crearEstudio = async ({ nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
        `INSERT INTO Estudios (nombre, descripcion)
        VALUES ($1, $2)
        RETURNING idEstudio AS id_estudio, nombre, descripcion, activo`,
        [nombre, descripcion]
        );
        return rows[0];
    } catch (err) {
        if (err.code === '23505') throw errorHttp(409, 'Ya existe un estudio activo con ese nombre');
        throw err;
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza nombre y descripción; si descripcion es null, se borra
export const actualizarEstudio = async (id, { nombre, descripcion }) => {
    try {
        const { rows } = await conexion.query(
        `UPDATE Estudios
        SET nombre = $2, descripcion = $3
        WHERE idEstudio = $1 AND activo
        RETURNING idEstudio AS id_estudio, nombre, descripcion, activo`,
        [id, nombre, descripcion]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        if (err.code === '23505') throw errorHttp(409, 'Ya existe un estudio activo con ese nombre');
        throw err;
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarEstudio = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE Estudios SET activo = false WHERE idEstudio = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarEstudio = async (id) => {
    try {
        const { rows } = await conexion.query(
        `UPDATE Estudios
        SET activo = true
        WHERE idEstudio = $1 AND NOT activo
        RETURNING idEstudio AS id_estudio, nombre, descripcion, activo`,
        [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activo
    } catch (err) {
        // Otro estudio activo ya usa ese nombre
        if (err.code === '23505') throw errorHttp(409, 'Ya existe un estudio activo con ese nombre');
        throw err;
    }
};