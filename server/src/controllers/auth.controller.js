const authService = require('../services/auth.service');
const { success } = require('../utils/api-response');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body?.login, req.body?.password);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.user.id);
    return success(res, user);
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout();
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  login,
  me,
  logout
};
