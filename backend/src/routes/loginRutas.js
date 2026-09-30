import { Router } from "express";
import * as loginController from '../controllers/login.controllers.js';

const router = Router();

router.post('/registrar', loginController.registro);
router.post('/login', loginController.login);

export default router;