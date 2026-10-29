import { Router } from 'express';
import { listarSedes, crear } from '../../controllers/citas/urgencias.controller.js';
// import { verificarToken } from '../middlewares/...';  // el mismo que usan tus otras rutas

const router = Router();

router.get('/sedes', /* verificarToken, */ listarSedes);
router.post('/', /* verificarToken, */ crear);

export default router;