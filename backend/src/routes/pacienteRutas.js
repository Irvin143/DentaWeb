import { Router } from 'express';
import * as pacientesController from '../controllers/pacientes.controller.js';

const router = Router();

router.get('/', pacientesController.obtenerPacientes);

router.put('/:id', pacientesController.actualizar);
router.delete('/:id', pacientesController.eliminar);
router.put('/:id/reactivar', pacientesController.reactivar);
router.post('/', pacientesController.crearPaciente);
router.delete('/:id/forzar', pacientesController.eliminarPacienteForzado);

export default router;