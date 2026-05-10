const { randomUUID } = require('crypto');

function requestIdMiddleware(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestIdMiddleware;
