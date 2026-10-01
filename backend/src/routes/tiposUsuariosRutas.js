import { Router } from 'express';
import * as tipoUsuarioController from '../controllers/tiposUsuarios.controller.js';

const router = Router();

// // Todas las rutas requieren sesión y rol admin
// router.use(verificarToken, requiereRol('admin'));

router.get('/', tipoUsuarioController.listar);
router.get('/:id', tipoUsuarioController.obtenerPorId);
router.post('/', tipoUsuarioController.crear);
router.put('/:id', tipoUsuarioController.actualizar);
router.delete('/:id', tipoUsuarioController.eliminar);
router.patch('/:id/reactivar', tipoUsuarioController.reactivar);

export default router;