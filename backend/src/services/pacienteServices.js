import conexion from "./conexion.js"; // ajusta a como exportas tu conexión real


import { conexion } from '../config/db.js';

export const obtenerPacientes = async () => {
  // Hacemos JOIN con Usuarios si necesitas traer el correo
    const query = `
        SELECT 
        p.idPaciente,
        p.nombre,
        p.ape_pat,
        p.ape_mat,
        p.telefono,
        u.correo
        FROM Pacientes p
        LEFT JOIN Usuarios u ON p.idUsuario = u.idUsuario;
    `;

    const resultado = await conexion.query(query);
    
    // Retorna directamente el arreglo de filas
    return resultado.rows;
};