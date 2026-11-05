import { Router } from 'express';
import * as odontologoController from '../../controllers/catalogos/odontologos.controller.js';
import * as perfilController from '../../controllers/catalogos/odontologoPerfil.controller.js';
import { exigirAcceso } from '../../middleware/auth.js';

const router = Router();

router.use(exigirAcceso(['admin', 'clinica']));

// Especialidades y horario semanal del odontólogo.
// La del catálogo va antes de las rutas con :id.
router.get('/perfil/catalogo', perfilController.catalogo);       // GET    /api/odontologos/perfil/catalogo
router.get('/:id/perfil', perfilController.obtener);             // GET    /api/odontologos/5/perfil
router.put('/:id/perfil', perfilController.guardar);             // PUT    /api/odontologos/5/perfil

router.get('/', odontologoController.listar);                    // GET    /api/odontologos?activo=true|false|todos&idclinica=1
router.get('/:id', odontologoController.obtenerPorId);           // GET    /api/odontologos/5
router.post('/', odontologoController.crear);                    // POST   /api/odontologos
router.put('/:id', odontologoController.actualizar);             // PUT    /api/odontologos/5
router.delete('/:id', odontologoController.eliminar);            // DELETE /api/odontologos/5  (lógico)
router.patch('/:id/reactivar', odontologoController.reactivar);  // PATCH  /api/odontologos/5/reactivar

export default router;
