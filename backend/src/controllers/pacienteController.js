import * as pacientesService from '../services/pacienteServices.js';

export const obtenerPacientes = async (req, res) => {
    try {
        const pacientes = await pacientesService.obtenerPacientes();

        return res.status(200).json({
        success: true,
        pacientes
        });
    } catch (error) {
        console.error("Error en obtenerPacientes controller:", error.message);

        return res.status(500).json({
        success: false,
        error: "Error interno del servidor al obtener los pacientes"
        });
    }
};