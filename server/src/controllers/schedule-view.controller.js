const scheduleViewService = require('../services/schedule-view.service');
const { success } = require('../utils/api-response');

async function getDoctorScheduleView(req, res, next) {
  try {
    const payload = await scheduleViewService.getDoctorScheduleView({
      doctorId: req.params.doctorId,
      from: req.query.from,
      to: req.query.to
    });
    return success(res, payload);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getDoctorScheduleView
};
