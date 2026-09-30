import { Router } from "express";
import * as pacientesController from '../controllers/pacienteController.js';

const router = Router();

router.get('/', pacientesController.obtenerPacientes);