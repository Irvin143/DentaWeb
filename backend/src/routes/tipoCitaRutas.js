import { Router } from 'express';
import * as tipoCitaController from '../controllers/tipoCita.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin', 'clinica']));

router.get('/', tipoCitaController.listar);                    // GET    /api/tipos-cita?activo=true|false|todos
router.get('/:id', tipoCitaController.obtenerPorId);           // GET    /api/tipos-cita/5
router.post('/', tipoCitaController.crear);                    // POST   /api/tipos-cita
router.put('/:id', tipoCitaController.actualizar);             // PUT    /api/tipos-cita/5
router.delete('/:id', tipoCitaController.eliminar);            // DELETE /api/tipos-cita/5  (lógico)
router.patch('/:id/reactivar', tipoCitaController.reactivar);  // PATCH  /api/tipos-cita/5/reactivar

export default router;

// En tu app.js:
// import tipoCitaRoutes from './routes/tipoCitaRoutes.js';
// app.use('/api/tipos-cita', tipoCitaRoutes);