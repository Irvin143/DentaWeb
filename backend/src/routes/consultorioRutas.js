import { Router } from 'express';
import * as consultorioController from '../controllers/consultorio.controller.js';

const router = Router();

router.get('/', consultorioController.listar);                    // GET    /api/consultorios?activo=true|false|todos&idclinica=1
router.get('/:id', consultorioController.obtenerPorId);           // GET    /api/consultorios/5
router.post('/', consultorioController.crear);                    // POST   /api/consultorios
router.put('/:id', consultorioController.actualizar);             // PUT    /api/consultorios/5
router.delete('/:id', consultorioController.eliminar);            // DELETE /api/consultorios/5  (lógico)
router.patch('/:id/reactivar', consultorioController.reactivar);  // PATCH  /api/consultorios/5/reactivar

export default router;
