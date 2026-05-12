import api from './api'

export async function getDoctorScheduleView(doctorId, { from, to }) {
  const { data } = await api.get(`/schedule/doctors/${doctorId}/view`, {
    params: { from, to },
  })
  return data
}

export async function getDoctorAppointments(doctorId, { from, to, status, page, limit } = {}) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  if (status) params.status = status
  if (page) params.page = page
  if (limit) params.limit = limit
  const { data } = await api.get(`/appointments/doctors/${doctorId}`, { params })
  return data
}

export async function getDoctorRules(doctorId) {
  const { data } = await api.get(`/schedule/doctors/${doctorId}/rules`)
  return data
}

export async function replaceDoctorRules(doctorId, rules) {
  const { data } = await api.put(`/schedule/doctors/${doctorId}/rules`, { rules })
  return data
}

export async function getDoctorExceptions(doctorId, { from, to, includeArchived } = {}) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  if (includeArchived) params.includeArchived = true
  const { data } = await api.get(`/schedule/doctors/${doctorId}/exceptions`, { params })
  return data
}

export async function createException(payload) {
  const { data } = await api.post('/schedule/exceptions', payload)
  return data
}

export async function updateException(id, payload) {
  const { data } = await api.patch(`/schedule/exceptions/${id}`, payload)
  return data
}

export async function archiveException(id) {
  const { data } = await api.patch(`/schedule/exceptions/${id}/archive`)
  return data
}

export async function listDoctors() {
  const { data } = await api.get('/users', {
    params: { role: 'doctor', isActive: true, limit: 100 },
  })
  return data
}
