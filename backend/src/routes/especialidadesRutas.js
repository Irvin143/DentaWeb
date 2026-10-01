import { Router } from 'express';
import * as especialidadesController from '../controllers/especialidades.controller.js';

const router = Router();

router.get('/', especialidadesController.obtenerEspecialidades);
router.post('/', especialidadesController.crearEspecialidad);
router.put('/:id', especialidadesController.actualizarEspecialidad);
router.delete('/:id', especialidadesController.eliminarEspecialidad);

export default router;