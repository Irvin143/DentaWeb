import { Router } from 'express';
import * as paqueteRolController from '../controllers/paqueteRol.controller.js';

const router = Router();

router.get('/', paqueteRolController.listar);                    // GET    /api/paquetes-roles?activo=true|false|todos
router.get('/:id', paqueteRolController.obtenerPorId);           // GET    /api/paquetes-roles/5
router.post('/', paqueteRolController.crear);                    // POST   /api/paquetes-roles
router.put('/:id', paqueteRolController.actualizar);             // PUT    /api/paquetes-roles/5
router.delete('/:id', paqueteRolController.eliminar);            // DELETE /api/paquetes-roles/5  (lógico)
router.patch('/:id/reactivar', paqueteRolController.reactivar);  // PATCH  /api/paquetes-roles/5/reactivar

export default router;

// En tu app.js:
// import paqueteRolRoutes from './routes/paqueteRolRoutes.js';
// app.use('/api/paquetes-roles', paqueteRolRoutes);