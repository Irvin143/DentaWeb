import { Router } from 'express';
import * as pacientesController from '../controllers/pacientes.controller.js';

const router = Router();

router.get('/', pacientesController.obtenerPacientes);

router.put('/:id', pacientesController.actualizar);
router.delete('/:id', pacientesController.eliminar);
router.post('/', pacientesController.crearPaciente);

export default router;