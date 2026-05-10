/**
 * Appointments API:
 * - manager: create, reschedule, cancel, status updates
 * - doctor: list/read path via doctor scope + status/cancel own only
 * - admin: list only (writes not routed)
 */
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const appointmentsDoctorScope = require('../middlewares/appointments-doctor-scope.middleware');
const {
  listDoctorAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/appointments.controller');

const appointmentsRouter = Router();

appointmentsRouter.use(authMiddleware);

const readRoles = roleGuard('manager', 'doctor', 'admin');

appointmentsRouter.get('/doctors/:doctorId', readRoles, appointmentsDoctorScope(), listDoctorAppointments);

appointmentsRouter.post('/', roleGuard('manager'), createAppointment);

appointmentsRouter.patch('/:id/status', roleGuard('manager', 'doctor'), updateAppointmentStatus);
appointmentsRouter.patch('/:id/cancel', roleGuard('manager', 'doctor'), cancelAppointment);
appointmentsRouter.patch('/:id/reschedule', roleGuard('manager'), rescheduleAppointment);

module.exports = appointmentsRouter;
