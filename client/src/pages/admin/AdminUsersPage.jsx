import { useCallback, useEffect, useState } from 'react'
import { ROLE_LABELS } from '../../auth/roles'
import { createUser, deactivateUser, getUsers, updateUser } from '../../services/users'

const INITIAL_FORM = {
  fullName: '',
  username: '',
  password: '',
  role: 'manager',
  phone: '+7',
  email: '',
  branch: 'main',
  department: '',
  position: '',
  note: '',
}

function formatPhoneForApi(value) {
  const p = value?.trim()
  if (!p || p === '+7') {
    return null
  }
  return p
}

export function AdminUsersPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [showBlockedUsers, setShowBlockedUsers] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [modalData, setModalData] = useState({ login: '', password: '' })
  const [createMessage, setCreateMessage] = useState('')
  const [createError, setCreateError] = useState('')
  const [listMessage, setListMessage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [activeUsers, setActiveUsers] = useState([])
  const [activeMeta, setActiveMeta] = useState(null)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [blockedLoading, setBlockedLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [blockedError, setBlockedError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 350)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const loadActiveUsers = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const env = await getUsers({
        isActive: true,
        search: debouncedSearch || undefined,
        limit: 100,
        page: 1,
      })
      if (env?.error) {
        setListError(env.error.message || 'Не удалось загрузить список')
        setActiveUsers([])
        setActiveMeta(null)
        return
      }
      setActiveUsers(Array.isArray(env.data) ? env.data : [])
      setActiveMeta(env.meta ?? null)
    } catch (err) {
      setListError(err.response?.data?.error?.message || 'Не удалось загрузить список')
      setActiveUsers([])
      setActiveMeta(null)
    } finally {
      setListLoading(false)
    }
  }, [debouncedSearch])

  const loadBlockedUsers = useCallback(async () => {
    setBlockedLoading(true)
    setBlockedError('')
    try {
      const env = await getUsers({
        isActive: false,
        search: debouncedSearch || undefined,
        limit: 100,
        page: 1,
      })
      if (env?.error) {
        setBlockedError(env.error.message || 'Не удалось загрузить список')
        setBlockedUsers([])
        return
      }
      setBlockedUsers(Array.isArray(env.data) ? env.data : [])
    } catch (err) {
      setBlockedError(err.response?.data?.error?.message || 'Не удалось загрузить список')
      setBlockedUsers([])
    } finally {
      setBlockedLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadActiveUsers()
  }, [loadActiveUsers])

  useEffect(() => {
    if (!showBlockedUsers) {
      return
    }
    loadBlockedUsers()
  }, [showBlockedUsers, loadBlockedUsers])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setCreateError('')
    setCreateMessage('')

    if (!form.password?.trim()) {
      setCreateError('Укажите пароль для новой учётной записи.')
      return
    }

    const passwordPlain = form.password

    try {
      const env = await createUser({
        fullName: form.fullName.trim(),
        login: form.username.trim(),
        password: passwordPlain,
        role: form.role,
        phone: formatPhoneForApi(form.phone),
      })
      if (env?.error) {
        setCreateError(env.error.message || 'Не удалось создать пользователя')
        return
      }
      const created = env.data
      if (!created?.login) {
        setCreateError('Некорректный ответ сервера.')
        return
      }
      setCreateMessage('Пользователь создан.')
      setModalData({ login: created.login, password: passwordPlain })
      setIsPasswordModalOpen(true)
      setForm(INITIAL_FORM)
      await loadActiveUsers()
    } catch (err) {
      setCreateError(err.response?.data?.error?.message || err.message || 'Не удалось создать пользователя')
    }
  }

  function handleUserAction(message) {
    setListMessage(message)
    setActionError('')
  }

  async function handleDeactivate(item) {
    setActionError('')
    setListMessage('')
    try {
      const env = await deactivateUser(item.id)
      if (env?.error) {
        setActionError(env.error.message || 'Не удалось деактивировать')
        return
      }
      setListMessage(`Сотрудник ${item.full_name} деактивирован.`)
      await loadActiveUsers()
      if (showBlockedUsers) {
        await loadBlockedUsers()
      }
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Не удалось деактивировать')
    }
  }

  async function handleUnblock(item) {
    setActionError('')
    setListMessage('')
    try {
      const env = await updateUser(item.id, { isActive: true })
      if (env?.error) {
        setActionError(env.error.message || 'Не удалось восстановить доступ')
        return
      }
      setListMessage(`Пользователь ${item.full_name} снова активен.`)
      await loadActiveUsers()
      await loadBlockedUsers()
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Не удалось восстановить доступ')
    }
  }

  const activeTotal = activeMeta?.total ?? activeUsers.length
  const shownActive = activeUsers.length

  return (
    <section className="content-card admin-page">
      <h1>Управление пользователями</h1>
      <p>
        Каркас для администратора: создание учетной записи, просмотр текущих сотрудников и
        псевдо-команды управления.
      </p>

      <article className="admin-panel admin-panel-full">
        <h2>Создание пользователя</h2>
        <form className="form-grid form-grid-two-col" onSubmit={handleSubmit}>
          <label>
            ФИО
            <input
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              placeholder="Например, Петрова Анна Сергеевна"
              required
            />
          </label>

          <label>
            Логин
            <input
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              placeholder="a.petrova"
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Задайте начальный пароль"
              required
            />
          </label>

          <label>
            Роль
            <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="manager">Менеджер</option>
              <option value="doctor">Врач</option>
              <option value="admin">Администратор</option>
            </select>
          </label>

          <label>
            Основной филиал
            <select
              value={form.branch}
              onChange={(event) => updateField('branch', event.target.value)}
            >
              <option value="main">Центральный филиал</option>
              <option value="lenina">Филиал на Ленина, 8</option>
              <option value="gagarina">Филиал на Гагарина, 14</option>
            </select>
          </label>

          <label>
            Телефон
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="mail@clinichelp.ru"
            />
          </label>

          <label>
            Должность
            <input
              value={form.position}
              onChange={(event) => updateField('position', event.target.value)}
              placeholder="Старший администратор"
            />
          </label>

          <div className="button-row form-span-2">
            <button type="submit">Создать пользователя</button>
          </div>
        </form>
        {createError ? <p className="error-text">{createError}</p> : null}
        {createMessage ? <p className="panel-feedback">{createMessage}</p> : null}
      </article>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }} />

      <div className="users-board admin-grid-top-margin">
        <article className="admin-panel users-column">
          <div className="panel-header-row">
            <h2>Список сотрудников</h2>
            <input
              placeholder="Поиск по ФИО"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ padding: '0.45rem 0.6rem', borderRadius: '0.45rem', border: '1px solid #cdd5e3' }}
            />
          </div>
          {listError ? <p className="error-text">{listError}</p> : null}
          {actionError ? <p className="error-text">{actionError}</p> : null}
          <div className="panel-header-row" style={{ marginTop: '0.35rem' }}>
            <span className="panel-muted">
              Показано: {listLoading ? '…' : `${shownActive} из ${activeTotal}`}
            </span>
          </div>
          <div className="admin-list">
            {listLoading ? (
              <p className="panel-muted">Загрузка…</p>
            ) : activeUsers.length ? (
              activeUsers.map((item) => (
                <div key={item.id} className="admin-list-item">
                  <div>
                    <p className="item-title">{item.full_name}</p>
                    <p className="item-subtitle">
                      {ROLE_LABELS[item.role] || item.role} • {item.phone || '—'}
                    </p>
                    <p className="item-subtitle">Логин: {item.login}</p>
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() =>
                        handleUserAction('Изменение прав в этом экране пока не подключено к API.')
                      }
                    >
                      Изменить права
                    </button>
                    <button type="button" className="button-secondary" onClick={() => handleDeactivate(item)}>
                      Заблокировать
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="panel-muted">Ничего не найдено по запросу.</p>
            )}
          </div>
          {listMessage ? <p className="panel-feedback">{listMessage}</p> : null}
        </article>

        <article className="admin-panel users-column blocked-column">
          <div className="panel-header-row">
            <h2>Заблокированные сотрудники</h2>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setShowBlockedUsers((prev) => !prev)
              setListMessage('')
              setActionError('')
            }}
          >
            {showBlockedUsers ? 'Скрыть заблокированных пользователей' : 'Отобразить заблокированных пользователей'}
          </button>
          {showBlockedUsers ? (
            <div className="admin-list">
              {blockedError ? <p className="error-text">{blockedError}</p> : null}
              {blockedLoading ? (
                <p className="panel-muted">Загрузка…</p>
              ) : blockedUsers.length ? (
                blockedUsers.map((item) => (
                  <div key={item.id} className="admin-list-item blocked-item">
                    <div>
                      <p className="item-title">{item.full_name}</p>
                      <p className="item-subtitle">
                        {ROLE_LABELS[item.role] || item.role} • {item.phone || '—'}
                      </p>
                      <p className="item-subtitle">Логин: {item.login}</p>
                      <p className="item-subtitle blocked-label">Заблокирован</p>
                    </div>
                    <div className="item-actions">
                      <button type="button" className="button-secondary" onClick={() => handleUnblock(item)}>
                        Разблокировать
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="panel-muted">Нет деактивированных пользователей.</p>
              )}
            </div>
          ) : (
            <p className="panel-muted">Нажмите кнопку слева, чтобы показать заблокированных сотрудников.</p>
          )}
        </article>
      </div>

      {isPasswordModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Пользователь создан">
            <h2>Пользователь создан</h2>
            <p>Логин: {modalData.login}</p>
            <p>Пароль: {modalData.password}</p>
            <p className="panel-muted" style={{ fontSize: '0.9rem' }}>
              Сообщите эти данные пользователю и попросите сменить пароль после первого входа.
            </p>
            <div className="button-row">
              <button type="button" onClick={() => setIsPasswordModalOpen(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
