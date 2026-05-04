import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'

function toDisplayRole(role) {
  if (role === 'admin') {
    return 'Администратор'
  }

  if (role === 'doctor') {
    return 'Врач'
  }

  return 'Менеджер'
}

export function SettingsPage() {
  const { user } = useAuth()
  const title = user?.role === 'doctor' ? 'Настройки врача' : 'Настройки пользователя'
  const subtitle =
    user?.role === 'doctor'
      ? 'Личный раздел врача: профиль, изображение и пароль.'
      : 'Личный раздел для каждого сотрудника: данные профиля, изображение и смена пароля.'
  const initialProfile = useMemo(
    () => ({
      fullName: user?.fullName ?? '',
      username: user?.username ?? '',
      role: toDisplayRole(user?.role),
      phone: '+7 (900) 000-00-00',
      email: 'user@clinichelp.ru',
      notes: 'Рабочий профиль сотрудника клиники',
    }),
    [user],
  )

  const [profile, setProfile] = useState(initialProfile)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    nextPassword: '',
    repeatPassword: '',
  })
  const [avatarName, setAvatarName] = useState('avatar-default.png')
  const [profileMessage, setProfileMessage] = useState('')
  const [avatarMessage, setAvatarMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  function onProfileChange(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  function onPasswordChange(field, value) {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileMessage('Профиль обновлен в интерфейсной заглушке. Сохранение на сервер будет добавлено позже.')
  }

  function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordMessage('Пароль принят в псевдо-режиме. Реальная проверка и смена пароля будет подключена позже.')
    setPasswordData({
      currentPassword: '',
      nextPassword: '',
      repeatPassword: '',
    })
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setAvatarName(file.name)
    setAvatarMessage('Изображение выбрано в интерфейсном прототипе. Фактическая загрузка пока отключена.')
  }

  function clearAvatar() {
    setAvatarName('avatar-default.png')
    setAvatarMessage('Установлена стандартная аватарка в режиме заглушки.')
  }

  return (
    <section className="content-card admin-page">
      <h1>{title}</h1>
      <p>{subtitle}</p>

      <div className="admin-grid">
        <article className="admin-panel">
          <h2>Данные профиля</h2>
          <form className="form-grid" onSubmit={handleProfileSubmit}>
            <label>
              ФИО
              <input
                value={profile.fullName}
                onChange={(event) => onProfileChange('fullName', event.target.value)}
              />
            </label>

            <label>
              Логин
              <input
                value={profile.username}
                readOnly
                onChange={(event) => onProfileChange('username', event.target.value)}
              />
            </label>

            <label>
              Роль
              <input value={profile.role} readOnly />
            </label>

            <label>
              Телефон
              <input
                value={profile.phone}
                onChange={(event) => onProfileChange('phone', event.target.value)}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) => onProfileChange('email', event.target.value)}
              />
            </label>

            <div className="button-row">
              <button type="submit">Сохранить данные</button>
            </div>
          </form>
          {profileMessage ? <p className="panel-feedback">{profileMessage}</p> : null}
        </article>

        <article className="admin-panel">
          <h2>Изображение профиля</h2>
          <div className="avatar-preview" aria-hidden>
            {avatarName.slice(0, 1).toUpperCase()}
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
              value={passwordData.currentPassword}
              onChange={(event) => onPasswordChange('currentPassword', event.target.value)}
            />
          </label>

          <label>
            Новый пароль
            <input
              type="password"
              value={passwordData.nextPassword}
              onChange={(event) => onPasswordChange('nextPassword', event.target.value)}
            />
          </label>

          <label>
            Повторите новый пароль
            <input
              type="password"
              value={passwordData.repeatPassword}
              onChange={(event) => onPasswordChange('repeatPassword', event.target.value)}
            />
          </label>

          <div className="button-row">
            <button type="submit">Обновить пароль</button>
          </div>
        </form>
        {passwordMessage ? <p className="panel-feedback">{passwordMessage}</p> : null}
      </article>
    </section>
  )
}
