const { Op } = require('sequelize');
const { sequelize, ScheduleException, User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');
const { optionalTrimmedNullable } = require('../utils/validation');

const EXCEPTION_TYPES = ['day_off', 'extra_shift'];

const SAFE_EXCEPTION_ATTRIBUTES = [
  'id',
  'doctor_id',
  'start_at',
  'end_at',
  'exception_type',
  'comment',
  'is_archived',
  'archived_at',
  'created_at',
  'updated_at'
];

function mapException(row) {
  if (!row) return null;
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
}

async function assertDoctorUser(doctorId) {
  const user = await User.findByPk(doctorId);
  if (!user) {
    throw AppError.notFound('Doctor not found');
  }
  if (user.role !== 'doctor') {
    throw AppError.badRequest('Exceptions target users with role doctor');
  }
  if (!user.is_active) {
    throw AppError.conflict('Doctor account is deactivated', 'DOCTOR_INACTIVE');
  }
}

function parseDate(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw AppError.badRequest(`${fieldName} must be a valid date/datetime`);
  }
  return d;
}

class ScheduleExceptionService {
  async listDoctorExceptions(doctorId, filters = {}) {
    await assertDoctorUser(doctorId);

    const { from = null, to = null, includeArchived = false } = filters;
    const where = { doctor_id: doctorId };

    if (!includeArchived) {
      where.is_archived = false;
    }

    const fromD = parseDate(from, 'from');
    const toD = parseDate(to, 'to');
    if (fromD && toD && fromD >= toD) {
      throw AppError.badRequest('from must be before to');
    }

    if (fromD && toD) {
      where[Op.and] = [{ end_at: { [Op.gt]: fromD } }, { start_at: { [Op.lt]: toD } }];
    } else if (fromD) {
      where.end_at = { [Op.gt]: fromD };
    } else if (toD) {
      where.start_at = { [Op.lt]: toD };
    }

    const rows = await ScheduleException.findAll({
      where,
      attributes: SAFE_EXCEPTION_ATTRIBUTES,
      order: [['start_at', 'ASC']]
    });

    return rows.map(mapException);
  }

  async createException(payload, actorUserId) {
    const {
      doctorId,
      startAt,
      endAt,
      exceptionType,
      comment
    } = payload || {};

    if (!doctorId) {
      throw AppError.badRequest('doctorId is required');
    }
    await assertDoctorUser(doctorId);

    if (!EXCEPTION_TYPES.includes(exceptionType)) {
      throw AppError.badRequest(`exceptionType must be one of: ${EXCEPTION_TYPES.join(', ')}`);
    }

    const start = parseDate(startAt, 'startAt');
    const end = parseDate(endAt, 'endAt');
    if (!start || !end) {
      throw AppError.badRequest('startAt and endAt are required');
    }
    if (start >= end) {
      throw AppError.badRequest('startAt must be before endAt');
    }

    const commentVal = comment === undefined ? null : optionalTrimmedNullable(comment);

    return sequelize.transaction(async (transaction) => {
      const row = await ScheduleException.create(
        {
          doctor_id: doctorId,
          start_at: start,
          end_at: end,
          exception_type: exceptionType,
          comment: commentVal,
          is_archived: false,
          archived_at: null
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SCHEDULE_EXCEPTION_CREATED',
          entityType: 'schedule_exception',
          entityId: row.id,
          details: {
            doctor_id: doctorId,
            exception_type: exceptionType
          }
        },
        { transaction }
      );

      return mapException(row);
    });
  }

  async updateException(id, payload, actorUserId) {
    const row = await ScheduleException.findByPk(id);
    if (!row) {
      throw AppError.notFound('Schedule exception not found');
    }
    if (row.is_archived) {
      throw AppError.conflict('Exception is archived', 'ALREADY_ARCHIVED');
    }

    const patch = {};
    if (payload.startAt !== undefined) {
      const s = parseDate(payload.startAt, 'startAt');
      if (!s) throw AppError.badRequest('startAt cannot be empty');
      patch.start_at = s;
    }
    if (payload.endAt !== undefined) {
      const e = parseDate(payload.endAt, 'endAt');
      if (!e) throw AppError.badRequest('endAt cannot be empty');
      patch.end_at = e;
    }
    if (payload.exceptionType !== undefined) {
      if (!EXCEPTION_TYPES.includes(payload.exceptionType)) {
        throw AppError.badRequest(`exceptionType must be one of: ${EXCEPTION_TYPES.join(', ')}`);
      }
      patch.exception_type = payload.exceptionType;
    }
    if (payload.comment !== undefined) {
      patch.comment = optionalTrimmedNullable(payload.comment);
    }

    if (Object.keys(patch).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    const nextStart = patch.start_at !== undefined ? patch.start_at : row.start_at;
    const nextEnd = patch.end_at !== undefined ? patch.end_at : row.end_at;
    if (nextStart >= nextEnd) {
      throw AppError.badRequest('startAt must be before endAt');
    }

    return sequelize.transaction(async (transaction) => {
      await row.update(patch, { transaction });

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SCHEDULE_EXCEPTION_UPDATED',
          entityType: 'schedule_exception',
          entityId: row.id,
          details: { changedFields: Object.keys(patch) }
        },
        { transaction }
      );

      await row.reload({ attributes: SAFE_EXCEPTION_ATTRIBUTES, transaction });
      return mapException(row);
    });
  }

  async archiveException(id, actorUserId) {
    const row = await ScheduleException.findByPk(id);
    if (!row) {
      throw AppError.notFound('Schedule exception not found');
    }
    if (row.is_archived) {
      throw AppError.conflict('Exception is already archived', 'ALREADY_ARCHIVED');
    }

    return sequelize.transaction(async (transaction) => {
      await row.update(
        {
          is_archived: true,
          archived_at: new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SCHEDULE_EXCEPTION_ARCHIVED',
          entityType: 'schedule_exception',
          entityId: row.id,
          details: { doctor_id: row.doctor_id }
        },
        { transaction }
      );

      await row.reload({ attributes: SAFE_EXCEPTION_ATTRIBUTES, transaction });
      return mapException(row);
    });
  }
}

module.exports = new ScheduleExceptionService();
