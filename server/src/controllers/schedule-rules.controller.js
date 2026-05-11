const scheduleRuleService = require('../services/schedule-rule.service');
const { success } = require('../utils/api-response');

async function listDoctorRules(req, res, next) {
  try {
    const rules = await scheduleRuleService.listDoctorRules(req.params.doctorId);
    return success(res, rules);
  } catch (err) {
    return next(err);
  }
}

async function replaceDoctorRules(req, res, next) {
  try {
    const rules = await scheduleRuleService.replaceDoctorRules(
      req.params.doctorId,
      req.body?.rules,
      req.user.id
    );
    return success(res, rules);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDoctorRules,
  replaceDoctorRules
};
