import { useEffect, useMemo, useState } from 'react'
// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { BRANCHES, USERS, INITIAL_BRANCH, INITIAL_ASSIGNMENT } from '../TEMP/adminClinicMocks'

function getUserId(user) {
  return user.id
}

function getUserName(user) {
  return user.name
}

function SearchableAutocompleteField({
  label,
  placeholder,
  emptyText,
  items,
  selectedValue,
  getItemValue,
  getItemLabel,
  onSelect,
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const selectedItem = useMemo(
    () => items.find((item) => getItemValue(item) === selectedValue) || null,
    [getItemValue, items, selectedValue],
  )

  useEffect(() => {
    setQuery(selectedItem ? getItemLabel(selectedItem) : '')
  }, [getItemLabel, selectedItem, selectedValue])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return items
    }

    const matchedItems = items.filter((item) =>
      getItemLabel(item).toLowerCase().includes(normalizedQuery),
    )

    if (
      selectedItem &&
      !matchedItems.some((item) => getItemValue(item) === getItemValue(selectedItem))
    ) {
      return [selectedItem, ...matchedItems]
    }

    return matchedItems
  }, [getItemLabel, getItemValue, items, query, selectedItem])

  function handlePick(item) {
    onSelect(item)
    setQuery(getItemLabel(item))
    setIsOpen(false)
    setHoveredIndex(-1)
  }

  return (
    <label className="autocomplete-field">
      {label ? <span>{label}</span> : null}
      <div className="autocomplete-root">
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
            setHoveredIndex(-1)
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />

        {isOpen ? (
          <ul className="autocomplete-menu" role="listbox">
            {filteredItems.length ? (
              filteredItems.map((item, index) => (
                <li key={getItemValue(item)}>
                  <button
                    type="button"
                    className={index === hoveredIndex ? 'autocomplete-option active' : 'autocomplete-option'}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(-1)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handlePick(item)
                    }}
                  >
                    {getItemLabel(item)}
                  </button>
                </li>
              ))
            ) : (
              <li className="autocomplete-empty">{emptyText}</li>
            )}
          </ul>
        ) : null}
      </div>
    </label>
  )
}

function SearchableUserList({ items, selectedUsers, onToggle }) {
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((user) => {
      if (!normalizedQuery) {
        return true
      }

      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.role.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [items, query])

  return (
    <div className="distribution-search">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск сотрудников"
        autoComplete="off"
      />
      <div className="distribution-list distribution-list-scroll">
        {filteredItems.length ? (
          filteredItems.map((user) => (
            <label key={user.id} className="distribution-option">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => onToggle(user.id)}
              />
              <span>
                <strong>{user.name}</strong>
                <br />
                <span>{user.role}</span>
              </span>
            </label>
          ))
        ) : (
          <p className="panel-muted">Пользователи не найдены.</p>
        )}
      </div>
    </div>
  )
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
  const sortedUsers = useMemo(
    () => [...USERS].sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [],
  )
  const managerOptions = useMemo(
    () =>
      sortedUsers.filter(
        (user) => user.role === 'Менеджер' || user.role === 'Администратор',
      ),
    [sortedUsers],
  )

  function updateBranchField(field, value) {
    setBranchForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCreateBranch(event) {
    event.preventDefault()
    setBranchMessage('Филиал добавлен.')
    setBranchForm(INITIAL_BRANCH)
  }

  function handleAttachUser(event) {
    event.preventDefault()
    if (distributionMode) {
      setAssignmentMessage('Выбранные сотрудники привязаны к филиалу.')
      setDistributionMode(false)
      return
    }

    setAssignmentMessage('Пользователь прикреплен к филиалу.')
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
    setBranchMessage(`Филиал ${branchName} закрыт.`)
  }

  function handleEditBranchSubmit(event) {
    event.preventDefault()
    setBranchMessage('Изменения сохранены.')
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
                <SearchableUserList items={sortedUsers} selectedUsers={selectedUsers} onToggle={toggleSelectedUser} />
              </div>
            ) : (
              <SearchableAutocompleteField
                label="Пользователь"
                placeholder="Поиск по имени"
                emptyText="Пользователь не найден"
                items={sortedUsers}
                selectedValue={assignmentForm.user}
                getItemValue={getUserId}
                getItemLabel={getUserName}
                onSelect={(user) =>
                  setAssignmentForm((prev) => ({ ...prev, user: user.id }))
                }
              />
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

              <SearchableAutocompleteField
                label="Ответственный менеджер"
                placeholder="Поиск менеджера"
                emptyText="Менеджер не найден"
                items={managerOptions}
                selectedValue={branchEditForm.manager}
                getItemValue={getUserName}
                getItemLabel={getUserName}
                onSelect={(user) =>
                  setBranchEditForm((prev) => ({ ...prev, manager: user.name }))
                }
              />

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
