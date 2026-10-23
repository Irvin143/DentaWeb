import conexion from '../conexion.js'; // la misma ruta que usas en los demás services

const CATEGORIAS_VALIDAS = ['consulta', 'estudio'];

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const manejarErrorPg = (err) => {
    // Solo se dispara si tienes un índice único (ej. sobre nombre WHERE activo)
    if (err.code === '23505') throw errorHttp(409, 'Ya existe un servicio activo con ese nombre');
    if (err.code === '23503') throw errorHttp(400, 'La clínica indicada no existe');
    if (err.code === '23514') throw errorHttp(400, "La categoría debe ser 'consulta' o 'estudio'");
    throw err;
};

// Normaliza y valida la categoría.
// undefined / null / '' → valorPorDefecto; cualquier otro valor debe ser válido.
const normalizarCategoria = (categoria, valorPorDefecto = null) => {
    if (categoria === undefined || categoria === null || categoria === '') {
        return valorPorDefecto;
    }
    const valor = String(categoria).trim().toLowerCase();
    if (!CATEGORIAS_VALIDAS.includes(valor)) {
        throw errorHttp(400, "La categoría debe ser 'consulta' o 'estudio'");
    }
    return valor;
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
        s.categoria,
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

const RETURNING_SERVICIO =
    'RETURNING idServicio AS id_servicio, nombre, descripcion, categoria, activo';

// ---------- LISTAR ----------
// categoria (opcional): 'consulta' | 'estudio'; si no se manda, devuelve todas
export const obtenerServicios = async ({
    filtroActivo = 'todos',
    idUsuario = null,
    paquete = null,
    categoria = null,
} = {}) => {
    const categoriaFiltro = normalizarCategoria(categoria);
    const esClinica = paquete === 'Clinica';
    let idClinicaFiltro = null;

    if (esClinica && idUsuario) {
        const { rows: clinicaRows } = await conexion.query(
            `SELECT idClinica FROM Clinicas WHERE idUsuario = $1::int LIMIT 1;`,
            [idUsuario]
        );

        if (clinicaRows.length === 0) return [];
        idClinicaFiltro = clinicaRows[0].idclinica ?? clinicaRows[0].idClinica;
    }

    const query = `
        SELECT s.idServicio AS id_servicio,
               s.nombre,
               s.descripcion,
               s.categoria,
               s.activo,
               COALESCE(
                 json_agg(
                   json_build_object('id_clinica', c.idClinica, 'nombre', c.nombre)
                   ORDER BY c.nombre
                 ) FILTER (WHERE c.idClinica IS NOT NULL),
                 '[]'::json
               ) AS clinicas
        FROM Servicios s
        LEFT JOIN Clinica_Servicio cs ON cs.idServicio = s.idServicio
        LEFT JOIN Clinicas c ON c.idClinica = cs.idClinica
        WHERE ($1::text = 'todos' OR s.activo = ($1::text = 'true'))
          AND ($2::int IS NULL OR cs.idClinica = $2::int)
          AND ($3::text IS NULL OR s.categoria = $3::text)
        GROUP BY s.idServicio
        ORDER BY s.categoria, s.nombre, s.idServicio;
    `;

    const { rows } = await conexion.query(query, [filtroActivo, idClinicaFiltro, categoriaFiltro]);
    return rows;
};

// ---------- CATÁLOGO PARA PACIENTES ----------
// Solo servicios activos con una relación activa a una clínica.
// Devuelve únicamente los campos que el paciente necesita.
// categoria (opcional): 'consulta' | 'estudio'
export const obtenerCatalogoServicios = async ({ categoria = null } = {}) => {
    const categoriaFiltro = normalizarCategoria(categoria);

    const { rows } = await conexion.query(
        `
        SELECT
            s.idServicio AS id_servicio,
            s.nombre,
            s.descripcion,
            s.categoria
        FROM Servicios s
        WHERE s.activo
          AND ($1::text IS NULL OR s.categoria = $1::text)
          AND EXISTS (
              SELECT 1
              FROM Clinica_Servicio cs
              WHERE cs.idServicio = s.idServicio AND cs.activo
          )
        ORDER BY s.categoria, s.nombre, s.idServicio;
        `,
        [categoriaFiltro]
    );
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
// Crea el servicio y lo liga a las clínicas en una sola transacción.
// categoria: 'consulta' (por defecto) | 'estudio'
export const crearServicio = async ({
    nombre,
    descripcion,
    categoria = 'consulta',
    idsClinicas = [],
}) => {
    const categoriaFinal = normalizarCategoria(categoria, 'consulta');

    try {
        return await enTransaccion(async (cliente) => {
            const { rows } = await cliente.query(
                `INSERT INTO Servicios (nombre, descripcion, categoria)
                 VALUES ($1, $2, $3)
                 ${RETURNING_SERVICIO}`,
                [nombre, descripcion, categoriaFinal]
            );
            const servicio = rows[0];

            if (idsClinicas.length > 0) {
                await cliente.query(
                    `INSERT INTO Clinica_Servicio (idServicio, idClinica)
                        SELECT $1, UNNEST($2::int[])
                        ON CONFLICT DO NOTHING`,
                    [servicio.id_servicio, idsClinicas]
                );
            }

            return { ...servicio, ids_clinicas: idsClinicas };
        });
    } catch (err) {
        manejarErrorPg(err);
    }
};

// ---------- ACTUALIZAR (solo registros activos) ----------
// Reemplaza nombre y descripción; si descripcion es null, se borra.
// categoria: si no viene, se conserva la actual.
// Si llega idclinica, cambia la clínica del servicio (o la crea si no tenía)
export const actualizarServicio = async (id, { nombre, descripcion, categoria, idclinica }) => {
    const categoriaFinal = normalizarCategoria(categoria); // null = no cambiar

    try {
        return await enTransaccion(async (cliente) => {
            const { rows } = await cliente.query(
                `UPDATE Servicios
                 SET nombre = $2,
                     descripcion = $3,
                     categoria = COALESCE($4::text, categoria)
                 WHERE idServicio = $1
                 ${RETURNING_SERVICIO}`,
                [id, nombre, descripcion, categoriaFinal]
            );
            const servicio = rows[0];
            if (!servicio) return null; // no existe

            if (idclinica != null) {
                const { rowCount } = await cliente.query(
                    `UPDATE Clinica_Servicio
                     SET idClinica = $2
                     WHERE idServicio = $1`,
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