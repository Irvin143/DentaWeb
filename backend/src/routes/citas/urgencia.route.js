import { Router } from 'express';
import { listarSedes, crear } from '../../controllers/citas/urgencias.controller.js';
import { exigirSesion } from '../../middleware/auth.js';

const router = Router();

router.get('/sedes', exigirSesion, listarSedes);
router.post('/', exigirSesion, crear);

export default router;
