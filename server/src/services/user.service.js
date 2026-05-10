/**
 * UserService — пользователи системы (только admin по бизнес-правилам).
 *
 * Будущие методы:
 * - listUsers(filters, pagination)
 * - getUserById(id)
 * - createUser(payload) — хеширование пароля, роль
 * - updateUser(id, payload)
 * - changePassword(id, newPassword)
 * - deactivateUser(id) — is_active + deactivated_at
 */
class UserService {}

module.exports = new UserService();
