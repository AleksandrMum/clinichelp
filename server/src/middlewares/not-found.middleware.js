function notFoundMiddleware(req, res) {
  const requestId = req.requestId || null;

  res.status(404).json({
    data: null,
    meta: null,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: null,
      requestId
    }
  });
}

module.exports = notFoundMiddleware;
