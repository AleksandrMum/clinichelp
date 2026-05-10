const { AppError } = require('../common/errors/app-error');

function appointmentsDoctorScope(paramName = 'doctorId') {
  return (req, res, next) => {
    if (req.user.role !== 'doctor') {
      return next();
    }
    const doctorId = req.params[paramName];
    if (!doctorId || doctorId !== req.user.id) {
      return next(AppError.forbidden('You can only access your own appointments'));
    }
    return next();
  };
}

module.exports = appointmentsDoctorScope;
