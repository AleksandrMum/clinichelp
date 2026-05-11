const scheduleExceptionService = require('../services/schedule-exception.service');
const { success } = require('../utils/api-response');

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

async function listDoctorExceptions(req, res, next) {
  try {
    const includeArchived =
      (req.user.role === 'manager' || req.user.role === 'admin') &&
      parseBoolean(req.query.includeArchived) === true;

    const rows = await scheduleExceptionService.listDoctorExceptions(req.params.doctorId, {
      from: req.query.from,
      to: req.query.to,
      includeArchived
    });
    return success(res, rows);
  } catch (err) {
    return next(err);
  }
}

async function createException(req, res, next) {
  try {
    const row = await scheduleExceptionService.createException(req.body, req.user.id);
    return success(res, row, null, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateException(req, res, next) {
  try {
    const row = await scheduleExceptionService.updateException(req.params.id, req.body, req.user.id);
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

async function archiveException(req, res, next) {
  try {
    const row = await scheduleExceptionService.archiveException(req.params.id, req.user.id);
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDoctorExceptions,
  createException,
  updateException,
  archiveException
};
