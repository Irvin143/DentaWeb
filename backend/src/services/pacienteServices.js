import conexion from "./conexion.js"; // ajusta a como exportas tu conexión real

export const obtenerPacientes = async ({ limite = 20, pagina = 1 } = {}) => {
    const offset = (pagina - 1) * limite;

    const query = `
        SELECT
        p.idPaciente AS id_paciente,
        p.nombre,
        p.ape_pat,
        p.ape_mat,
        p.telefono,
        u.activo,
        u.correo
        FROM Pacientes p
        LEFT JOIN Usuarios u ON p.idUsuario = u.idUsuario
        ORDER BY p.ape_pat, p.nombre
        LIMIT $1 OFFSET $2;
    `;

    const { rows } = await conexion.query(query, [limite, offset]);
    return rows;
};
export const actualizarPaciente = async (id, { nombre, ape_pat, ape_mat, telefono }) => {
    const query = `
        UPDATE Pacientes
        SET nombre   = COALESCE($2, nombre),
            ape_pat  = COALESCE($3, ape_pat),
            ape_mat  = COALESCE($4, ape_mat),
            telefono = COALESCE($5, telefono)
        WHERE idPaciente = $1
        RETURNING idPaciente AS id_paciente, nombre, ape_pat, ape_mat, telefono;
    `;

    const { rows } = await conexion.query(query, [id, nombre, ape_pat, ape_mat, telefono]);
    return rows[0] ?? null; // null = no existe
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
