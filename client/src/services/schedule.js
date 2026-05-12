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
