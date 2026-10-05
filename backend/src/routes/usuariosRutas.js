import { Router } from 'express';
import * as usuariosController from '../controllers/usuarios.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin']));

router.get('/', usuariosController.listar);                            // GET    /usuarios?activo=true|false|todos
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);                     // PUT    /usuarios/5
router.delete('/:id', usuariosController.eliminar);
router.patch('/:id/reactivar', usuariosController.reactivar);          // PATCH  /usuarios/5/reactivar

export default router;
