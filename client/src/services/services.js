import api from './api'

export async function listServices({ isAvailable, page, limit } = {}) {
  const params = {}
  if (isAvailable !== undefined) params.isAvailable = isAvailable
  if (page) params.page = page
  if (limit) params.limit = limit
  const { data } = await api.get('/services', { params })
  return data
}

export async function getServiceById(id) {
  const { data } = await api.get(`/services/${id}`)
  return data
}

export async function createService(payload) {
  const { data } = await api.post('/services', payload)
  return data
}

export async function updateService(id, payload) {
  const { data } = await api.patch(`/services/${id}`, payload)
  return data
}

export async function deactivateService(id) {
  const { data } = await api.patch(`/services/${id}/deactivate`)
  return data
}
