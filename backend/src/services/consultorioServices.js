import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. nombre + clínica WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un consultorio activo con ese nombre en esa clínica');
    if (err.code === '23503') throw errorHttp(400, 'La clínica indicada no existe');
    throw err;
};

// Columnas que se devuelven siempre (incluye el nombre de la clínica).
// "c" es el alias del consultorio, "cl" el de la clínica.
const COLUMNAS = `
    c.idConsultorio AS id_consultorio,
    c.nombre,
    c.idClinica AS id_clinica,
    cl.nombre AS nombre_clinica,
    c.activo
`;

const FROM_JOIN = `
    FROM Consultorio c
    LEFT JOIN Clinicas cl ON cl.idClinica = c.idClinica
`;

export const obtenerConsultorios = async ({ 
    filtroActivo = 'todos', 
    idUsuario = null, 
    paquete = null
} = {}) => {
    const esClinica = paquete === 'Clinica';
    let idClinicaFiltro = null;

    // Si es tipo 'Clinica', buscamos primero su idClinica mediante el idUsuario
    if (esClinica && idUsuario) {
        const queryClinica = `
            SELECT idClinica 
            FROM Clinicas 
            WHERE idUsuario = $1::int 
            LIMIT 1;
        `;
        const resClinica = await conexion.query(queryClinica, [idUsuario]);
        
        // Si el usuario con paquete 'Clinica' tiene un registro asociado en Clinicas
        if (resClinica.rows.length > 0) {
            idClinicaFiltro = resClinica.rows[0].idclinica || resClinica.rows[0].idClinica;
        } else {
            // Si no tiene clínica registrada, retornamos un arreglo vacío de inmediato
            return [];
        }
    }

    const query = `
        SELECT ${COLUMNAS}
        ${FROM_JOIN}
        WHERE ($1::text = 'todos' OR c.activo = ($1::text = 'true'))
            AND ($2::int IS NULL OR c.idClinica = $2::int)
        ORDER BY cl.nombre, c.nombre, c.idConsultorio;
    `;

    const { rows } = await conexion.query(query, [filtroActivo, idClinicaFiltro]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerConsultorioPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT ${COLUMNAS}
         ${FROM_JOIN}
         WHERE c.idConsultorio = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
export const crearConsultorio = async ({ nombre, idclinica }) => {
    try {
        const { rows } = await conexion.query(
            `WITH c AS (
                INSERT INTO Consultorio (nombre, idClinica)
                VALUES ($1, $2)
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM c
            LEFT JOIN Clinicas cl ON cl.idClinica = c.idClinica`,
            [nombre, idclinica]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
export const actualizarConsultorio = async (id, { nombre, idclinica }) => {
    try {
        const { rows } = await conexion.query(
            `WITH c AS (
                UPDATE Consultorio
                SET nombre = $2, idClinica = $3
                WHERE idConsultorio = $1 
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM c
            LEFT JOIN Clinicas cl ON cl.idClinica = c.idClinica`,
            [id, nombre, idclinica]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarConsultorio = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE Consultorio SET activo = false WHERE idConsultorio = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarConsultorio = async (id) => {
    try {
        const { rows } = await conexion.query(
            `WITH c AS (
                UPDATE Consultorio
                SET activo = true
                WHERE idConsultorio = $1 AND NOT activo
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM c
            LEFT JOIN Clinicas cl ON cl.idClinica = c.idClinica`,
            [id]
        );
        return rows[0] ?? null; // null = no existe o ya estaba activo
    } catch (err) {
        manejarErrorPg(err);
    }
};