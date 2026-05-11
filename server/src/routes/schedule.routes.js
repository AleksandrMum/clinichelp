/**
 * Schedule API — weekly rules + exceptions (no appointments yet).
 *
 * Role semantics:
 * - manager: read/write rules & exceptions; read schedule view for any doctor.
 * - doctor: read only; access only own doctorId (subject === JWT sub); enforced via scheduleDoctorScope + explicit forbidden when mismatched.
 * - admin: read-only overview (rules/exceptions/view GET); no write routes wired for PUT/PATCH/POST.
 *
 * @module routes/schedule.routes
 */
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const scheduleDoctorScope = require('../middlewares/schedule-doctor-scope.middleware');
const { listDoctorRules, replaceDoctorRules } = require('../controllers/schedule-rules.controller');
const {
  listDoctorExceptions,
  createException,
  updateException,
  archiveException
} = require('../controllers/schedule-exception.controller');
const { getDoctorScheduleView } = require('../controllers/schedule-view.controller');

const scheduleRouter = Router();

const readRoles = roleGuard('manager', 'doctor', 'admin');
const managerWrite = roleGuard('manager');

scheduleRouter.use(authMiddleware);

scheduleRouter.get('/doctors/:doctorId/rules', readRoles, scheduleDoctorScope(), listDoctorRules);
scheduleRouter.put('/doctors/:doctorId/rules', managerWrite, replaceDoctorRules);

scheduleRouter.get('/doctors/:doctorId/exceptions', readRoles, scheduleDoctorScope(), listDoctorExceptions);
scheduleRouter.post('/exceptions', managerWrite, createException);
scheduleRouter.patch('/exceptions/:id', managerWrite, updateException);
scheduleRouter.patch('/exceptions/:id/archive', managerWrite, archiveException);

scheduleRouter.get('/doctors/:doctorId/view', readRoles, scheduleDoctorScope(), getDoctorScheduleView);

module.exports = scheduleRouter;
