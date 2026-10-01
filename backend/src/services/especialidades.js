import conexion from '../services/conexion.js';

export const obtenerEspecialidades = async ({ limite, offset }) => {
    const [datos, conteo] = await Promise.all([
        conexion.query(
        `SELECT idEspecialidad AS id_especialidad, nombre
        FROM Especialidades
        ORDER BY nombre, idEspecialidad
        LIMIT $1 OFFSET $2`,
        [limite, offset]
        ),
        conexion.query('SELECT COUNT(*)::int AS total FROM Especialidades'),
    ]);

    return { filas: datos.rows, total: conteo.rows[0].total };
};
// ---------- CREAR ----------
export const crearEspecialidad = async ({ nombre }) => {
    try {
        const { rows } = await conexion.query(
        `INSERT INTO Especialidades (nombre)
        VALUES ($1)
        RETURNING idEspecialidad AS id_especialidad, nombre`,
        [nombre]
        );
        return rows[0];
    } catch (err) {
        if (err.code === '23505') {
        const error = new Error('La especialidad ya existe');
        error.status = 409;
        throw error;
        }
        throw err;
    }
};

// ---------- ACTUALIZAR ----------
export const actualizarEspecialidad = async (id, { nombre }) => {
    try {
        const { rows } = await conexion.query(
        `UPDATE Especialidades
        SET nombre = $2
        WHERE idEspecialidad = $1
        RETURNING idEspecialidad AS id_especialidad, nombre`,
        [id, nombre]
        );
        return rows[0] ?? null; // null = no existe
    } catch (err) {
        if (err.code === '23505') {
        const error = new Error('Ya existe una especialidad con ese nombre');
        error.status = 409;
        throw error;
        }
        throw err;
    }
};

// ---------- ELIMINAR ----------
export const eliminarEspecialidad = async (id) => {
    const { rows } = await conexion.query(
        `SELECT
        EXISTS (SELECT 1 FROM Especialidades WHERE idEspecialidad = $1) AS existe,
        (SELECT COUNT(*)::int FROM Espe_odon WHERE idEspecialidad = $1) AS en_uso`,
        [id]
    );

    if (!rows[0].existe) return false; // no existe

    // Espe_odon tiene ON DELETE CASCADE: sin esta revisión, borrar la
    // especialidad quitaría en silencio la asignación a los odontólogos
    if (rows[0].en_uso > 0) {
        const error = new Error(`No se puede eliminar: está asignada a ${rows[0].en_uso} odontólogo(s)`);
        error.status = 409;
        throw error;
    }

    await conexion.query('DELETE FROM Especialidades WHERE idEspecialidad = $1', [id]);
    return true;
};