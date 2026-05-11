import api from './api'

/**
 * @param {Record<string, string | number | boolean | undefined>} params role, search, isActive, page, limit
 * @returns {Promise<{ data: unknown, meta: unknown, error: unknown }>}
 */
export async function getUsers(params = {}) {
  const { data } = await api.get('/users', { params })
  return data
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload)
  return data
}

export async function changeUserPassword(id, newPassword) {
  const { data } = await api.patch(`/users/${id}/password`, { newPassword })
  return data
}

export async function deactivateUser(id) {
  const { data } = await api.patch(`/users/${id}/deactivate`)
  return data
}
