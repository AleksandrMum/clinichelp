import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'
import { SERVICES } from '../TEMP/servicesMocks'

export function ManagerServicesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [isCreating, setIsCreating] = useState(false)
  const [creatingData, setCreatingData] = useState({ name: '', duration: '', price: '' })
  const [successMessage, setSuccessMessage] = useState('')

  const filteredServices = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return SERVICES.filter((service) => {
      const matchesSearch =
        !normalized ||
        service.name.toLowerCase().includes(normalized)

      return matchesSearch
    })
  }, [searchTerm])

  const selectedService = filteredServices.find((service) => service.id === selectedServiceId) || null
  const isEditing = editingServiceId === selectedServiceId

  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId)
    setEditingServiceId(null)
    setEditedData({})
    setSuccessMessage('')
  }

  const handleEdit = () => {
    if (!selectedService) {
      return
    }

    setEditingServiceId(selectedServiceId)
    setEditedData({
      name: selectedService.name,
      duration: selectedService.duration,
      price: selectedService.price,
    })
    setSuccessMessage('')
  }

  const handleCancelEdit = () => {
    setEditingServiceId(null)
    setEditedData({})
    setSuccessMessage('')
  }

  const handleStartCreating = () => {
    setIsCreating(true)
    setSelectedServiceId(null)
    setCreatingData({ name: '', duration: '', price: '' })
    setSuccessMessage('')
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setCreatingData({ name: '', duration: '', price: '' })
    setSuccessMessage('')
  }

  const handleCreateChangeField = (field, value) => {
    setCreatingData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateService = () => {
    if (!creatingData.name?.trim()) {
      setSuccessMessage('Название услуги не может быть пустым')
      return
    }

    if (!creatingData.duration || creatingData.duration <= 0) {
      setSuccessMessage('Длительность должна быть больше 0')
      return
    }

    if (creatingData.price === '' || creatingData.price < 0) {
      setSuccessMessage('Цена не может быть отрицательной')
      return
    }

    setTimeout(() => {
      setSuccessMessage('✓ Услуга успешно создана')
      setIsCreating(false)
      setCreatingData({ name: '', duration: '', price: '' })

      setTimeout(() => setSuccessMessage(''), 3000)
    }, 300)
  }

  const handleChangeField = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveChanges = () => {
    if (!editedData.name?.trim()) {
      setSuccessMessage('Название услуги не может быть пустым')
      return
    }

    if (!editedData.duration || editedData.duration <= 0) {
      setSuccessMessage('Длительность должна быть больше 0')
      return
    }

    if (!editedData.price || editedData.price < 0) {
      setSuccessMessage('Цена не может быть отрицательной')
      return
    }

    setTimeout(() => {
      setSuccessMessage('✓ Услуга успешно обновлена')
      setEditingServiceId(null)
      setEditedData({})

      setTimeout(() => setSuccessMessage(''), 3000)
    }, 300)
  }

  if (!isManager) {
    return <PlaceholderPage title="Услуги" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Услуги клиники</h1>
          <p>Управление справочником услуг: название, стандартная продолжительность и стоимость приема.</p>
        </div>

        <div className="doctor-head-actions">
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/clinic')}>
            ← Назад
          </button>
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по названию услуги</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Название услуги"
          />
        </label>
      </div>

      <div className="doctor-patients-layout">
        <article className="doctor-list-panel" style={{ flex: isCreating || selectedService ? '0 0 48%' : '1 0 100%' }}>
          <div className="panel-header-row">
            <h2>Список услуг</h2>
            <span className="panel-muted">Показано: {Math.min(filteredServices.length, 10)} из {filteredServices.length}</span>
          </div>

          {!isCreating && !selectedService && (
            <button type="button" className="button-secondary" onClick={handleStartCreating} style={{ width: '100%', marginTop: '0.75rem' }}>
              + Добавить новую услугу
            </button>
          )}

          <div className="patient-list">
            {filteredServices.length === 0 ? (
              <p className="panel-muted">Ничего не найдено по запросу.</p>
            ) : null}

            {filteredServices.slice(0, 10).map((service) => (
              <button
                key={service.id}
                type="button"
                className={service.id === selectedService?.id ? 'patient-card active' : 'patient-card'}
                onClick={() => handleSelectService(service.id)}
                style={{ padding: '0.5rem 0.6rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <p className="item-title" style={{ margin: 0 }}>{service.name}</p>
                  <p className="item-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
                    {service.duration} мин • {service.price} ₽
                  </p>
                </div>
              </button>
            ))}
          </div>
        </article>

        {isCreating || selectedService ? (
          <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
            {isCreating ? (
              <>
                <div className="panel-header-row">
                  <div>
                    <h2>Создание новой услуги</h2>
                  </div>
                </div>

                <div className="detail-block">
                  <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Название услуги</span>
                    <input
                      type="text"
                      value={creatingData.name || ''}
                      onChange={(e) => handleCreateChangeField('name', e.target.value)}
                      placeholder="Например, Прием терапевта"
                      style={{
                        border: '1px solid #cdd5e3',
                        borderRadius: '0.45rem',
                        padding: '0.55rem 0.6rem',
                        background: '#ffffff',
                        fontSize: 'inherit',
                      }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Длительность (минуты)</span>
                    <input
                      type="number"
                      min="1"
                      value={creatingData.duration || ''}
                      onChange={(e) => handleCreateChangeField('duration', parseInt(e.target.value) || '')}
                      placeholder="30"
                      style={{
                        border: '1px solid #cdd5e3',
                        borderRadius: '0.45rem',
                        padding: '0.55rem 0.6rem',
                        background: '#ffffff',
                        fontSize: 'inherit',
                      }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Стоимость (₽)</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={creatingData.price || ''}
                      onChange={(e) => handleCreateChangeField('price', parseInt(e.target.value) || '')}
                      placeholder="1500"
                      style={{
                        border: '1px solid #cdd5e3',
                        borderRadius: '0.45rem',
                        padding: '0.55rem 0.6rem',
                        background: '#ffffff',
                        fontSize: 'inherit',
                      }}
                    />
                  </label>
                </div>

                <div className="detail-actions">
                  <button type="button" className="button-secondary" onClick={handleCreateService}>
                    Создать услугу
                  </button>
                  <button type="button" className="text-button" onClick={handleCancelCreate}>
                    Отмена
                  </button>
                </div>

                {successMessage ? <p className="panel-feedback">{successMessage}</p> : null}
              </>
            ) : selectedService ? (
              <>
                <div className="panel-header-row">
                  <div>
                    <h2>Подробности услуги</h2>
                  </div>
                  <span className="status-pill">{selectedService.isActive ? 'Активна' : 'Неактивна'}</span>
                </div>

                {!isEditing ? (
                  <>
                    <div className="detail-block">
                      <h3 className="detail-name">{selectedService.name}</h3>
                      <p className="item-subtitle">
                        <strong>Длительность приема:</strong> {selectedService.duration} минут
                      </p>
                      <p className="item-subtitle">
                        <strong>Стоимость услуги:</strong> {selectedService.price} ₽
                      </p>
                    </div>

                    <div className="detail-actions">
                      <button type="button" className="button-secondary" onClick={handleEdit} disabled={!selectedService}>
                        Редактировать
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-block">
                      <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Название услуги</span>
                        <input
                          type="text"
                          value={editedData.name || ''}
                          onChange={(e) => handleChangeField('name', e.target.value)}
                          style={{
                            border: '1px solid #cdd5e3',
                            borderRadius: '0.45rem',
                            padding: '0.55rem 0.6rem',
                            background: '#ffffff',
                            fontSize: 'inherit',
                          }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Длительность (минуты)</span>
                        <input
                          type="number"
                          min="1"
                          value={editedData.duration || ''}
                          onChange={(e) => handleChangeField('duration', parseInt(e.target.value) || '')}
                          style={{
                            border: '1px solid #cdd5e3',
                            borderRadius: '0.45rem',
                            padding: '0.55rem 0.6rem',
                            background: '#ffffff',
                            fontSize: 'inherit',
                          }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.95rem', color: '#2e374a', fontWeight: '500' }}>Стоимость (₽)</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={editedData.price || ''}
                          onChange={(e) => handleChangeField('price', parseInt(e.target.value) || '')}
                          style={{
                            border: '1px solid #cdd5e3',
                            borderRadius: '0.45rem',
                            padding: '0.55rem 0.6rem',
                            background: '#ffffff',
                            fontSize: 'inherit',
                          }}
                        />
                      </label>
                    </div>

                    <div className="detail-actions">
                      <button type="button" className="button-secondary" onClick={handleSaveChanges}>
                        Сохранить изменения
                      </button>
                      <button type="button" className="text-button" onClick={handleCancelEdit}>
                        Отмена
                      </button>
                    </div>
                  </>
                )}

                {successMessage ? <p className="panel-feedback">{successMessage}</p> : null}
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  )
}
