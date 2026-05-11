const slotService = require('../services/slot.service');
const { success } = require('../utils/api-response');
const { nonEmptyTrimmedString } = require('../utils/validation');

async function findFreeSlots(req, res, next) {
  try {
    const doctorId = nonEmptyTrimmedString(req.query.doctorId, 'doctorId');
    const serviceId = nonEmptyTrimmedString(req.query.serviceId, 'serviceId');
    const from = nonEmptyTrimmedString(req.query.from, 'from');
    const to = nonEmptyTrimmedString(req.query.to, 'to');

    const durationMin =
      req.query.durationMin !== undefined && req.query.durationMin !== ''
        ? Number(req.query.durationMin)
        : undefined;

    const slots = await slotService.findFreeSlots({
      doctorId,
      serviceId,
      from,
      to,
      ...(durationMin !== undefined ? { durationMin } : {})
    });

    return success(res, slots, { count: slots.length });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  findFreeSlots
};
