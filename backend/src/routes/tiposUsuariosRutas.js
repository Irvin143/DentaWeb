import { Router } from 'express';
import * as tipoUsuarioController from '../controllers/tiposUsuarios.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin']));

router.get('/', tipoUsuarioController.listar);
router.get('/:id', tipoUsuarioController.obtenerPorId);
router.post('/', tipoUsuarioController.crear);
router.put('/:id', tipoUsuarioController.actualizar);
router.delete('/:id', tipoUsuarioController.eliminar);
router.patch('/:id/reactivar', tipoUsuarioController.reactivar);

export default router;