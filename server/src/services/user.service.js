const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');

const ROLES = ['admin', 'manager', 'doctor'];
const SAFE_USER_ATTRIBUTES = ['id', 'full_name', 'login', 'role', 'phone', 'is_active', 'deactivated_at', 'created_at', 'updated_at'];
const PASSWORD_SALT_ROUNDS = 10;

function mapUser(user) {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : user;
  delete plain.password_hash;
  return plain;
}

function parsePagination(pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

class UserService {
  async listUsers(filters = {}, pagination = {}) {
    const { role, isActive, search } = filters;
    const where = {};

    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.is_active = isActive;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { login: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { page, limit, offset } = parsePagination(pagination);

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: SAFE_USER_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      items: rows.map(mapUser),
      meta: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit) || 1
      }
    };
  }

  async getUserById(id) {
    const user = await User.findByPk(id, { attributes: SAFE_USER_ATTRIBUTES });
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return mapUser(user);
  }

  async createUser(payload, actorUserId) {
    const { fullName, login, password, role, phone = null } = payload || {};
    if (!fullName || !login || !password || !role) {
      throw AppError.badRequest('fullName, login, password and role are required');
    }
    if (!ROLES.includes(role)) {
      throw AppError.badRequest('Invalid role');
    }

    const normalizedLogin = String(login).trim();
    const passwordHash = await bcrypt.hash(String(password), PASSWORD_SALT_ROUNDS);

    return sequelize.transaction(async (transaction) => {
      try {
        const user = await User.create(
          {
            full_name: String(fullName).trim(),
            login: normalizedLogin,
            password_hash: passwordHash,
            role,
            phone: phone ? String(phone).trim() : null,
            is_active: true,
            deactivated_at: null
          },
          { transaction }
        );

        await auditService.logEvent(
          {
            userId: actorUserId,
            actionType: 'USER_CREATED',
            entityType: 'user',
            entityId: user.id,
            details: {
              role: user.role,
              login: user.login
            }
          },
          { transaction }
        );

        return mapUser(user);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          throw AppError.conflict('Login already exists', 'LOGIN_EXISTS');
        }
        throw error;
      }
    });
  }

  async updateUser(id, payload, actorUserId) {
    const user = await User.findByPk(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const patch = {};
    if (payload.fullName !== undefined) patch.full_name = String(payload.fullName).trim();
    if (payload.phone !== undefined) patch.phone = payload.phone ? String(payload.phone).trim() : null;
    if (payload.role !== undefined) {
      if (!ROLES.includes(payload.role)) {
        throw AppError.badRequest('Invalid role');
      }
      patch.role = payload.role;
    }
    if (payload.isActive !== undefined) {
      patch.is_active = Boolean(payload.isActive);
      patch.deactivated_at = patch.is_active ? null : new Date();
    }
    if (payload.login !== undefined) patch.login = String(payload.login).trim();

    if (Object.keys(patch).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    return sequelize.transaction(async (transaction) => {
      try {
        await user.update(patch, { transaction });

        await auditService.logEvent(
          {
            userId: actorUserId,
            actionType: 'USER_UPDATED',
            entityType: 'user',
            entityId: user.id,
            details: {
              changedFields: Object.keys(patch)
            }
          },
          { transaction }
        );

        return mapUser(user);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          throw AppError.conflict('Login already exists', 'LOGIN_EXISTS');
        }
        throw error;
      }
    });
  }

  async changePassword(id, newPassword, actorUserId) {
    if (!newPassword) {
      throw AppError.badRequest('newPassword is required');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const passwordHash = await bcrypt.hash(String(newPassword), PASSWORD_SALT_ROUNDS);

    return sequelize.transaction(async (transaction) => {
      await user.update({ password_hash: passwordHash }, { transaction });

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'USER_PASSWORD_CHANGED',
          entityType: 'user',
          entityId: user.id,
          details: null
        },
        { transaction }
      );

      return { ok: true };
    });
  }

  async deactivateUser(id, actorUserId) {
    const user = await User.findByPk(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    if (!user.is_active) {
      throw AppError.conflict('User is already deactivated', 'ALREADY_DEACTIVATED');
    }

    return sequelize.transaction(async (transaction) => {
      await user.update(
        {
          is_active: false,
          deactivated_at: new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'USER_DEACTIVATED',
          entityType: 'user',
          entityId: user.id,
          details: null
        },
        { transaction }
      );

      return mapUser(user);
    });
  }
}

module.exports = new UserService();
