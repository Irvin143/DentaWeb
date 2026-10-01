import { Router } from 'express';
import * as servicioController from '../controllers/servicios.controller.js';

const router = Router();

router.get('/', servicioController.listar);                    // GET    /api/servicios?activo=true|false|todos
router.get('/:id', servicioController.obtenerPorId);           // GET    /api/servicios/5
router.post('/', servicioController.crear);                    // POST   /api/servicios
router.put('/:id', servicioController.actualizar);             // PUT    /api/servicios/5
router.delete('/:id', servicioController.eliminar);            // DELETE /api/servicios/5  (lógico)
router.patch('/:id/reactivar', servicioController.reactivar);  // PATCH  /api/servicios/5/reactivar

export default router;

// En tu app.js:
// import servicioRoutes from './routes/servicioRoutes.js';
// app.use('/api/servicios', servicioRoutes);