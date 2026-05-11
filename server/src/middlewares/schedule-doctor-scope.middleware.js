const { AppError } = require('../common/errors/app-error');

/**
 * For role `doctor`, route param `doctorId` must match JWT subject (own schedule only).
 * Manager/admin bypass.
 *
 * @param {string} [paramName]
 */
function scheduleDoctorScope(paramName = 'doctorId') {
  return (req, res, next) => {
    if (req.user.role !== 'doctor') {
      return next();
    }
    const doctorId = req.params[paramName];
    if (!doctorId || doctorId !== req.user.id) {
      return next(AppError.forbidden('You can only access your own schedule'));
    }
    return next();
  };
}

module.exports = scheduleDoctorScope;
