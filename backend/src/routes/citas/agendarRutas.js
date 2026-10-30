
import { exigirSesion} from '../../middleware/auth.js';
import { listar, crear, proponerOdontologo, listarDias } from '../../controllers/citas/agendar.controller.js';
import { Router } from 'express';

const router = Router();

router.get('/dias-disponibles', exigirSesion, listarDias);
router.get('/odontologo-propuesto', exigirSesion, proponerOdontologo);
router.get('/disponibilidad', exigirSesion, listar);
router.post('/citas', exigirSesion, crear);


export default router;