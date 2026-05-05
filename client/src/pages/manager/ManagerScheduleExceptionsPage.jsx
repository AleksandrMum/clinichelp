import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'
import { BRANCHES, DOCTORS, EXCEPTION_TYPES, SCHEDULE_EXCEPTIONS } from '../TEMP/scheduleExceptionsMocks'

const SCOPE = {
  BRANCH: 'branch',
  DOCTOR: 'doctor',
}

function formatDateTime(value) {
  if (!value) {
    return 'Не задано'
  }

  return value.replace('T', ' ')
}

function validateExceptionPayload(payload) {
  if (!payload.startAt) {
    return 'Укажите начало периода'
  }

  if (!payload.endAt) {
    return 'Укажите окончание периода'
  }

  if (new Date(payload.endAt) <= new Date(payload.startAt)) {
    return 'Окончание должно быть позже начала'
  }

  if (!payload.reason?.trim()) {
    return 'Причина не может быть пустой'
  }

  return null
}

export function ManagerScheduleExceptionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER
  const [exceptions, setExceptions] = useState(SCHEDULE_EXCEPTIONS)
  const [selectedBranchId, setSelectedBranchId] = useState(BRANCHES[0]?.id || '')
  const [scope, setScope] = useState(SCOPE.BRANCH)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExceptionId, setSelectedExceptionId] = useState(null)
  const [editingExceptionId, setEditingExceptionId] = useState(null)
  const [detailForm, setDetailForm] = useState({
    startAt: '',
    endAt: '',
    type: 'unavailable',
    reason: '',
  })
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [formData, setFormData] = useState({
    startAt: '',
    endAt: '',
    type: 'unavailable',
    reason: '',
  })

  const branchDoctors = useMemo(() => {
    return DOCTORS.filter((doctor) => doctor.branchId === selectedBranchId)
  }, [selectedBranchId])

  useEffect(() => {
    if (!branchDoctors.length) {
      setSelectedDoctorId('')
      return
    }

    const doctorExists = branchDoctors.some((doctor) => doctor.id === selectedDoctorId)
    if (!doctorExists) {
      setSelectedDoctorId(branchDoctors[0].id)
    }
  }, [branchDoctors, selectedDoctorId])

  useEffect(() => {
    setSelectedExceptionId(null)
    setEditingExceptionId(null)
    setFeedbackMessage('')
  }, [selectedBranchId, scope, selectedDoctorId])

  useEffect(() => {
    if (!selectedException) {
      setDetailForm({
        startAt: '',
        endAt: '',
        type: 'unavailable',
        reason: '',
      })
      return
    }

    setDetailForm({
      startAt: selectedException.startAt,
      endAt: selectedException.endAt,
      type: selectedException.type,
      reason: selectedException.reason,
    })
  }, [selectedExceptionId, selectedBranchId, scope, selectedDoctorId, exceptions])

  const targetLabel = useMemo(() => {
    const branch = BRANCHES.find((item) => item.id === selectedBranchId)
    if (!branch) {
      return 'Не выбран филиал'
    }

    if (scope === SCOPE.BRANCH) {
      return `${branch.name} (все врачи)`
    }

    const doctor = branchDoctors.find((item) => item.id === selectedDoctorId)
    return doctor ? `${branch.name} / ${doctor.fullName}` : `${branch.name} / врач не выбран`
  }, [branchDoctors, scope, selectedBranchId, selectedDoctorId])

  const filteredExceptions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return exceptions
      .filter((exception) => exception.branchId === selectedBranchId)
      .filter((exception) => {
        if (scope === SCOPE.BRANCH) {
          return exception.scope === SCOPE.BRANCH
        }

        return exception.scope === SCOPE.DOCTOR && exception.doctorId === selectedDoctorId
      })
      .filter((exception) => {
        if (!normalized) {
          return true
        }

        const typeLabel = EXCEPTION_TYPES[exception.type]?.label?.toLowerCase() || ''
        return typeLabel.includes(normalized) || exception.reason.toLowerCase().includes(normalized)
      })
      .sort((left, right) => new Date(left.startAt) - new Date(right.startAt))
  }, [exceptions, scope, searchTerm, selectedBranchId, selectedDoctorId])

  const selectedException = filteredExceptions.find((item) => item.id === selectedExceptionId) || null
  const isEditing = editingExceptionId === selectedExceptionId
  const isDoctorScopeReady = scope === SCOPE.BRANCH || Boolean(selectedDoctorId)
  const isSelectedExceptionReady = Boolean(selectedException)
  const detailInputsReadOnly = isSelectedExceptionReady && !isEditing

  const handleSelectException = (exceptionId) => {
    setSelectedExceptionId((currentExceptionId) => (currentExceptionId === exceptionId ? null : exceptionId))
    setEditingExceptionId(null)
    setFeedbackMessage('')
  }

  const handleEdit = (exception) => {
    if (!exception) {
      return
    }

    setEditingExceptionId(exception.id)
    setDetailForm({
      startAt: exception.startAt,
      endAt: exception.endAt,
      type: exception.type,
      reason: exception.reason,
    })
    setFeedbackMessage('')
  }

  const handleCancelEdit = () => {
    setEditingExceptionId(null)
    setFeedbackMessage('')
    if (selectedException) {
      setDetailForm({
        startAt: selectedException.startAt,
        endAt: selectedException.endAt,
        type: selectedException.type,
        reason: selectedException.reason,
      })
    }
  }

  const handleChangeField = (field, value) => {
    setDetailForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveChanges = () => {
    const errorMessage = validateExceptionPayload(detailForm)
    if (errorMessage) {
      setFeedbackMessage(errorMessage)
      return
    }

    if (!selectedException) {
      setFeedbackMessage('Сначала выберите исключение для редактирования')
      return
    }

    setExceptions((prev) => prev.map((item) => {
      if (item.id !== selectedException.id) {
        return item
      }

      return {
        ...item,
          startAt: detailForm.startAt,
          endAt: detailForm.endAt,
          type: detailForm.type,
          reason: detailForm.reason.trim(),
      }
    }))

    setEditingExceptionId(null)
      setDetailForm((prev) => ({
        ...prev,
        reason: detailForm.reason.trim(),
      }))
    setFeedbackMessage('Исключение обновлено')
  }

  const handleDeleteException = () => {
    if (!selectedException) {
      setFeedbackMessage('Сначала выберите исключение для удаления')
      return
    }

    setExceptions((prev) => prev.filter((item) => item.id !== selectedException.id))
    setSelectedExceptionId(null)
    setEditingExceptionId(null)
    setDetailForm({
      startAt: '',
      endAt: '',
      type: 'unavailable',
      reason: '',
    })
    setFeedbackMessage('Исключение удалено')
  }

  const handleCreateException = () => {
    if (!selectedBranchId) {
      setFeedbackMessage('Выберите филиал')
      return
    }

    if (!isDoctorScopeReady) {
      setFeedbackMessage('Выберите врача для добавления персонального исключения')
      return
    }

    const errorMessage = validateExceptionPayload(formData)
    if (errorMessage) {
      setFeedbackMessage(errorMessage)
      return
    }

    const createdException = {
      id: `exc-${Date.now()}`,
      scope,
      branchId: selectedBranchId,
      doctorId: scope === SCOPE.DOCTOR ? selectedDoctorId : null,
      startAt: formData.startAt,
      endAt: formData.endAt,
      type: formData.type,
      reason: formData.reason.trim(),
    }

    setExceptions((prev) => [createdException, ...prev])
    setSelectedExceptionId(createdException.id)
    setFeedbackMessage('Исключение добавлено')
    setFormData({
      startAt: '',
      endAt: '',
      type: formData.type,
      reason: '',
    })
    setEditingExceptionId(createdException.id)
  }

  const handleChangeFormField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!isManager) {
    return <PlaceholderPage title="Исключения расписания" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Исключения расписания</h1>
          <p>Управление временными недоступностями врачей: болезни, отпуска, обучение, командировки.</p>
        </div>

        <div className="doctor-head-actions">
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/clinic')}>
            ← Назад
          </button>
          <span className="role-pill">Режим менеджера</span>
        </div>
      </div>

      <div className="doctor-toolbar exception-scope-grid">
        <div className="exception-scope-grid-row exception-scope-grid-top">
          <button
            type="button"
            className={scope === SCOPE.BRANCH ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setScope(SCOPE.BRANCH)}
          >
            Исключения филиала
          </button>

          <button
            type="button"
            className={scope === SCOPE.DOCTOR ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setScope(SCOPE.DOCTOR)}
          >
            Исключения врача
          </button>
        </div>

        <div className="exception-scope-grid-row exception-scope-grid-bottom">
          <label className="schedule-filter exception-scope-select">
            <span>Филиал</span>
            <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
              {BRANCHES.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          {scope === SCOPE.DOCTOR ? (
            <label className="schedule-filter exception-scope-select">
              <span>Врач</span>
              <select value={selectedDoctorId} onChange={(event) => setSelectedDoctorId(event.target.value)}>
                {branchDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="doctor-patients-layout">
        <article className="doctor-list-panel" style={{ flex: '0 0 48%' }}>
          <div className="panel-header-row">
            <h2>Список исключений</h2>
            <label className="doctor-search exception-search-inline">
              <span>Поиск по названию</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Например, обед или доп. смена"
              />
            </label>
          </div>

          <p className="panel-muted exception-list-target">{targetLabel}</p>

          <div className="patient-list">
            {filteredExceptions.length === 0 ? (
              <p className="panel-muted">Для выбранного уровня нет исключений.</p>
            ) : null}

            {filteredExceptions.slice(0, 20).map((exception) => (
              <button
                key={exception.id}
                type="button"
                className={exception.id === selectedException?.id ? 'patient-card active' : 'patient-card'}
                onClick={() => handleSelectException(exception.id)}
                style={{ padding: '0.5rem 0.6rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <p className="item-title" style={{ margin: 0 }}>
                    {EXCEPTION_TYPES[exception.type]?.label || exception.type}
                  </p>
                  <p className="item-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
                    {formatDateTime(exception.startAt)} → {formatDateTime(exception.endAt)}
                  </p>
                  <p className="item-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: '#59637a' }}>
                    {exception.reason}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </article>

        <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
          <div className="panel-header-row">
            <div>
              <h2>{selectedException ? 'Подробности исключения' : 'Добавить исключение'}</h2>
            </div>
            {selectedException ? (
              <span className="status-pill">{EXCEPTION_TYPES[selectedException.type]?.label || selectedException.type}</span>
            ) : null}
          </div>

          <div className="exception-form-stack">
            <div className="detail-block">
              <p className="item-subtitle">Цель: {targetLabel}</p>
              <label className="exception-field">
                <span>Начало периода</span>
                <input
                  type="datetime-local"
                  value={selectedException ? detailForm.startAt : formData.startAt}
                  readOnly={detailInputsReadOnly}
                  onChange={(event) => (selectedException ? handleChangeField('startAt', event.target.value) : handleChangeFormField('startAt', event.target.value))}
                />
              </label>

              <label className="exception-field">
                <span>Окончание периода</span>
                <input
                  type="datetime-local"
                  value={selectedException ? detailForm.endAt : formData.endAt}
                  readOnly={detailInputsReadOnly}
                  onChange={(event) => (selectedException ? handleChangeField('endAt', event.target.value) : handleChangeFormField('endAt', event.target.value))}
                />
              </label>

              <label className="exception-field">
                <span>Тип исключения</span>
                <select
                  value={selectedException ? detailForm.type : formData.type}
                  disabled={detailInputsReadOnly}
                  onChange={(event) => (selectedException ? handleChangeField('type', event.target.value) : handleChangeFormField('type', event.target.value))}
                >
                  {Object.entries(EXCEPTION_TYPES).map(([key, { label, description }]) => (
                    <option key={key} value={key}>
                      {label} - {description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="exception-field">
                <span>Причина</span>
                <textarea
                  value={selectedException ? detailForm.reason : formData.reason}
                  readOnly={detailInputsReadOnly}
                  onChange={(event) => (selectedException ? handleChangeField('reason', event.target.value) : handleChangeFormField('reason', event.target.value))}
                  placeholder="Например, обеденный перерыв или дополнительная вечерняя смена"
                />
              </label>
            </div>

            {selectedException ? (
              <div className="detail-actions">
                {!isEditing ? (
                  <>
                    <button type="button" className="button-secondary" onClick={() => handleEdit(selectedException)}>
                      Редактировать
                    </button>
                    <button type="button" className="text-button" onClick={handleDeleteException}>
                      Удалить
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="button-secondary" onClick={handleSaveChanges}>
                      Сохранить изменения
                    </button>
                    <button type="button" className="text-button" onClick={handleCancelEdit}>
                      Отмена
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="detail-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCreateException}
                  disabled={!isDoctorScopeReady}
                >
                  Добавить исключение
                </button>
              </div>
            )}
          </div>

          {feedbackMessage ? <p className="panel-feedback">{feedbackMessage}</p> : null}
        </aside>
      </div>
    </section>
  )
}
