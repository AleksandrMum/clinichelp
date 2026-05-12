import api from './api'

export async function findFreeSlots({ doctorId, serviceId, from, to }) {
  const { data } = await api.get('/slots', {
    params: { doctorId, serviceId, from, to },
  })
  return data
}

export async function createAppointment(payload) {
  const { data } = await api.post('/appointments', payload, {
    skipAuthInterceptor: true,
  })
  return data
}

export async function getDailyAppointments({ date, doctorId, page, limit } = {}) {
  const params = { date }
  if (doctorId) params.doctorId = doctorId
  if (page) params.page = page
  if (limit) params.limit = limit
  const { data } = await api.get('/appointments/daily', { params })
  return data
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await api.patch(`/appointments/${id}/status`, { status })
  return data
}

export async function cancelAppointment(id, reason) {
  const { data } = await api.patch(`/appointments/${id}/cancel`, { reason })
  return data
}

export async function rescheduleAppointment(id, startAt) {
  const { data } = await api.patch(`/appointments/${id}/reschedule`, { startAt })
  return data
}
