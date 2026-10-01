import bcrypt from 'bcrypt';
import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const SALT_ROUNDS = 10;

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un usuario con ese correo');
    if (err.code === '23503') throw errorHttp(400, 'El paquete indicado no existe');
    throw err;
};

// Columnas que se devuelven siempre. NUNCA incluyas "contrasena" aquí.
// "u" es el alias del usuario, "p" el del paquete.
const COLUMNAS = `
    u.idUsuario AS id_usuario,
    u.correo,
    u.activo,
    u.idPaquete AS id_paquete,
    p.nombre AS nombre_paquete
`;

const FROM_JOIN = `
    FROM usuarios u
    LEFT JOIN paquetes_roles p ON p.idPaquete = u.idPaquete
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerUsuarios = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        SELECT ${COLUMNAS}
        ${FROM_JOIN}
        WHERE ($1::text = 'todos' OR u.activo = ($1::text = 'true'))
        ORDER BY u.correo, u.idUsuario;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerUsuarioPorId = async (id) => {
    const { rows } = await conexion.query(
        `SELECT ${COLUMNAS}
         ${FROM_JOIN}
         WHERE u.idUsuario = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
// Recibe la contraseña en texto plano y la guarda hasheada
export const crearUsuario = async ({ correo, contrasena, idpaquete }) => {
    try {
        const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
        const { rows } = await conexion.query(
            `WITH u AS (
                INSERT INTO usuarios (correo, contrasena, idPaquete)
                VALUES ($1, $2, $3)
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM u
            LEFT JOIN paquetes_roles p ON p.idPaquete = u.idPaquete`,
            [correo, hash, idpaquete]
        );
        return rows[0];
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Cambia correo y paquete. La contraseña se cambia con cambiarContrasena.
export const actualizarUsuario = async (id, { correo, idpaquete }) => {
    try {
        const { rows } = await conexion.query(
            `WITH u AS (
                UPDATE usuarios
                SET correo = $2, idPaquete = $3
                WHERE idUsuario = $1 AND activo
                RETURNING *
            )
            SELECT ${COLUMNAS}
            FROM u
            LEFT JOIN paquetes_roles p ON p.idPaquete = u.idPaquete`,
            [id, correo, idpaquete]
        );
        return rows[0] ?? null; // null = no existe o está desactivado
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- CAMBIAR CONTRASEÑA (solo usuarios activos) ----------
export const cambiarContrasena = async (id, contrasena) => {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const { rowCount } = await conexion.query(
        'UPDATE usuarios SET contrasena = $2 WHERE idUsuario = $1 AND activo',
        [id, hash]
    );
    return rowCount > 0; // false = no existe o está desactivado
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarUsuario = async (id) => {
    const { rowCount } = await conexion.query(
        'UPDATE usuarios SET activo = false WHERE idUsuario = $1 AND activo',
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivado
};

// ---------- REACTIVAR ----------
export const reactivarUsuario = async (id) => {
    const { rows } = await conexion.query(
        `WITH u AS (
            UPDATE usuarios
            SET activo = true
            WHERE idUsuario = $1 AND NOT activo
            RETURNING *
        )
        SELECT ${COLUMNAS}
        FROM u
        LEFT JOIN paquetes_roles p ON p.idPaquete = u.idPaquete`,
        [id]
    );
    return rows[0] ?? null; // null = no existe o ya estaba activo
};