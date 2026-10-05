import { Router } from 'express';
import * as estudiosController from '../controllers/estudios.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin', 'clinica', 'odontologo']));

router.get('/', estudiosController.obtenerEstudios);
router.post('/', estudiosController.crearEstudio);
router.put('/:id', estudiosController.actualizarEstudio);
router.delete('/:id', estudiosController.eliminarEstudio);
router.put('/:id/reactivar', estudiosController.reactivarEstudio);

export default router;