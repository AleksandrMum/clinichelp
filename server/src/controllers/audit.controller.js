const auditReadService = require('../services/audit-read.service');
const { success } = require('../utils/api-response');

async function listAuditEntries(req, res, next) {
  try {
    const result = await auditReadService.listAuditEntries(req.query);
    return success(res, result.items, result.meta);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listAuditEntries
};

