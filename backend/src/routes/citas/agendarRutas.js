
import { exigirSesion} from '../../middleware/auth.js';
import { Router } from 'express';
import { listar, listarDias, listarSedes, miOdontologo, proponerOdontologo, crear } from '../../controllers/citas/agendar.controller.js';

const router = Router();   

router.get('/sedes',exigirSesion, listarSedes);
router.get('/odontologo-fijo', exigirSesion, miOdontologo);
router.get('/dias-disponibles', exigirSesion, listarDias);
router.get('/odontologo-propuesto', exigirSesion, proponerOdontologo);
router.get('/disponibilidad', exigirSesion, listar);
router.post('/citas', exigirSesion, crear);


export default router;