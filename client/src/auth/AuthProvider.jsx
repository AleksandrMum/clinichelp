import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, mapApiUserToClient, postLogin, postLogout } from '../services/auth'

const AuthContext = createContext(null)

function readCachedUser() {
  if (!localStorage.getItem('token')) {
    return null
  }
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistAuth(token, clientUser) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(clientUser))
  localStorage.setItem('role', clientUser.role)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser)
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('token'))

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setAuthReady(true)
      return
    }

    getMe()
      .then((envelope) => {
        const mapped = mapApiUserToClient(envelope.data)
        setUser(mapped)
        if (mapped) {
          localStorage.setItem('user', JSON.stringify(mapped))
          localStorage.setItem('role', mapped.role)
        }
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setAuthReady(true)
      })
  }, [])

  const login = async (username, password) => {
    const envelope = await postLogin({
      login: username.trim(),
      password,
    })
    const payload = envelope?.data
    if (!payload?.token || !payload.user) {
      throw new Error('Некорректный ответ сервера при входе.')
    }
    const mapped = mapApiUserToClient(payload.user)
    persistAuth(payload.token, mapped)
    setUser(mapped)
    return mapped
  }

  const logout = async () => {
    try {
      await postLogout()
    } catch {
      // 401/403 уже обработаны в api interceptor
    } finally {
      localStorage.clear()
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      user,
      authReady,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, authReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** @see https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports */
// eslint-disable-next-line react-refresh/only-export-components -- пара Provider + hook для контекста
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
