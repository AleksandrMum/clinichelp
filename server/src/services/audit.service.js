const { AuditLog } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');

class AuditService {
  async logEvent(payload, options = {}) {
    const { transaction } = options;
    const { userId, actionType, entityType, entityId = null, details = null } = payload || {};

    if (!userId || !actionType || !entityType) {
      throw AppError.badRequest('Audit event requires userId, actionType and entityType');
    }

    return AuditLog.create(
      {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details
      },
      { transaction }
    );
  }
}

module.exports = new AuditService();
