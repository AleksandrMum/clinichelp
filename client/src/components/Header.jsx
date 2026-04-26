import { useAuth } from '../auth/AuthProvider'
import { ROLE_LABELS } from '../auth/roles'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div>
        <p className="brand">ClinicHelp</p>
        <p className="subtitle">Информационная система регистратуры</p>
      </div>

      {user && (
        <div className="header-user">
          <p>{user.fullName}</p>
          <p className="role-pill">{ROLE_LABELS[user.role]}</p>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      )}
    </header>
  )
}
