const patientService = require('../services/patient.service');
const appointmentService = require('../services/appointment.service');
const { success } = require('../utils/api-response');

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

function canSeeArchivedPatients(role) {
  return role === 'manager' || role === 'admin';
}

async function listPatients(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const includeArchived =
      canSeeArchivedPatients(req.user.role) && parseBoolean(req.query.includeArchived) === true;

    const result = await patientService.searchPatients(search, { page, limit }, { includeArchived });
    return success(res, result.items, result.meta);
  } catch (err) {
    return next(err);
  }
}

async function getPatientById(req, res, next) {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    return success(res, patient);
  } catch (err) {
    return next(err);
  }
}

async function createPatient(req, res, next) {
  try {
    const patient = await patientService.createPatient(req.body, req.user.id);
    return success(res, patient, null, 201);
  } catch (err) {
    return next(err);
  }
}

async function updatePatient(req, res, next) {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body, req.user.id);
    return success(res, patient);
  } catch (err) {
    return next(err);
  }
}

async function archivePatient(req, res, next) {
  try {
    const patient = await patientService.archivePatient(req.params.id, req.user.id);
    return success(res, patient);
  } catch (err) {
    return next(err);
  }
}

async function listPatientAppointments(req, res, next) {
  try {
    const { id } = req.params;
    const { mode, page, limit, status, from, to } = req.query;
    const result = await appointmentService.listPatientAppointments(
      id,
      { mode, page, limit, status, from, to },
      req.user.role,
      req.user.id
    );
    return success(res, result.items, result.meta);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPatients,
  getPatientById,
  listPatientAppointments,
  createPatient,
  updatePatient,
  archivePatient
};
