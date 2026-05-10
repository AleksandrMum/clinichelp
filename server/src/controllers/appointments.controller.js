const appointmentService = require('../services/appointment.service');
const { success } = require('../utils/api-response');
const { nonEmptyTrimmedString } = require('../utils/validation');

async function listDoctorAppointments(req, res, next) {
  try {
    const { doctorId } = req.params;
    const { status, from, to, page, limit } = req.query;
    const result = await appointmentService.listDoctorAppointments(
      doctorId,
      { status, from, to, page, limit },
      req.user.role,
      req.user.id
    );
    return success(res, result.items, result.meta);
  } catch (err) {
    return next(err);
  }
}

async function createAppointment(req, res, next) {
  try {
    const row = await appointmentService.createAppointment(req.body, req.user.id);
    return success(res, row, null, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const status = nonEmptyTrimmedString(req.body.status, 'status');
    const row = await appointmentService.updateAppointmentStatus(
      req.params.id,
      status,
      req.user.id,
      req.user.role
    );
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const reason = nonEmptyTrimmedString(req.body.reason, 'reason');
    const row = await appointmentService.cancelAppointment(
      req.params.id,
      reason,
      req.user.id,
      req.user.role
    );
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

async function rescheduleAppointment(req, res, next) {
  try {
    const startAt = nonEmptyTrimmedString(req.body.startAt, 'startAt');
    const row = await appointmentService.rescheduleAppointment(req.params.id, startAt, req.user.id);
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDoctorAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment
};
