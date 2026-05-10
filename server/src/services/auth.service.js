const bcrypt = require('bcryptjs');
const { User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const { signAccessToken } = require('../utils/jwt');

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

  async logout() {
    return { ok: true };
  }
}

module.exports = new AuthService();
