import api from './api'

/**
 * Журнал аудита (admin). Все параметры опциональны, кроме тех что передаёте явно.
 *
 * @param {object} [params]
 * @param {string} [params.dateFrom] Начало периода (date-time, ISO или datetime-local)
 * @param {string} [params.dateTo] Конец периода
 * @param {string} [params.userId] UUID пользователя-инициатора
 * @param {string} [params.actionType] Код действия (например USER_CREATED)
 * @param {string} [params.entityType] Тип сущности (например appointment)
 * @param {string} [params.entityId] UUID сущности
 * @param {number} [params.page] Номер страницы (с 1)
 * @param {number} [params.limit] Размер страницы
 * @returns {Promise<{ data: unknown, meta: unknown, error: unknown }>}
 */
export async function getAudit(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
  const { data } = await api.get('/audit', { params: cleaned })
  return data
}
