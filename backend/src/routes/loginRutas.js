import { Router } from "express";
import * as loginController from '../controllers/login.controller.js';

const router = Router();

router.post('/registrar', loginController.registro);
router.post('/login', loginController.login);
router.post('/cambiar-contrasena', loginController.cambiarContrasenaPropia);

export default router;