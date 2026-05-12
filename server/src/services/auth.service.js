const bcrypt = require('bcryptjs');
const { User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const { signAccessToken } = require('../utils/jwt');
const auditService = require('./audit.service');

const SAFE_USER_ATTRIBUTES = ['id', 'full_name', 'login', 'role', 'phone', 'is_active', 'deactivated_at', 'created_at', 'updated_at'];

function mapUser(user) {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : user;
  delete plain.password_hash;
  return plain;
}

class AuthService {
  async login(login, password) {
    const trimmedLogin = typeof login === 'string' ? login.trim() : '';
    if (!trimmedLogin || !password) {
      throw AppError.badRequest('login and password are required');
    }

    const user = await User.findOne({
      where: { login: trimmedLogin }
    });

    if (!user) {
      throw AppError.unauthorized('Invalid login or password');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DISABLED');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw AppError.unauthorized('Invalid login or password');
    }

    const token = signAccessToken({
      id: user.id,
      role: user.role,
      login: user.login
    });

    await auditService.logEvent({
      userId: user.id,
      actionType: 'AUTH_LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: user.id,
      details: {
        role: user.role
      }
    });

    return {
      token,
      tokenType: 'Bearer',
      user: mapUser(user)
    };
  }

  async me(userId) {
    const user = await User.findByPk(userId, {
      attributes: SAFE_USER_ATTRIBUTES
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DISABLED');
    }

    return mapUser(user);
  }

  async changeMyPassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('currentPassword and newPassword are required');
    }
    if (String(newPassword).length < 6) {
      throw AppError.badRequest('newPassword must be at least 6 characters');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    if (!user.is_active) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DISABLED');
    }

    const ok = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!ok) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    const { sequelize } = require('../../db/models');
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    return sequelize.transaction(async (transaction) => {
      await user.update({ password_hash: passwordHash }, { transaction });

      await auditService.logEvent(
        {
          userId,
          actionType: 'USER_PASSWORD_CHANGED',
          entityType: 'user',
          entityId: userId,
          details: { selfChange: true }
        },
        { transaction }
      );

      return { ok: true };
    });
  }

  async updateMyProfile(userId, payload) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    if (!user.is_active) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DISABLED');
    }

    const patch = {};
    if (payload.fullName !== undefined) {
      const trimmed = String(payload.fullName).trim();
      if (!trimmed) throw AppError.badRequest('fullName must not be empty');
      patch.full_name = trimmed;
    }
    if (payload.phone !== undefined) {
      patch.phone = payload.phone ? String(payload.phone).trim() : null;
    }

    if (Object.keys(patch).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    const { sequelize } = require('../../db/models');
    return sequelize.transaction(async (transaction) => {
      await user.update(patch, { transaction });
      await auditService.logEvent(
        {
          userId,
          actionType: 'USER_UPDATED',
          entityType: 'user',
          entityId: userId,
          details: { selfUpdate: true, changedFields: Object.keys(patch) }
        },
        { transaction }
      );
      return mapUser(user);
    });
  }

  async logout() {
    return { ok: true };
  }
}

module.exports = new AuthService();
