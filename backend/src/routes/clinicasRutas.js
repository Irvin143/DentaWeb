import { Router } from 'express';
import * as clinicaController from '../controllers/clinicas.controller.js';
import { exigirAcceso } from '../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin', 'clinica']));

router.get('/', clinicaController.listar);                            // GET    /clinicas?activo=true|false|todos
router.post('/', clinicaController.crear);                            // POST   /clinicas
router.put('/:id', clinicaController.actualizar);                     // PUT    /clinicas/5
router.delete('/:id', clinicaController.eliminar);                    // DELETE /clinicas/5  (lógico)
router.patch('/:id/reactivar', clinicaController.reactivar);          // PATCH  /clinicas/5/reactivar

export default router;

// En tu app.js:
// import clinicaRoutes from './routes/clinicaRoutes.js';
// app.use('/clinicas', clinicaRoutes);