import conexion from '../services/conexion.js'; // la misma ruta que usas en los demás services

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. sobre nombre WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un servicio activo con ese nombre');
    if (err.code === '23503') throw errorHttp(400, 'La clínica indicada no existe');
    throw err;
};

// Ejecuta varias consultas como una sola operación: o se guardan todas o ninguna
const enTransaccion = async (trabajo) => {
    const cliente = await conexion.connect();
    try {
        await cliente.query('BEGIN');
        const resultado = await trabajo(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (err) {
        await cliente.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        cliente.release();
    }
};

// Columnas que se devuelven siempre, con la clínica a la que pertenece el servicio.
// El LATERAL toma una sola relación por servicio (la activa más reciente), así no se duplican filas.
const SELECT_BASE = `
    SELECT
        s.idServicio AS id_servicio,
        s.nombre,
        s.descripcion,
        s.activo,
        cs.idClinica AS id_clinica,
        c.nombre AS nombre_clinica
    FROM Servicios s
    LEFT JOIN LATERAL (
        SELECT x.idClinica
        FROM Clinica_Servicio x
        WHERE x.idServicio = s.idServicio
        ORDER BY x.activo DESC, x.idClinica_Servicio DESC
        LIMIT 1
    ) cs ON true
    LEFT JOIN Clinicas c ON c.idClinica = cs.idClinica
`;

const RETURNING_SERVICIO = 'RETURNING idServicio AS id_servicio, nombre, descripcion, activo';

// ---------- LISTAR ----------
// filtroActivo: 'true' | 'false' | 'todos' (default)
// idClinica: opcional, para ver solo los servicios de una clínica
export const obtenerServicios = async ({ filtroActivo = 'todos', idClinica = null } = {}) => {
    const query = `
        ${SELECT_BASE}
        WHERE ($1::text = 'todos' OR s.activo = ($1::text = 'true'))
          AND ($2::int IS NULL OR cs.idClinica = $2::int)
        ORDER BY s.nombre, s.idServicio;
    `;
    const { rows } = await conexion.query(query, [filtroActivo, idClinica]);
    return rows;
};

// ---------- OBTENER POR ID ----------
export const obtenerServicioPorId = async (id) => {
    const { rows } = await conexion.query(
        `${SELECT_BASE}
         WHERE s.idServicio = $1`,
        [id]
    );
    return rows[0] ?? null;
};

// ---------- CREAR ----------
// Crea el servicio y lo liga a la clínica en una sola transacción
export const crearServicio = async ({ nombre, descripcion, idclinica }) => {
    try {
        return await enTransaccion(async (cliente) => {
            const { rows } = await cliente.query(
                `INSERT INTO Servicios (nombre, descripcion)
                 VALUES ($1, $2)
                 ${RETURNING_SERVICIO}`,
                [nombre, descripcion]
            );
            const servicio = rows[0];

            await cliente.query(
                `INSERT INTO Clinica_Servicio (idServicio, idClinica)
                 VALUES ($1, $2)`,
                [servicio.id_servicio, idclinica]
            );

            return { ...servicio, id_clinica: idclinica };
        });
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza nombre y descripción; si descripcion es null, se borra.
// Si llega idclinica, cambia la clínica del servicio (o la crea si no tenía)
export const actualizarServicio = async (id, { nombre, descripcion, idclinica }) => {
    try {
        return await enTransaccion(async (cliente) => {
            const { rows } = await cliente.query(
                `UPDATE Servicios
                 SET nombre = $2, descripcion = $3
                 WHERE idServicio = $1 AND activo
                 ${RETURNING_SERVICIO}`,
                [id, nombre, descripcion]
            );
            const servicio = rows[0];
            if (!servicio) return null; // no existe o está desactivado

            if (idclinica != null) {
                const { rowCount } = await cliente.query(
                    `UPDATE Clinica_Servicio
                     SET idClinica = $2
                     WHERE idServicio = $1 AND activo`,
                    [id, idclinica]
                );
                if (rowCount === 0) {
                    await cliente.query(
                        `INSERT INTO Clinica_Servicio (idServicio, idClinica)
                         VALUES ($1, $2)`,
                        [id, idclinica]
                    );
                }
                return { ...servicio, id_clinica: idclinica };
            }

            return servicio;
        });
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ELIMINAR (lógico) ----------
// Desactiva el servicio y su relación con la clínica
export const eliminarServicio = async (id) =>
    enTransaccion(async (cliente) => {
        const { rowCount } = await cliente.query(
            'UPDATE Servicios SET activo = false WHERE idServicio = $1 AND activo',
            [id]
        );
        if (rowCount === 0) return false; // no existe o ya estaba desactivado

        await cliente.query(
            'UPDATE Clinica_Servicio SET activo = false WHERE idServicio = $1',
            [id]
        );
        return true;
    });

// ---------- REACTIVAR ----------
// Reactiva el servicio y su relación con la clínica
export const reactivarServicio = async (id) => {
    try {
        return await enTransaccion(async (cliente) => {
            const { rows } = await cliente.query(
                `UPDATE Servicios
                 SET activo = true
                 WHERE idServicio = $1 AND NOT activo
                 ${RETURNING_SERVICIO}`,
                [id]
            );
            if (!rows[0]) return null; // no existe o ya estaba activo

            await cliente.query(
                'UPDATE Clinica_Servicio SET activo = true WHERE idServicio = $1',
                [id]
            );
            return rows[0];
        });
    } catch (err) {
        manejarErrorPg(err);
    }
};