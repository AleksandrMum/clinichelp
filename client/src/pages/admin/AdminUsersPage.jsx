import { useState } from 'react'

const MOCK_USERS = [
  {
    id: 'u-101',
    fullName: 'Иванова Марина Павловна',
    username: 'm.ivanova',
    role: 'Менеджер',
    branch: 'Филиал на Ленина, 8',
    status: 'Активен',
  },
  {
    id: 'u-102',
    fullName: 'Смирнов Артем Игоревич',
    username: 'a.smirnov',
    role: 'Врач',
    branch: 'Филиал на Гагарина, 14',
    status: 'Активен',
  },
  {
    id: 'u-103',
    fullName: 'Зайцева Ольга Николаевна',
    username: 'o.zaytseva',
    role: 'Администратор',
    branch: 'Центральный филиал',
    blocked: true,
  },
]

const INITIAL_FORM = {
  fullName: '',
  username: '',
  role: 'manager',
  phone: '+7',
  email: '',
  branch: 'main',
  department: '',
  position: '',
  note: '',
}

export function AdminUsersPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [showBlockedUsers, setShowBlockedUsers] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [modalData, setModalData] = useState({ login: '', tempPassword: '' })
  const [createMessage, setCreateMessage] = useState('')
  const [listMessage, setListMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const login = form.username.trim() || 'new.user'
    const tempPassword = `TMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    setCreateMessage('Пользователь добавлен в режим заглушки.')
    setModalData({ login, tempPassword })
    setIsPasswordModalOpen(true)
    setForm(INITIAL_FORM)
  }

  function handleUserAction(message) {
    setListMessage(message)
  }

  const activeUsers = MOCK_USERS.filter((item) => !item.blocked)
  const blockedUsers = MOCK_USERS.filter((item) => item.blocked)
  const filteredActiveUsers = activeUsers.filter((u) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      u.fullName.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q))
    )
  })

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
        {createMessage ? <p className="panel-feedback">{createMessage}</p> : null}
      </article>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <input
          placeholder="Поиск по ФИО"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.45rem 0.6rem', borderRadius: '0.45rem', border: '1px solid #cdd5e3' }}
        />
      </div>

      <div className="users-board admin-grid-top-margin">
              {filteredActiveUsers.length === 0 ? (
                <p className="panel-muted">Ничего не найдено по запросу.</p>
              ) : null}
        <article className="admin-panel users-column">
          <div className="panel-header-row">
            <h2>Список сотрудников</h2>
          </div>
          <div className="admin-list">
            {activeUsers.map((item) => (
              <div key={item.id} className="admin-list-item">
                <div>
                  <p className="item-title">{item.fullName}</p>
                  <p className="item-subtitle">{item.role} • {item.branch}</p>
                  <p className="item-subtitle">Логин: {item.username}</p>
                </div>
                <div className="item-actions">
                  <button type="button" className="button-secondary" onClick={() => handleUserAction(`Права пользователя ${item.fullName} изменены в режиме заглушки.`)}>
                    Изменить права
                  </button>
                  <button type="button" className="button-secondary" onClick={() => handleUserAction(`Пользователь ${item.fullName} заблокирован в режиме заглушки.`)}>
                    Заблокировать
                  </button>
                </div>
              </div>
            ))}
          </div>
          {listMessage ? <p className="panel-feedback">{listMessage}</p> : null}
        </article>

        <article className="admin-panel users-column blocked-column">
          <div className="panel-header-row">
            <h2>Заблокированные сотрудники</h2>
          </div>
            <button type="button" className="text-button" onClick={() => { setShowBlockedUsers((prev) => !prev); setListMessage('') }}>
              {showBlockedUsers ? 'Скрыть заблокированных пользователей' : 'Отобразить заблокированных пользователей'}
            </button>
          {showBlockedUsers ? (
            <div className="admin-list">
              {blockedUsers.map((item) => (
                <div key={item.id} className="admin-list-item blocked-item">
                  <div>
                    <p className="item-title">{item.fullName}</p>
                    <p className="item-subtitle">{item.role} • {item.branch}</p>
                    <p className="item-subtitle">Логин: {item.username}</p>
                    <p className="item-subtitle blocked-label">Заблокирован</p>
                  </div>
                  <div className="item-actions">
                    <button type="button" className="button-secondary" onClick={() => handleUserAction(`Пользователь ${item.fullName} разблокирован в режиме заглушки.`)}>
                      Разблокировать
                    </button>
                  </div>
                </div>
              ))}
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
            <p>Временный пароль: {modalData.tempPassword}</p>
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
