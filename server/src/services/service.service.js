/**
 * Services catalog (price list) — writes for managers; reads for doctors/admins.
 *
 * Doctor list/read is restricted to **active** services (`is_available === true`) at the
 * HTTP layer + `getServiceById` option `activeOnly`; managers/admins may load deactivated rows.
 *
 * @module services/service.service
 */
const { Op } = require('sequelize');
const { sequelize, Service } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');
const { nonEmptyTrimmedString } = require('../utils/validation');

const SAFE_SERVICE_ATTRIBUTES = [
  'id',
  'name',
  'duration_min',
  'price',
  'is_available',
  'deactivated_at',
  'created_at',
  'updated_at'
];

function mapService(row) {
  if (!row) return null;
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
}

function parsePagination(pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function validateDurationAndPrice(durationMin, price) {
  const d = Number(durationMin);
  const p = Number(price);
  if (!Number.isFinite(d) || d <= 0) {
    throw AppError.badRequest('duration_min must be a positive number');
  }
  if (!Number.isFinite(p) || p < 0) {
    throw AppError.badRequest('price must be a non-negative number');
  }
}

async function assertUniqueActiveName(name, excludeId = null, transaction) {
  const trimmed = nonEmptyTrimmedString(name, 'name');
  const where = {
    name: trimmed,
    is_available: true
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existing = await Service.findOne({ where, transaction });
  if (existing) {
    throw AppError.conflict('Active service with this name already exists', 'SERVICE_NAME_EXISTS');
  }
}

class ServiceService {
  async listServices(filters = {}, pagination = {}) {
    const where = {};
    if (typeof filters.isAvailable === 'boolean') {
      where.is_available = filters.isAvailable;
    }

    const { page, limit, offset } = parsePagination(pagination);

    const { rows, count } = await Service.findAndCountAll({
      where,
      attributes: SAFE_SERVICE_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      items: rows.map(mapService),
      meta: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit) || 1
      }
    };
  }

  /**
   * @param {string} id
   * @param {{ activeOnly?: boolean }} [options]
   */
  async getServiceById(id, options = {}) {
    const { activeOnly = false } = options;
    const where = { id };
    if (activeOnly) {
      where.is_available = true;
    }

    const row = await Service.findOne({
      where,
      attributes: SAFE_SERVICE_ATTRIBUTES
    });
    if (!row) {
      throw AppError.notFound('Service not found');
    }
    return mapService(row);
  }

  async createService(payload, actorUserId) {
    const { name, durationMin, price, isAvailable = true } = payload || {};
    validateDurationAndPrice(durationMin, price);

    const trimmedName = nonEmptyTrimmedString(name, 'name');
    const available = Boolean(isAvailable);

    return sequelize.transaction(async (transaction) => {
      if (available) {
        await assertUniqueActiveName(trimmedName, null, transaction);
      }

      const row = await Service.create(
        {
          name: trimmedName,
          duration_min: Number(durationMin),
          price: Number(price),
          is_available: available,
          deactivated_at: available ? null : new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SERVICE_CREATED',
          entityType: 'service',
          entityId: row.id,
          details: { name: row.name, duration_min: row.duration_min, price: row.price }
        },
        { transaction }
      );

      return mapService(row);
    });
  }

  async updateService(id, payload, actorUserId) {
    const row = await Service.findByPk(id);
    if (!row) {
      throw AppError.notFound('Service not found');
    }

    const patch = {};
    if (payload.name !== undefined) patch.name = nonEmptyTrimmedString(payload.name, 'name');
    if (payload.durationMin !== undefined) {
      const d = Number(payload.durationMin);
      if (!Number.isFinite(d) || d <= 0) {
        throw AppError.badRequest('duration_min must be a positive number');
      }
      patch.duration_min = d;
    }
    if (payload.price !== undefined) {
      const p = Number(payload.price);
      if (!Number.isFinite(p) || p < 0) {
        throw AppError.badRequest('price must be a non-negative number');
      }
      patch.price = p;
    }
    if (payload.isAvailable !== undefined) {
      const avail = Boolean(payload.isAvailable);
      patch.is_available = avail;
      patch.deactivated_at = avail ? null : new Date();
    }

    if (Object.keys(patch).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    const nextName = patch.name !== undefined ? patch.name : row.name;
    const nextAvailable = patch.is_available !== undefined ? patch.is_available : row.is_available;

    return sequelize.transaction(async (transaction) => {
      if (nextAvailable) {
        await assertUniqueActiveName(nextName, id, transaction);
      }

      await row.update(patch, { transaction });

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SERVICE_UPDATED',
          entityType: 'service',
          entityId: row.id,
          details: { changedFields: Object.keys(patch) }
        },
        { transaction }
      );

      await row.reload({ attributes: SAFE_SERVICE_ATTRIBUTES, transaction });
      return mapService(row);
    });
  }

  async deactivateService(id, actorUserId) {
    const row = await Service.findByPk(id);
    if (!row) {
      throw AppError.notFound('Service not found');
    }
    if (!row.is_available) {
      throw AppError.conflict('Service is already deactivated', 'ALREADY_DEACTIVATED');
    }

    return sequelize.transaction(async (transaction) => {
      await row.update(
        {
          is_available: false,
          deactivated_at: new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SERVICE_DEACTIVATED',
          entityType: 'service',
          entityId: row.id,
          details: { name: row.name }
        },
        { transaction }
      );

      await row.reload({ attributes: SAFE_SERVICE_ATTRIBUTES, transaction });
      return mapService(row);
    });
  }
}

module.exports = new ServiceService();
