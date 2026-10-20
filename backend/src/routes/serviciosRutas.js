import { Router } from 'express';
import * as servicioController from '../controllers/servicios.controller.js';
import { exigirAcceso, exigirSesion } from '../middleware/auth.js';

const router = Router();

// Catálogo para pacientes: cualquier usuario con sesión, solo lectura.
// Va ANTES del router.use y de '/:id'.
router.get('/catalogo', exigirSesion, servicioController.listarCatalogo);

router.use(exigirAcceso(['admin', 'clinica']));

router.get('/', servicioController.listar);
router.get('/:id', servicioController.obtenerPorId);
router.post('/', servicioController.crear);
router.put('/:id', servicioController.actualizar);
router.delete('/:id', servicioController.eliminar);
router.patch('/:id/reactivar', servicioController.reactivar);

export default router;