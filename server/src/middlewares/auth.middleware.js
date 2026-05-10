const { AppError } = require('../common/errors/app-error');
const { verifyAccessToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(AppError.unauthorized('Missing token'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      login: decoded.login
    };
    return next();
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
}

module.exports = authMiddleware;
