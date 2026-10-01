import { Router } from 'express';
import * as rolController from '../controllers/rol.controller.js';

const router = Router();

router.get('/', rolController.listar);                    // GET    /api/roles?activo=true|false|todos
router.get('/:id', rolController.obtenerPorId);           // GET    /api/roles/5
router.post('/', rolController.crear);                    // POST   /api/roles
router.put('/:id', rolController.actualizar);             // PUT    /api/roles/5
router.delete('/:id', rolController.eliminar);            // DELETE /api/roles/5  (lógico)
router.patch('/:id/reactivar', rolController.reactivar);  // PATCH  /api/roles/5/reactivar

export default router;

// En tu app.js:
// import rolRoutes from './routes/rolRoutes.js';
// app.use('/api/roles', rolRoutes);