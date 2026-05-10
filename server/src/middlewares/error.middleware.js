const { AppError } = require('../common/errors/app-error');

function errorMiddleware(err, req, res, next) {
  const requestId = req.requestId || null;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('[error]', { requestId, err });
    }

    return res.status(err.statusCode).json({
      data: null,
      meta: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId
      }
    });
  }

  console.error('[error]', { requestId, err });

  return res.status(500).json({
    data: null,
    meta: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
      requestId
    }
  });
}

module.exports = errorMiddleware;
