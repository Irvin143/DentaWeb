import { Router } from 'express';
import * as pacientesController from '../controllers/pacientes.controller.js';

const router = Router();

router.get('/', pacientesController.obtenerPacientes);

export default router;