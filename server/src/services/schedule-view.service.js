const scheduleRuleService = require('./schedule-rule.service');
const scheduleExceptionService = require('./schedule-exception.service');
const { AppError } = require('../common/errors/app-error');

function parseDateRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw AppError.badRequest(`${fieldName} is required`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw AppError.badRequest(`${fieldName} must be a valid date/datetime`);
  }
  return d;
}

/**
 * Read-model: active weekly rules + active exceptions overlapping [from, to).
 * Appointments/slots are intentionally omitted (next phase).
 */
class ScheduleViewService {
  async getDoctorScheduleView({ doctorId, from, to }) {
    const fromD = parseDateRequired(from, 'from');
    const toD = parseDateRequired(to, 'to');
    if (fromD >= toD) {
      throw AppError.badRequest('from must be before to');
    }

    const [rules, exceptions] = await Promise.all([
      scheduleRuleService.listDoctorRules(doctorId),
      scheduleExceptionService.listDoctorExceptions(doctorId, {
        from: fromD.toISOString(),
        to: toD.toISOString(),
        includeArchived: false
      })
    ]);

    return {
      doctor_id: doctorId,
      from: fromD.toISOString(),
      to: toD.toISOString(),
      weekly_rules: rules,
      exceptions
    };
  }
}

module.exports = new ScheduleViewService();
