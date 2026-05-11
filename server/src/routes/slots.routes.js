const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const slotsDoctorScope = require('../middlewares/slots-doctor-scope.middleware');
const { findFreeSlots } = require('../controllers/slots.controller');

const slotsRouter = Router();

slotsRouter.use(authMiddleware);
slotsRouter.get('/', roleGuard('manager', 'doctor', 'admin'), slotsDoctorScope, findFreeSlots);

module.exports = slotsRouter;
