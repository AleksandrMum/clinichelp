const userService = require('../services/user.service');
const { success } = require('../utils/api-response');

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

async function listUsers(req, res, next) {
  try {
    const { role, search, page, limit } = req.query;
    const isActive = parseBoolean(req.query.isActive);
    const result = await userService.listUsers(
      { role, search, isActive },
      { page, limit }
    );
    return success(res, result.items, result.meta);
  } catch (error) {
    return next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, user);
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user.id);
    return success(res, user, null, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    return success(res, user);
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await userService.changePassword(req.params.id, req.body?.newPassword, req.user.id);
    return success(res, result);
  } catch (error) {
    return next(error);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const user = await userService.deactivateUser(req.params.id, req.user.id);
    return success(res, user);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deactivateUser
};
