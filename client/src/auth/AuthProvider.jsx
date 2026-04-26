import { createContext, useContext, useMemo, useState } from 'react'
import { ROLES } from './roles'

const STORAGE_KEY = 'clinichelp.auth'

const MOCK_USERS = {
  admin: {
    username: 'admin',
    password: 'admin',
    role: ROLES.ADMIN,
    fullName: 'Системный администратор',
  },
  doctor: {
    username: 'doctor',
    password: 'doctor',
    role: ROLES.DOCTOR,
    fullName: 'Дежурный врач',
  },
  manager: {
    username: 'manager',
    password: 'manager',
    role: ROLES.MANAGER,
    fullName: 'Менеджер регистратуры',
  },
}

const AuthContext = createContext(null)

function getInitialUser() {
  const raw = sessionStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  const login = (username, password) => {
    const normalized = username.trim().toLowerCase()
    const candidate = MOCK_USERS[normalized]

    if (!candidate || candidate.password !== password) {
      return null
    }

    const safeUser = {
      username: candidate.username,
      fullName: candidate.fullName,
      role: candidate.role,
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser))
    setUser(safeUser)
    return safeUser
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
