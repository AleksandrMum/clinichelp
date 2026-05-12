import api from './api'

export async function searchPatients({ search, page, limit } = {}) {
  const params = {}
  if (search) params.search = search
  if (page) params.page = page
  if (limit) params.limit = limit
  const { data } = await api.get('/patients', { params })
  return data
}

export async function getPatientById(id) {
  const { data } = await api.get(`/patients/${id}`)
  return data
}

export async function getPatientAppointments(id, { mode, page, limit } = {}) {
  const params = {}
  if (mode) params.mode = mode
  if (page) params.page = page
  if (limit) params.limit = limit
  const { data } = await api.get(`/patients/${id}/appointments`, { params })
  return data
}

export async function createPatient(payload) {
  const { data } = await api.post('/patients', payload)
  return data
}
