import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'
import {
  listServices,
  createService,
  updateService,
  deactivateService,
} from '../../services/services'

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

export function ManagerServicesPage() {
  const { user } = useAuth()
  const isManager = user?.role === ROLES.MANAGER

  const [services, setServices] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [showDeactivated, setShowDeactivated] = useState(false)

  const [selectedServiceId, setSelectedServiceId] = useState(null)

  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', durationMin: '', price: '' })
  const [createError, setCreateError] = useState('')
  const [createSaving, setCreateSaving] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', durationMin: '', price: '' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [actionMessage, setActionMessage] = useState('')
  const [deactivating, setDeactivating] = useState(false)

  const loadServices = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const filters = {}
      if (!showDeactivated) filters.isAvailable = true
      const env = await listServices({ ...filters, limit: 100, page: 1 })
      setServices(env.data ?? [])
      setMeta(env.meta ?? null)
    } catch (err) {
      setListError(extractApiError(err))
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [showDeactivated])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const filteredServices = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return services
    return services.filter((s) => s.name.toLowerCase().includes(normalized))
  }, [services, searchTerm])

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  )

  function handleSelectService(id) {
    setSelectedServiceId((current) => (current === id ? null : id))
    setIsEditing(false)
    setEditError('')
    setActionMessage('')
    setIsCreating(false)
  }

  function handleStartCreating() {
    setIsCreating(true)
    setSelectedServiceId(null)
    setIsEditing(false)
    setCreateForm({ name: '', durationMin: '', price: '' })
    setCreateError('')
    setActionMessage('')
  }

  function handleCancelCreate() {
    setIsCreating(false)
    setCreateForm({ name: '', durationMin: '', price: '' })
    setCreateError('')
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setCreateError('')

    if (!createForm.name.trim()) {
      setCreateError('Укажите название услуги.')
      return
    }
    const dur = Number(createForm.durationMin)
    if (!dur || dur <= 0) {
      setCreateError('Длительность должна быть больше 0.')
      return
    }
    const pr = Number(createForm.price)
    if (createForm.price === '' || !Number.isFinite(pr) || pr < 0) {
      setCreateError('Цена не может быть отрицательной.')
      return
    }

    setCreateSaving(true)
    try {
      await createService({
        name: createForm.name.trim(),
        durationMin: dur,
        price: pr,
      })
      setIsCreating(false)
      setCreateForm({ name: '', durationMin: '', price: '' })
      setActionMessage('Услуга создана.')
      await loadServices()
    } catch (err) {
      setCreateError(extractApiError(err))
    } finally {
      setCreateSaving(false)
    }
  }

  function handleStartEdit() {
    if (!selectedService) return
    setIsEditing(true)
    setEditForm({
      name: selectedService.name,
      durationMin: String(selectedService.duration_min),
      price: String(selectedService.price),
    })
    setEditError('')
    setActionMessage('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditForm({ name: '', durationMin: '', price: '' })
    setEditError('')
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!selectedService) return
    setEditError('')

    if (!editForm.name.trim()) {
      setEditError('Укажите название услуги.')
      return
    }
    const dur = Number(editForm.durationMin)
    if (!dur || dur <= 0) {
      setEditError('Длительность должна быть больше 0.')
      return
    }
    const pr = Number(editForm.price)
    if (editForm.price === '' || !Number.isFinite(pr) || pr < 0) {
      setEditError('Цена не может быть отрицательной.')
      return
    }

    setEditSaving(true)
    try {
      await updateService(selectedService.id, {
        name: editForm.name.trim(),
        durationMin: dur,
        price: pr,
      })
      setIsEditing(false)
      setActionMessage('Услуга обновлена.')
      await loadServices()
    } catch (err) {
      setEditError(extractApiError(err))
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!selectedService) return
    setDeactivating(true)
    setActionMessage('')
    try {
      await deactivateService(selectedService.id)
      setSelectedServiceId(null)
      setActionMessage('Услуга деактивирована.')
      await loadServices()
    } catch (err) {
      setActionMessage(extractApiError(err))
    } finally {
      setDeactivating(false)
    }
  }

  if (!isManager) {
    return <PlaceholderPage title="Услуги" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Услуги клиники</h1>
          <p>Управление справочником услуг: название, продолжительность и стоимость.</p>
        </div>

        <div className="doctor-head-actions">
          <button type="button" className="button-secondary" onClick={handleStartCreating}>
            + Новая услуга
          </button>
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по названию</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Название услуги"
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDeactivated}
            onChange={(e) => setShowDeactivated(e.target.checked)}
          />
          <span className="panel-muted">Показать деактивированные</span>
        </label>
      </div>

      {actionMessage ? <p className="panel-feedback">{actionMessage}</p> : null}
      {listError ? <p className="error-text">{listError}</p> : null}

      {loading ? (
        <p className="panel-muted">Загрузка списка услуг…</p>
      ) : (
        <div className="doctor-patients-layout">
          <article
            className="doctor-list-panel"
            style={{ flex: isCreating || selectedService ? '0 0 48%' : '1 0 100%' }}
          >
            <div className="panel-header-row">
              <h2>Список услуг</h2>
              <span className="panel-muted">
                Показано: {filteredServices.length}
                {meta?.total != null ? ` из ${meta.total}` : ''}
              </span>
            </div>

            <div className="patient-list">
              {filteredServices.length === 0 ? (
                <p className="panel-muted">
                  {searchTerm.trim() ? 'Ничего не найдено по запросу.' : 'Список услуг пуст.'}
                </p>
              ) : null}

              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={service.id === selectedServiceId ? 'patient-card active' : 'patient-card'}
                  onClick={() => handleSelectService(service.id)}
                  style={{ padding: '0.5rem 0.6rem' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                    <p className="item-title" style={{ margin: 0 }}>
                      {service.name}
                      {!service.is_available ? (
                        <span className="panel-muted" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                          (неактивна)
                        </span>
                      ) : null}
                    </p>
                    <p className="item-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
                      {service.duration_min} мин · {service.price} ₽
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </article>

          {isCreating ? (
            <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
              <div className="panel-header-row">
                <h2>Новая услуга</h2>
              </div>

              <form className="form-grid" onSubmit={handleCreateSubmit}>
                <label>
                  Название
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Например, Приём терапевта"
                  />
                </label>

                <label>
                  Длительность (мин)
                  <input
                    type="number"
                    min="1"
                    value={createForm.durationMin}
                    onChange={(e) => setCreateForm((p) => ({ ...p, durationMin: e.target.value }))}
                    placeholder="30"
                  />
                </label>

                <label>
                  Стоимость (₽)
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={createForm.price}
                    onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="2500"
                  />
                </label>

                {createError ? <p className="error-text">{createError}</p> : null}

                <div className="button-row">
                  <button type="submit" disabled={createSaving}>
                    {createSaving ? 'Сохранение…' : 'Создать услугу'}
                  </button>
                  <button type="button" className="button-secondary" onClick={handleCancelCreate}>
                    Отмена
                  </button>
                </div>
              </form>
            </aside>
          ) : selectedService ? (
            <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
              <div className="panel-header-row">
                <h2>Подробности услуги</h2>
                <span className="status-pill">
                  {selectedService.is_available ? 'Активна' : 'Неактивна'}
                </span>
              </div>

              {!isEditing ? (
                <>
                  <div className="detail-block">
                    <h3 className="detail-name">{selectedService.name}</h3>
                    <p className="item-subtitle">
                      Длительность: {selectedService.duration_min} мин
                    </p>
                    <p className="item-subtitle">
                      Стоимость: {selectedService.price} ₽
                    </p>
                    {selectedService.deactivated_at ? (
                      <p className="item-subtitle">
                        Деактивирована: {new Date(selectedService.deactivated_at).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}
                      </p>
                    ) : null}
                  </div>

                  <div className="button-row">
                    {selectedService.is_available ? (
                      <>
                        <button type="button" className="button-secondary" onClick={handleStartEdit}>
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={handleDeactivate}
                          disabled={deactivating}
                        >
                          {deactivating ? 'Деактивация…' : 'Деактивировать'}
                        </button>
                      </>
                    ) : (
                      <p className="panel-muted">Деактивированную услугу нельзя редактировать.</p>
                    )}
                  </div>
                </>
              ) : (
                <form className="form-grid" onSubmit={handleEditSubmit}>
                  <label>
                    Название
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </label>

                  <label>
                    Длительность (мин)
                    <input
                      type="number"
                      min="1"
                      value={editForm.durationMin}
                      onChange={(e) => setEditForm((p) => ({ ...p, durationMin: e.target.value }))}
                    />
                  </label>

                  <label>
                    Стоимость (₽)
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editForm.price}
                      onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                    />
                  </label>

                  {editError ? <p className="error-text">{editError}</p> : null}

                  <div className="button-row">
                    <button type="submit" disabled={editSaving}>
                      {editSaving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </aside>
          ) : null}
        </div>
      )}
    </section>
  )
}
