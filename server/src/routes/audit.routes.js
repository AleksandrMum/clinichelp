const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const { listAuditEntries } = require('../controllers/audit.controller');

const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.use(roleGuard('admin'));

auditRouter.get('/', listAuditEntries);

module.exports = auditRouter;

