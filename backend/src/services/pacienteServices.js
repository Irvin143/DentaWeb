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
        u.correo
        FROM Pacientes p
        LEFT JOIN Usuarios u ON p.idUsuario = u.idUsuario
        ORDER BY p.ape_pat, p.nombre
        LIMIT $1 OFFSET $2;
    `;

    const { rows } = await conexion.query(query, [limite, offset]);
    return rows;
};