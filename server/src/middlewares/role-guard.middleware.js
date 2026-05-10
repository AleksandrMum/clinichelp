const { AppError } = require('../common/errors/app-error');

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    return next();
  };
}

module.exports = roleGuard;
