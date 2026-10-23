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
        if (detalle.includes('clinica')) throw errorHttp(400, 'Alguna de las clínicas indicadas no existe');
        throw errorHttp(400, 'El usuario o las clínicas indicados no existen');
    }
    throw err;
};

// Normaliza la lista de clínicas recibida: enteros únicos, sin nulos.
// undefined → undefined (no tocar), null → [] (ninguna)
const normalizarIdsClinicas = (ids) => {
    if (ids === undefined) return undefined;
    if (ids === null) return [];
    if (!Array.isArray(ids)) throw errorHttp(400, 'Mal formato: ids_clinicas debe ser un arreglo de enteros positivos');

    const limpios = [...new Set(ids.map(Number))];
    if (limpios.some((n) => !Number.isInteger(n) || n <= 0)) {
        throw errorHttp(400, 'ids_clinicas contiene valores no válidos');
    }
    return limpios;
};

// Columnas que se devuelven siempre (incluye correo del usuario y sus clínicas).
// "o" es el alias del odontólogo, "u" el del usuario y "cx" el de sus clínicas.
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
    COALESCE(cx.clinicas, '[]'::json) AS clinicas,
    COALESCE(cx.ids_clinicas, ARRAY[]::int[]) AS ids_clinicas,
    cx.nombres_clinicas AS nombre_clinica
`;

const JOINS = `
    LEFT JOIN usuarios u ON u.idUsuario = o.idUsuario
    LEFT JOIN LATERAL (
        SELECT
            json_agg(
                json_build_object('id_clinica', cl.idClinica, 'nombre', cl.nombre)
                ORDER BY cl.nombre
            ) AS clinicas,
            array_agg(cl.idClinica ORDER BY cl.nombre) AS ids_clinicas,
            string_agg(cl.nombre, ', ' ORDER BY cl.nombre) AS nombres_clinicas
        FROM odontologo_clinica oc
        JOIN clinicas cl ON cl.idClinica = oc.idClinica
        WHERE oc.idOdontologo = o.idOdontologo AND oc.activo
    ) cx ON true
`;

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
// idUsuario / paquete: si es 'Clinica', obtiene su idClinica primero
export const obtenerOdontologos = async ({
    filtroActivo = 'todos',
    idUsuario = null,
    paquete = null,
} = {}) => {
    const esClinica = paquete === 'Clinica';
    let idClinicaFiltro = null;

    // Si es tipo 'Clinica', obtenemos primero su idClinica mediante el idUsuario
    if (esClinica && idUsuario) {
        const resClinica = await conexion.query(
            `SELECT idClinica
             FROM clinicas
             WHERE idUsuario = $1::int
             LIMIT 1;`,
            [idUsuario]
        );

        if (resClinica.rows.length > 0) {
            idClinicaFiltro = resClinica.rows[0].idclinica;
        } else {
            // Si la cuenta no tiene clínica registrada, retorna arreglo vacío
            return [];
        }
    }

    // Una clínica ve a los odontólogos que trabajan en ella (aunque también trabajen en otras)
    const query = `
        SELECT ${COLUMNAS}
        FROM odontologos o
        ${JOINS}
        WHERE ($1::text = 'todos' OR u.activo = ($1::text = 'true'))
          AND (
                $2::int IS NULL
                OR EXISTS (
                    SELECT 1
                    FROM odontologo_clinica oc
                    WHERE oc.idOdontologo = o.idOdontologo
                      AND oc.idClinica = $2::int
                      AND oc.activo
                )
          )
        ORDER BY o.ape_pat, o.ape_mat, o.nombre, o.idOdontologo;
    `;

    const { rows } = await conexion.query(query, [filtroActivo, idClinicaFiltro]);
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

// ---------- CREAR ----------
// ids_clinicas: arreglo con los ids de las clínicas donde trabajará (opcional)
export async function crearOdontologo({
    correo, contrasena, nombre, ape_pat, ape_mat, telefono,
    cedula = null, ids_clinicas = null,
}) {
    const clinicas = normalizarIdsClinicas(ids_clinicas);
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    try {
        const { rows } = await conexion.query(
            'SELECT * FROM fn_registrar_odontologo($1, $2, $3, $4, $5, $6, $7, $8::int[])',
            [correo, hash, nombre, ape_pat, ape_mat, telefono, cedula, clinicas?.length ? clinicas : null]
        );
        return rows[0]; // { id_usuario, id_odontologo, correo }
    } catch (err) {
        if (err.code === '23505') {
            const duplicadaCedula = String(err.message).includes('cédula');
            throw errorHttp(
                409,
                duplicadaCedula ? 'La cédula ya está registrada' : 'El correo ya está registrado'
            );
        }
        if (err.code === '23503') { // alguna clínica no existe
            throw errorHttp(400, 'Alguna de las clínicas indicadas no existe');
        }
        throw err;
    }
}

// ---------- ACTUALIZAR ----------
// Reemplaza todos los campos editables; los opcionales que vengan null se borran.
// ids_clinicas: si viene, sincroniza las clínicas del odontólogo (las que ya no
// aparecen se desactivan junto con sus horarios); si no viene, no se tocan.
// Requiere que `conexion` sea un Pool de pg.
export const actualizarOdontologo = async (
    id,
    { nombre, ape_pat, ape_mat, telefono, cedula, idusuario, ids_clinicas }
) => {
    const clinicas = normalizarIdsClinicas(ids_clinicas);
    const client = await conexion.connect();

    try {
        await client.query('BEGIN');

        const { rowCount } = await client.query(
            `UPDATE odontologos
             SET nombre = $2, ape_pat = $3, ape_mat = $4, telefono = $5,
                 cedula = $6, idUsuario = $7
             WHERE idOdontologo = $1`,
            [id, nombre, ape_pat, ape_mat, telefono, cedula, idusuario]
        );
        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return null; // no existe
        }

        if (clinicas !== undefined) {
            // Altas y reactivaciones
            await client.query(
                `INSERT INTO odontologo_clinica (idOdontologo, idClinica)
                 SELECT $1::int, unnest($2::int[])
                 ON CONFLICT (idOdontologo, idClinica) DO UPDATE SET activo = true`,
                [id, clinicas]
            );

            // Bajas (lógicas, para conservar el historial)
            await client.query(
                `UPDATE odontologo_clinica
                 SET activo = false
                 WHERE idOdontologo = $1::int
                   AND activo
                   AND NOT (idClinica = ANY($2::int[]))`,
                [id, clinicas]
            );

            // Los horarios de las clínicas que ya no atiende dejan de estar activos
            await client.query(
                `UPDATE horarios_odontologo
                 SET activo = false
                 WHERE idOdontologo = $1::int
                   AND activo
                   AND NOT (idClinica = ANY($2::int[]))`,
                [id, clinicas]
            );
        }

        await client.query('COMMIT');

        return await obtenerOdontologoPorId(id);
    } catch (err) {
        await client.query('ROLLBACK');
        manejarErrorPg(err);
    } finally {
        client.release();
    }
};

// ---------- ELIMINAR (lógico) ----------
export const eliminarOdontologo = async (idOdontologo) => {
    const { rowCount } = await conexion.query(
        `UPDATE usuarios u
         SET activo = false
         FROM odontologos o
         WHERE o.idOdontologo = $1
           AND o.idUsuario = u.idUsuario
           AND u.activo = true`,
        [idOdontologo]
    );

    return rowCount > 0;
};

// ---------- REACTIVAR ----------
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
    return await obtenerOdontologoPorId(id);
};