import conexion from '../conexion.js'; // la misma ruta que usas en los demás services
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
    if (err.code === '23502') throw errorHttp(400, 'La calle de la dirección es obligatoria');
    throw err;
};  

// Campos atómicos de la tabla direcciones
const CAMPOS_DIRECCION = [
    'calle', 'numero_exterior', 'numero_interior', 'colonia',
    'codigo_postal', 'ciudad', 'estado', 'pais', 'referencias',
];

// Dirección en una sola línea (compatibilidad con el frontend actual)
const DIRECCION_COMPLETA = `
    concat_ws(', ',
        NULLIF(concat_ws(' ', d.calle, d.numero_exterior,
               CASE WHEN d.numero_interior IS NOT NULL THEN 'Int. ' || d.numero_interior END), ''),
        d.colonia,
        NULLIF(concat_ws(' ', 'CP', d.codigo_postal), 'CP'),
        d.ciudad,
        d.estado
    )
`;

// Columnas que se devuelven siempre (incluye el correo del usuario)
const SELECT_BASE = `
    SELECT
        c.idClinica AS id_clinica,
        c.nombre,
        u.activo,
        c.idDireccion AS id_direccion,
        d.calle,
        d.numero_exterior,
        d.numero_interior,
        d.colonia,
        d.codigo_postal,
        d.ciudad,
        d.estado,
        d.pais,
        d.referencias,
        ${DIRECCION_COMPLETA} AS direccion,
        c.identificacion_fiscal,
        c.idUsuario AS id_usuario,
        u.correo AS correo_usuario
    FROM Clinicas c
    LEFT JOIN Usuarios u ON u.idUsuario = c.idUsuario
    LEFT JOIN Direcciones d ON d.idDireccion = c.idDireccion
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
export const obtenerClinicas = async ({ filtroActivo = 'todos' } = {}) => {
    const query = `
        ${SELECT_BASE}
        WHERE ($1::text = 'todos' OR u.activo = ($1::text = 'true'))
        ORDER BY c.nombre, c.idClinica;
    `;
    const { rows } = await conexion.query(query, [filtroActivo]);
    return rows;
};

// Sedes (clínicas) activas que ofrecen un servicio activo
export const obtenerSedesPorServicio = async (idServicio) => {
    const { rows } = await conexion.query(
        `
        SELECT
            c.idClinica AS id_sede,
            c.nombre,
            ${DIRECCION_COMPLETA} AS direccion
        FROM Clinicas c
        LEFT JOIN Direcciones d ON d.idDireccion = c.idDireccion
        JOIN Clinica_Servicio cs ON cs.idClinica = c.idClinica AND cs.activo
        JOIN Servicios s ON s.idServicio = cs.idServicio AND s.activo
        WHERE cs.idServicio = $1::int
        ORDER BY c.nombre;
        `,
        [idServicio]
    );
    return rows;
};

// ---------- CREAR ----------
// direccion: objeto { calle, numero_exterior, numero_interior, colonia,
//                     codigo_postal, ciudad, estado, pais, referencias }
export const crearClinica = async ({
    correo, contrasena, nombre, direccion = null, identificacion_fiscal = null,
}) => {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    try {
        const { rows } = await conexion.query(
            'SELECT * FROM fn_registrar_clinica($1, $2, $3, $4::jsonb, $5)',
            [correo, hash, nombre, direccion ? JSON.stringify(direccion) : null, identificacion_fiscal]
        );
        return rows[0]; // { id_usuario, id_clinica, correo }
    } catch (err) {
        if (err.code === '23505') {
            const duplicadaFiscal = String(err.message).includes('identificación fiscal');
            throw errorHttp(
                409,
                duplicadaFiscal
                    ? 'La identificación fiscal ya está registrada'
                    : 'El correo ya está registrado'
            );
        }
        throw err;
    }
};

// ---------- ACTUALIZAR ----------
// Reemplaza todos los campos editables. Si la clínica ya tiene dirección la
// actualiza; si no, la crea. Requiere que `conexion` sea un Pool de pg.
export const actualizarClinica = async (id, { nombre, direccion, identificacion_fiscal, idusuario }) => {
    const client = await conexion.connect();

    try {
        await client.query('BEGIN');

        const { rows: actual } = await client.query(
            'SELECT idDireccion FROM Clinicas WHERE idClinica = $1 FOR UPDATE',
            [id]
        );
        if (actual.length === 0) {
            await client.query('ROLLBACK');
            return null; // no existe
        }

        let idDireccion = actual[0].iddireccion;

        if (direccion && typeof direccion === 'object') {
            const valores = CAMPOS_DIRECCION.map((k) => direccion[k] ?? null);

            if (idDireccion) {
                await client.query(
                    `UPDATE Direcciones
                     SET ${CAMPOS_DIRECCION.map((k, i) => `${k} = $${i + 2}`).join(', ')}
                     WHERE idDireccion = $1`,
                    [idDireccion, ...valores]
                );
            } else {
                const { rows: dir } = await client.query(
                    `INSERT INTO Direcciones (${CAMPOS_DIRECCION.join(', ')})
                     VALUES (${CAMPOS_DIRECCION.map((_, i) => `$${i + 1}`).join(', ')})
                     RETURNING idDireccion`,
                    valores
                );
                idDireccion = dir[0].iddireccion;
            }
        }

        await client.query(
            `UPDATE Clinicas
             SET nombre = $2, idDireccion = $3, identificacion_fiscal = $4, idUsuario = $5
             WHERE idClinica = $1`,
            [id, nombre, idDireccion, identificacion_fiscal, idusuario]
        );

        await client.query('COMMIT');

        const { rows } = await conexion.query(`${SELECT_BASE} WHERE c.idClinica = $1`, [id]);
        return rows[0] ?? null;
    } catch (err) {
        await client.query('ROLLBACK');
        manejarErrorPg(err);
    } finally {
        client.release();
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarClinica = async (id) => {
    const { rowCount } = await conexion.query(
        `UPDATE Usuarios
         SET activo = false
         WHERE idUsuario = (SELECT idUsuario FROM Clinicas WHERE idClinica = $1)
           AND activo`,
        [id]
    );
    return rowCount > 0; // false = no existe o ya estaba desactivada
};

// ---------- REACTIVAR ----------
export const reactivarClinica = async (id) => {
    try {
        const { rowCount } = await conexion.query(
            `UPDATE Usuarios
             SET activo = true
             WHERE idUsuario = (SELECT idUsuario FROM Clinicas WHERE idClinica = $1)
               AND NOT activo`,
            [id]
        );
        if (rowCount === 0) return null; // no existe o ya estaba activa

        const { rows } = await conexion.query(
            `${SELECT_BASE} WHERE c.idClinica = $1`,
            [id]
        );
        return rows[0] ?? null;
    } catch (err) {
        manejarErrorPg(err);
    }
};