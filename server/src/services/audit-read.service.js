const { Op } = require('sequelize');
const { AuditLog, User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'hash',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'jwt'
]);

function parsePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function parseOptionalDate(value, fieldName) {
  if (value == null || String(value).trim() === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw AppError.badRequest(`${fieldName} must be a valid date/datetime`, 'VALIDATION_ERROR');
  }
  return d;
}

function redactSensitive(input) {
  if (Array.isArray(input)) {
    return input.map(redactSensitive);
  }
  if (!input || typeof input !== 'object') {
    return input;
  }
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    const keyLower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower)) {
      out[k] = '[REDACTED]';
      continue;
    }
    out[k] = redactSensitive(v);
  }
  return out;
}

function makeSummary(actionType, entityType, entityId) {
  const action = String(actionType || '').trim();
  const entity = String(entityType || '').trim();
  if (!action) return 'Action logged';
  const fallback = `${action} on ${entity || 'entity'}`;
  const map = {
    AUTH_LOGIN_SUCCESS: 'Successful login',
    USER_CREATED: 'User created',
    USER_UPDATED: 'User updated',
    USER_PASSWORD_CHANGED: 'User password changed',
    USER_DEACTIVATED: 'User deactivated',
    PATIENT_CREATED: 'Patient created',
    PATIENT_UPDATED: 'Patient updated',
    PATIENT_ARCHIVED: 'Patient archived',
    SERVICE_CREATED: 'Service created',
    SERVICE_UPDATED: 'Service updated',
    SERVICE_DEACTIVATED: 'Service deactivated',
    SCHEDULE_RULES_REPLACED: 'Schedule rules replaced',
    SCHEDULE_EXCEPTION_CREATED: 'Schedule exception created',
    SCHEDULE_EXCEPTION_UPDATED: 'Schedule exception updated',
    SCHEDULE_EXCEPTION_ARCHIVED: 'Schedule exception archived',
    APPOINTMENT_CREATED: 'Appointment created',
    APPOINTMENT_STATUS_UPDATED: 'Appointment status changed',
    APPOINTMENT_CANCELLED: 'Appointment cancelled',
    APPOINTMENT_RESCHEDULED: 'Appointment rescheduled'
  };
  const base = map[action] || fallback;
  return entityId ? `${base} (${entityId})` : base;
}

function mapAuditRow(row) {
  const plain = typeof row.toJSON === 'function' ? row.toJSON() : row;
  const occurredAt = plain.action_time || plain.created_at;
  const day = new Date(occurredAt).toISOString().slice(0, 10);

  return {
    id: plain.id,
    occurredAt,
    day,
    userId: plain.user_id,
    user: plain.actor
      ? {
          id: plain.actor.id,
          fullName: plain.actor.full_name,
          login: plain.actor.login,
          role: plain.actor.role
        }
      : null,
    actionType: plain.action_type,
    entityType: plain.entity_type,
    entityId: plain.entity_id,
    summary: makeSummary(plain.action_type, plain.entity_type, plain.entity_id),
    metadata: redactSensitive(plain.details || null)
  };
}

function groupByDay(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.day)) map.set(item.day, []);
    map.get(item.day).push(item);
  }
  return Array.from(map.entries()).map(([date, grouped]) => ({ date, items: grouped }));
}

class AuditReadService {
  async listAuditEntries(query = {}) {
    const where = {};
    const dateFrom = parseOptionalDate(query.dateFrom, 'dateFrom');
    const dateTo = parseOptionalDate(query.dateTo, 'dateTo');
    if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
      throw AppError.badRequest('dateFrom must be before or equal to dateTo', 'VALIDATION_ERROR');
    }

    if (dateFrom) where.action_time = { ...where.action_time, [Op.gte]: dateFrom };
    if (dateTo) where.action_time = { ...where.action_time, [Op.lte]: dateTo };
    if (query.userId) where.user_id = String(query.userId).trim();
    if (query.actionType) where.action_type = String(query.actionType).trim();
    if (query.entityType) where.entity_type = String(query.entityType).trim();
    if (query.entityId) where.entity_id = String(query.entityId).trim();

    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'full_name', 'login', 'role']
        }
      ],
      order: [['action_time', 'DESC']],
      limit,
      offset
    });

    const entries = rows.map(mapAuditRow);
    return {
      items: groupByDay(entries),
      meta: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit) || 1,
        grouped: true
      }
    };
  }
}

module.exports = new AuditReadService();

