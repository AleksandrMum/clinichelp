import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLE_LABELS } from '../../auth/roles'
import { getMe, changeMyPassword, updateMyProfile } from '../../services/auth'

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const title = user?.role === 'doctor' ? 'Настройки врача' : 'Настройки пользователя'
  const subtitle =
    user?.role === 'doctor'
      ? 'Личный раздел врача: профиль, изображение и пароль.'
      : 'Личный раздел для каждого сотрудника: данные профиля, изображение и смена пароля.'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [login, setLogin] = useState('')
  const [role, setRole] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    repeatPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [avatarName, setAvatarName] = useState('avatar-default.png')
  const [avatarMessage, setAvatarMessage] = useState('')

  const avatarInitial = useMemo(() => {
    const name = fullName || user?.fullName || ''
    return name.slice(0, 1).toUpperCase() || '?'
  }, [fullName, user?.fullName])

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)

    getMe()
      .then((env) => {
        if (cancelled) return
        const u = env.data
        if (u) {
          setFullName(u.full_name ?? u.fullName ?? '')
          setPhone(u.phone ?? '')
          setLogin(u.login ?? u.username ?? '')
          setRole(u.role ?? '')
        }
      })
      .catch(() => {
        if (cancelled) return
        setFullName(user?.fullName ?? '')
        setPhone(user?.phone ?? '')
        setLogin(user?.username ?? '')
        setRole(user?.role ?? '')
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.fullName, user?.phone, user?.username, user?.role])

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileMessage('')
    setProfileError('')

    if (!user?.id) {
      setProfileError('Невозможно определить текущего пользователя.')
      return
    }

    setProfileSaving(true)
    try {
      const env = await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      })
      if (env?.error) {
        setProfileError(env.error.message || 'Не удалось сохранить')
      } else {
        setProfileMessage('Данные профиля сохранены.')
        await refreshUser()
      }
    } catch (err) {
      setProfileError(extractApiError(err))
    } finally {
      setProfileSaving(false)
    }
  }

  function onPasswordChange(field, value) {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (!passwordData.currentPassword) {
      setPasswordError('Введите текущий пароль.')
      return
    }

    if (!passwordData.newPassword) {
      setPasswordError('Введите новый пароль.')
      return
    }

    if (passwordData.newPassword !== passwordData.repeatPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают.')
      return
    }

    if (!user?.id) {
      setPasswordError('Невозможно определить текущего пользователя.')
      return
    }

    setPasswordSaving(true)
    try {
      const env = await changeMyPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      if (env?.error) {
        setPasswordError(env.error.message || 'Не удалось обновить пароль')
      } else {
        setPasswordMessage('Пароль обновлён.')
        setPasswordData({ currentPassword: '', newPassword: '', repeatPassword: '' })
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setPasswordError('Текущий пароль введён неверно.')
      } else {
        setPasswordError(extractApiError(err))
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarName(file.name)
    setAvatarMessage('Изображение профиля выбрано.')
  }

  function clearAvatar() {
    setAvatarName('avatar-default.png')
    setAvatarMessage('Стандартное изображение установлено.')
  }

  return (
    <section className="content-card admin-page">
      <h1>{title}</h1>
      <p>{subtitle}</p>

      <div className="admin-grid">
        <article className="admin-panel">
          <h2>Данные профиля</h2>
          {profileLoading ? (
            <p className="panel-muted">Загрузка…</p>
          ) : (
            <form className="form-grid" onSubmit={handleProfileSubmit}>
              <label>
                ФИО
                <input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    setProfileMessage('')
                  }}
                />
              </label>

              <label>
                Логин
                <input value={login} readOnly />
              </label>

              <label>
                Роль
                <input value={ROLE_LABELS[role] || role} readOnly />
              </label>

              <label>
                Телефон
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setProfileMessage('')
                  }}
                  placeholder="+7 (900) 000-00-00"
                />
              </label>

              <div className="button-row">
                <button type="submit" disabled={profileSaving}>
                  {profileSaving ? 'Сохранение…' : 'Сохранить данные'}
                </button>
              </div>
            </form>
          )}
          {profileError ? <p className="error-text">{profileError}</p> : null}
          {profileMessage ? <p className="panel-feedback">{profileMessage}</p> : null}
        </article>

        <article className="admin-panel">
          <h2>Изображение профиля</h2>
          <div className="avatar-preview" aria-hidden>
            {avatarInitial}
          </div>
          <p className="item-subtitle">Текущий файл: {avatarName}</p>

          <div className="form-grid">
            <label>
              Выбрать новое изображение
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={clearAvatar}>
                Сбросить изображение
              </button>
            </div>
          </div>
          {avatarMessage ? <p className="panel-feedback">{avatarMessage}</p> : null}
        </article>
      </div>

      <article className="admin-panel admin-panel-spaced">
        <h2>Смена пароля</h2>
        <form className="form-grid" onSubmit={handlePasswordSubmit}>
          <label>
            Текущий пароль
            <input
              type="password"
              autoComplete="current-password"
              value={passwordData.currentPassword}
              onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
            />
          </label>

          <label>
            Новый пароль
            <input
              type="password"
              autoComplete="new-password"
              value={passwordData.newPassword}
              onChange={(e) => onPasswordChange('newPassword', e.target.value)}
            />
          </label>

          <label>
            Повторите новый пароль
            <input
              type="password"
              autoComplete="new-password"
              value={passwordData.repeatPassword}
              onChange={(e) => onPasswordChange('repeatPassword', e.target.value)}
            />
          </label>

          <div className="button-row">
            <button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Обновление…' : 'Обновить пароль'}
            </button>
          </div>
        </form>
        {passwordError ? <p className="error-text">{passwordError}</p> : null}
        {passwordMessage ? <p className="panel-feedback">{passwordMessage}</p> : null}
      </article>
    </section>
  )
}
