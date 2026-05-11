const serviceService = require('../services/service.service');
const { success } = require('../utils/api-response');

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

async function listServices(req, res, next) {
  try {
    let isAvailable;
    if (req.user.role === 'doctor') {
      isAvailable = true;
    } else {
      const parsed = parseBoolean(req.query.isAvailable);
      if (parsed !== undefined) {
        isAvailable = parsed;
      }
    }

    const filters = {};
    if (typeof isAvailable === 'boolean') {
      filters.isAvailable = isAvailable;
    }

    const { page, limit } = req.query;
    const result = await serviceService.listServices(filters, { page, limit });
    return success(res, result.items, result.meta);
  } catch (err) {
    return next(err);
  }
}

async function getServiceById(req, res, next) {
  try {
    const activeOnly = req.user.role === 'doctor';
    const row = await serviceService.getServiceById(req.params.id, { activeOnly });
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

async function createService(req, res, next) {
  try {
    const row = await serviceService.createService(req.body, req.user.id);
    return success(res, row, null, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const row = await serviceService.updateService(req.params.id, req.body, req.user.id);
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

async function deactivateService(req, res, next) {
  try {
    const row = await serviceService.deactivateService(req.params.id, req.user.id);
    return success(res, row);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  deactivateService
};
