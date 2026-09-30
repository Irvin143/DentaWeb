import * as pacientesService from '../services/pacienteServices.js';

export async function obtenerPacientes(req, res, next) {
    try {
        // 1. Leer y limpiar los parámetros de la URL: /pacientes?pagina=2&limite=10
        let pagina = Number.parseInt(req.query.pagina, 10);
        let limite = Number.parseInt(req.query.limite, 10);

        if (!Number.isInteger(pagina) || pagina < 1) pagina = 1;
        if (!Number.isInteger(limite) || limite < 1) limite = 20;
        if (limite > 100) limite = 100; // tope para no traer todo de golpe

        // 2. Llamar al service
        const pacientes = await pacientesService.obtenerPacientes({ pagina, limite });

        // 3. Responder
        res.status(200).json({
        pagina,
        limite,
        total: pacientes.length,
        pacientes,
        });
        
    } catch (err) {
        next(err); // lo maneja el middleware de errores de index.js
    }
}