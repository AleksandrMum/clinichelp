/**
 * Services API — role semantics:
 * - manager: read + write (create/update/deactivate)
 * - doctor: read only, **active services only** (list + get-by-id)
 * - admin: read only overview (no write routes wired)
 *
 * @module routes/services.routes
 */
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const {
  listServices,
  getServiceById,
  createService,
  updateService,
  deactivateService
} = require('../controllers/services.controller');

const servicesRouter = Router();

servicesRouter.use(authMiddleware);

servicesRouter.get('/', roleGuard('manager', 'doctor', 'admin'), listServices);
servicesRouter.get('/:id', roleGuard('manager', 'doctor', 'admin'), getServiceById);
servicesRouter.post('/', roleGuard('manager'), createService);
servicesRouter.patch('/:id', roleGuard('manager'), updateService);
servicesRouter.patch('/:id/deactivate', roleGuard('manager'), deactivateService);

module.exports = servicesRouter;
