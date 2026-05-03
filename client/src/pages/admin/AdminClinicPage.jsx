import { useState } from 'react'

const BRANCHES = [
  {
    id: 'b-1',
    name: 'Филиал на Октябрьской',
    address: 'ул. Октябрьска, 145',
    phone: '+7 (900) 000-00-01',
    schedule: '08:00 - 20:00',
    manager: 'Зайцева Ольга Николаевна',
  },
  {
    id: 'b-2',
    name: 'Филиал на Глушко',
    address: 'ул. Антона Глушко, 42',
    phone: '+7 (900) 000-00-02',
    schedule: '09:00 - 21:00',
    manager: 'Иванова Марина Павловна',
  },
]

const USERS = [
  { id: 'u-101', name: 'Иванова Марина Павловна', role: 'Менеджер' },
  { id: 'u-102', name: 'Смирнов Артем Игоревич', role: 'Врач' },
  { id: 'u-103', name: 'Зайцева Ольга Николаевна', role: 'Администратор' },
  { id: 'u-104', name: 'Кузнецов Павел Андреевич', role: 'Врач' },
]

const INITIAL_BRANCH = {
  name: '',
  address: '',
  phone: '+7',
  schedule: '09:00 - 18:00',
}

const INITIAL_ASSIGNMENT = {
  user: 'u-101',
  branch: 'b-1',
}

export function AdminClinicPage() {
  const [branchForm, setBranchForm] = useState(INITIAL_BRANCH)
  const [assignmentForm, setAssignmentForm] = useState(INITIAL_ASSIGNMENT)
  const [distributionMode, setDistributionMode] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState(['u-101', 'u-102'])
  const [branchMessage, setBranchMessage] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [branchEditForm, setBranchEditForm] = useState(BRANCHES[0])
  const managerOptions = USERS.filter((user) => user.role === 'Менеджер' || user.role === 'Администратор')

  function updateBranchField(field, value) {
    setBranchForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCreateBranch(event) {
    event.preventDefault()
    setBranchMessage('Новый филиал добавлен в режим заглушки.')
    setBranchForm(INITIAL_BRANCH)
  }

  function handleAttachUser(event) {
    event.preventDefault()
    if (distributionMode) {
      setAssignmentMessage('Выбранные сотрудники привязаны к филиалу в режиме заглушки.')
      setDistributionMode(false)
      return
    }

    setAssignmentMessage('Пользователь прикреплен к филиалу в режиме заглушки.')
    setAssignmentForm(INITIAL_ASSIGNMENT)
  }

  function toggleDistributionMode() {
    setDistributionMode((prev) => !prev)
    setAssignmentMessage('')
  }

  function openEditBranchModal(branch) {
    setBranchEditForm(branch)
    setIsEditModalOpen(true)
    setBranchMessage('')
  }

  function handleCloseBranch(branchName) {
    setBranchMessage(`Филиал ${branchName} отмечен как закрытый в режиме заглушки.`)
  }

  function handleEditBranchSubmit(event) {
    event.preventDefault()
    setBranchMessage('Изменения филиала сохранены в режиме заглушки.')
    setIsEditModalOpen(false)
  }

  function toggleSelectedUser(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((item) => item !== userId) : [...prev, userId],
    )
  }

  return (
    <section className="content-card admin-page">
      <h1>Управление клиникой</h1>
      <p>
        Раздел администратора для филиалов: создание карточек филиалов и прикрепление
        сотрудников к площадкам.
      </p>

      <article className="admin-panel">
        <h2>Текущие филиалы</h2>
        <div className="admin-list">
          {BRANCHES.map((branch) => (
            <div key={branch.id} className="admin-list-item">
              <div>
                <p className="item-title">{branch.name}</p>
                <p className="item-subtitle">{branch.address}</p>
                <p className="item-subtitle">
                  {branch.phone} • {branch.schedule}
                </p>
                <p className="item-subtitle">Ответственный: {branch.manager}</p>
              </div>
              <div className="item-actions">
                <button type="button" className="button-secondary" onClick={() => openEditBranchModal(branch)}>
                  Изменить
                </button>
                <button type="button" className="button-secondary" onClick={() => handleCloseBranch(branch.name)}>
                  Закрыть филиал
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="admin-grid">
        <article className="admin-panel">
          <h2>Добавить филиал</h2>
          <form className="form-grid" onSubmit={handleCreateBranch}>
            <label>
              Название филиала
              <input
                value={branchForm.name}
                onChange={(event) => updateBranchField('name', event.target.value)}
                placeholder="Южный филиал"
                required
              />
            </label>

            <label>
              Адрес
              <input
                value={branchForm.address}
                onChange={(event) => updateBranchField('address', event.target.value)}
                placeholder="г. Таганрог, ул. Примерная, 12"
                required
              />
            </label>

            <label>
              Телефон
              <input
                value={branchForm.phone}
                onChange={(event) => updateBranchField('phone', event.target.value)}
              />
            </label>

            <label>
              График работы
              <input
                value={branchForm.schedule}
                onChange={(event) => updateBranchField('schedule', event.target.value)}
              />
            </label>

            <div className="button-row">
              <button type="submit">Сохранить филиал</button>
            </div>
          </form>
          {branchMessage ? <p className="panel-feedback">{branchMessage}</p> : null}
        </article>

        <article className="admin-panel">
          <h2>Прикрепление сотрудников</h2>
          <form className="form-grid" onSubmit={handleAttachUser}>
            <label>
              Филиал
              <select
                value={assignmentForm.branch}
                onChange={(event) =>
                  setAssignmentForm((prev) => ({ ...prev, branch: event.target.value }))
                }
              >
                <option value="b-1">Центральный филиал</option>
                <option value="b-2">Филиал на Ленина, 8</option>
                <option value="b-3">Филиал на Гагарина, 14</option>
              </select>
            </label>

            {distributionMode ? (
              <div className="distribution-box">
                <p className="item-subtitle">Выберите нескольких сотрудников и привяжите их к филиалу.</p>
                <div className="distribution-list">
                  {USERS.map((user) => (
                    <label key={user.id} className="distribution-option">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectedUser(user.id)}
                      />
                      <span>
                        <strong>{user.name}</strong>
                        <br />
                        <span>{user.role}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <label>
                Пользователь
                <select
                  value={assignmentForm.user}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, user: event.target.value }))
                  }
                >
                  {USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="button-row">
              <button type="submit">
                {distributionMode ? 'Привязать выбранных' : 'Прикрепить пользователя'}
              </button>
              <button type="button" className="button-secondary" onClick={toggleDistributionMode}>
                Массовое распределение
              </button>
            </div>
          </form>
          {assignmentMessage ? <p className="panel-feedback">{assignmentMessage}</p> : null}
        </article>
      </div>

      {isEditModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Редактирование филиала" onClick={(event) => event.stopPropagation()}>
            <h2>Изменить филиал</h2>
            <form className="form-grid" onSubmit={handleEditBranchSubmit}>
              <label>
                Название филиала
                <input
                  value={branchEditForm.name}
                  onChange={(event) => setBranchEditForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>

              <label>
                Адрес
                <input
                  value={branchEditForm.address}
                  onChange={(event) => setBranchEditForm((prev) => ({ ...prev, address: event.target.value }))}
                />
              </label>

              <label>
                Ответственный менеджер
                <select
                  value={branchEditForm.manager}
                  onChange={(event) => setBranchEditForm((prev) => ({ ...prev, manager: event.target.value }))}
                >
                  {managerOptions.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="button-row">
                <button type="submit">Сохранить изменения</button>
                <button type="button" className="button-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
