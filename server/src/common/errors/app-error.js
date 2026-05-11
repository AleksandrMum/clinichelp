class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = 'Bad request', code = 'VALIDATION_ERROR', details = null) {
    return new AppError(message, 422, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND', details = null) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = null) {
    return new AppError(message, 409, code, details);
  }
}

module.exports = { AppError };
