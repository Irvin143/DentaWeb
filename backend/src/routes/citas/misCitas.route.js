import { Router } from 'express';
import { cancelarMiCita, listarMisCitas } from '../../controllers/citas/misCItas.controller.js';
// TODO: ajusta la ruta al archivo donde tienes exigirSesion
import { exigirSesion } from '../../middleware/auth.js';

const router = Router();

// Cualquier usuario con sesión válida; si no es paciente, el service responde 403
router.use(exigirSesion);

router.get('/', listarMisCitas); //                  GET   /api/citas
router.patch('/:id/cancelar', cancelarMiCita); //    PATCH /api/citas/:id/cancelar

export default router;
