const { AppError } = require('../common/errors/app-error');

/**
 * For `doctor`, query param `doctorId` must equal JWT subject.
 */
function slotsDoctorScope(req, res, next) {
  if (req.user.role !== 'doctor') {
    return next();
  }
  const doctorId = req.query.doctorId;
  if (!doctorId || doctorId !== req.user.id) {
    return next(AppError.forbidden('You can only query slots for your own schedule'));
  }
  return next();
}

module.exports = slotsDoctorScope;
