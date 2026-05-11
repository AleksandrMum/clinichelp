/**
 * Patients API — role semantics:
 * - manager: read + write (create/update/archive)
 * - doctor: read only (see service-layer NOTE: broad patient read is temporary until appointments linkage exists)
 * - admin: read only overview (no write routes wired)
 *
 * @module routes/patients.routes
 */
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const {
  listPatients,
  getPatientById,
  listPatientAppointments,
  createPatient,
  updatePatient,
  archivePatient
} = require('../controllers/patients.controller');

const patientsRouter = Router();

patientsRouter.use(authMiddleware);

patientsRouter.get('/', roleGuard('manager', 'doctor', 'admin'), listPatients);
patientsRouter.get('/:id', roleGuard('manager', 'doctor', 'admin'), getPatientById);
patientsRouter.get('/:id/appointments', roleGuard('manager', 'doctor', 'admin'), listPatientAppointments);
patientsRouter.post('/', roleGuard('manager'), createPatient);
patientsRouter.patch('/:id', roleGuard('manager'), updatePatient);
patientsRouter.patch('/:id/archive', roleGuard('manager'), archivePatient);

module.exports = patientsRouter;
