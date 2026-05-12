import api from './api'

/** Нормализует пользователя из API (snake_case) в формат UI. */
export function mapApiUserToClient(apiUser) {
  if (!apiUser) {
    return null
  }
  return {
    id: apiUser.id,
    username: apiUser.login,
    fullName: apiUser.full_name ?? apiUser.fullName ?? '',
    role: apiUser.role,
    phone: apiUser.phone ?? null,
  }
}

export async function postLogin({ login, password }) {
  const { data } = await api.post('/auth/login', { login, password })
  return data
}

export const login = postLogin

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export const me = getMe

export async function postLogout() {
  const { data } = await api.post('/auth/logout')
  return data
}

export const logout = postLogout

export async function changeMyPassword({ currentPassword, newPassword }) {
  const { data } = await api.patch('/auth/password', { currentPassword, newPassword }, {
    skipAuthInterceptor: true,
  })
  return data
}
