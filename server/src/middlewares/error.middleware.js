function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ message });
}

module.exports = errorMiddleware;
