/**
 * AuditService — журнал значимых действий (append-only на уровне приложения).
 *
 * Будущие методы:
 * - logEvent({ userId, actionType, entityType, entityId, details })
 * - listAuditEvents(filters, pagination) — только admin
 */
class AuditService {}

module.exports = new AuditService();
