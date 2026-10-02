import conexion from "./conexion.js"; // ajusta a como exportas tu conexión real

export const obtenerPacientes = async () => {
    const query = `
        SELECT
            p.idPaciente   AS id_paciente,
            p.idUsuario    AS id_usuario,
            p.nombre,
            p.ape_pat,
            p.ape_mat,
            p.telefono,
            u.activo,
            u.correo,
            p.idOdontologo AS id_odontologo,
            CONCAT_WS(' ', o.nombre, o.ape_pat, o.ape_mat) AS nombre_odontologo
        FROM Pacientes p
        LEFT JOIN Usuarios u    ON p.idUsuario    = u.idUsuario
        LEFT JOIN Odontologos o ON p.idOdontologo = o.idOdontologo
        ORDER BY p.ape_pat, p.nombre;
    `;

    const { rows } = await conexion.query(query);
    return rows;
};
export const actualizarPaciente = async (
    id,
    { nombre, ape_pat, ape_mat, telefono, idOdontologo }
) => {
    const query = `
        UPDATE Pacientes
        SET nombre       = COALESCE($2, nombre),
            ape_pat      = COALESCE($3, ape_pat),
            ape_mat      = COALESCE($4, ape_mat),
            telefono     = COALESCE($5, telefono),
            idOdontologo = COALESCE($6, idOdontologo)
        WHERE idPaciente = $1
        RETURNING idPaciente AS id_paciente,
                  nombre, ape_pat, ape_mat, telefono,
                  idOdontologo AS id_odontologo;
    `;

    // Normaliza: sin espacios; vacío cuenta como "no cambiar"
    const tel = telefono?.toString().trim() || null;

    try {
        const { rows } = await conexion.query(query, [
            id, nombre, ape_pat, ape_mat, tel, idOdontologo,
        ]);
        return rows[0] ?? null; // null = no existe
    } catch (err) {
        if (err.code === '23505') {
            // violación de unicidad (teléfono repetido)
            const e = new Error('Ya existe un paciente con ese teléfono');
            e.status = 409;
            throw e;
        }
        throw err;
    }
};
// Eliminación lógica: desactiva la cuenta (el login ya rechaza activo = false)
export const eliminarPaciente = async (id) => {
    const query = `
        UPDATE Usuarios
        SET activo = false
        WHERE idUsuario = (SELECT idUsuario FROM Pacientes WHERE idPaciente = $1)
        RETURNING idUsuario AS id_usuario;
    `;

    const { rowCount } = await conexion.query(query, [id]);
    return rowCount > 0; // false = no existe
};

export const reactivarPaciente = async (id) => {
    const { rows } = await conexion.query(
        `SELECT u.activo
         FROM Pacientes p
         JOIN Usuarios u ON p.idUsuario = u.idUsuario
         WHERE p.idPaciente = $1`,
        [id]
    );
    if (!rows[0] || rows[0].activo) return null;

    const { rowCount } = await conexion.query(
        `UPDATE Usuarios
         SET activo = true
         WHERE idUsuario = (SELECT idUsuario FROM Pacientes WHERE idPaciente = $1)`,
        [id]
    );
    return rowCount > 0;
};
