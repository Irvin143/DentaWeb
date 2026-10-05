import { Router } from 'express';
import * as odontologoController from '../controllers/odontologos.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin', 'clinica']));

router.get('/', odontologoController.listar);                    // GET    /api/odontologos?activo=true|false|todos&idclinica=1
router.get('/:id', odontologoController.obtenerPorId);           // GET    /api/odontologos/5
router.post('/', odontologoController.crear);                    // POST   /api/odontologos
router.put('/:id', odontologoController.actualizar);             // PUT    /api/odontologos/5
router.delete('/:id', odontologoController.eliminar);            // DELETE /api/odontologos/5  (lógico)
router.patch('/:id/reactivar', odontologoController.reactivar);  // PATCH  /api/odontologos/5/reactivar

export default router;

// En tu app.js:
// import odontologoRoutes from './routes/odontologoRoutes.js';
// app.use('/api/odontologos', odontologoRoutes);