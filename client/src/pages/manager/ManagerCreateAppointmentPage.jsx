import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'

import { PATIENTS } from '../TEMP/patientsMocks'
import { SERVICES } from '../TEMP/servicesMocks'
import { DOCTORS, SERVICES_BY_ID } from '../TEMP/appointmentsMocks'

function getDateValue(isoValue) {
  return isoValue ? isoValue.slice(0, 10) : ''
}

function getTimeValue(isoValue) {
  return isoValue ? isoValue.slice(11, 16) : ''
}

function buildInitialFormData(appointment) {
  if (!appointment) {
    return {
      patientId: '',
      patientName: '',
      doctorId: '',
      serviceId: '',
      startDate: '',
      startTime: '',
      endTime: '',
      comment: '',
    }
  }

  return {
    patientId: appointment.patientId || '',
    patientName: appointment.patientName || '',
    doctorId: appointment.doctorId || '',
    serviceId: appointment.serviceId || '',
    startDate: getDateValue(appointment.startAt),
    startTime: getTimeValue(appointment.startAt),
    endTime: getTimeValue(appointment.endAt),
    comment: appointment.comment || '',
  }
}

function calculateEndTime(startTime, serviceId) {
  if (!startTime || !serviceId) {
    return ''
  }

  const service = SERVICES_BY_ID[serviceId]
  if (!service) {
    return ''
  }

  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + service.duration
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

function SearchableAutocompleteField({
  label,
  placeholder,
  emptyText,
  items,
  selectedId,
  getItemId,
  getItemLabel,
  onSelect,
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const selectedItem = useMemo(
    () => items.find((item) => getItemId(item) === selectedId) || null,
    [getItemId, items, selectedId],
  )

  useEffect(() => {
    setQuery(selectedItem ? getItemLabel(selectedItem) : '')
  }, [getItemLabel, selectedItem, selectedId])

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
      !matchedItems.some((item) => getItemId(item) === getItemId(selectedItem))
    ) {
      return [selectedItem, ...matchedItems]
    }

    return matchedItems
  }, [getItemId, getItemLabel, items, query, selectedItem])

  function handlePick(item) {
    onSelect(item)
    setQuery(getItemLabel(item))
    setIsOpen(false)
    setHoveredIndex(-1)
  }

  return (
    <label className="autocomplete-field">
      <span>{label}</span>
      <div className="autocomplete-root">
        <input
          className="autocomplete-input"
          placeholder={placeholder}
          value={query}
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
                <li key={getItemId(item)}>
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

function getPatientLabel(patient) {
  return patient.fullName
}

function getItemId(item) {
  return item.id
}

function getDoctorLabel(doctor) {
  return doctor.name
}

function getServiceLabel(service) {
  return `${service.name} (${service.duration} мин) - ${service.price} ₽`
}

export function ManagerCreateAppointmentPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER
  const editingAppointment = location.state?.appointment || null
  const isEditing = Boolean(editingAppointment)

  const [formData, setFormData] = useState(() => buildInitialFormData(editingAppointment))

  const [validationMessage, setValidationMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const sortedPatients = useMemo(
    () => [...PATIENTS].sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru')),
    [],
  )

  const sortedDoctors = useMemo(
    () => [...DOCTORS].sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [],
  )

  const sortedServices = useMemo(
    () => [...SERVICES].sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [],
  )

  useEffect(() => {
    setFormData(buildInitialFormData(editingAppointment))
    setValidationMessage('')
    setSuccessMessage('')
  }, [editingAppointment])

  useEffect(() => {
    const nextEndTime = calculateEndTime(formData.startTime, formData.serviceId)

    if (nextEndTime && nextEndTime !== formData.endTime) {
      setFormData((prev) => ({
        ...prev,
        endTime: nextEndTime,
      }))
    }
  }, [formData.serviceId, formData.startTime])

  function handlePatientSelect(input) {
    const patientId = typeof input === 'string' ? input : input.target.value
    const patient = PATIENTS.find((p) => p.id === patientId)
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: patient?.fullName || '',
    }))
    setValidationMessage('')
  }

  function handleDoctorSelect(input) {
    const doctorId = typeof input === 'string' ? input : input.target.value
    setFormData((prev) => ({
      ...prev,
      doctorId,
    }))
    setValidationMessage('')
  }

  function handleServiceSelect(input) {
    const serviceId = typeof input === 'string' ? input : input.target.value
    setFormData((prev) => ({
      ...prev,
      serviceId,
    }))
    setValidationMessage('')
  }

  function handleStartTimeChange(e) {
    setFormData((prev) => ({
      ...prev,
      startTime: e.target.value,
    }))
  }

  function handleStartDateChange(e) {
    setFormData((prev) => ({
      ...prev,
      startDate: e.target.value,
    }))
  }

  function handleCreateAppointment(e) {
    e.preventDefault()

    if (!formData.patientId) {
      setValidationMessage('Пожалуйста, выберите пациента')
      return
    }
    if (!formData.doctorId) {
      setValidationMessage('Пожалуйста, выберите врача')
      return
    }
    if (!formData.serviceId) {
      setValidationMessage('Пожалуйста, выберите услугу')
      return
    }
    if (!formData.startDate || !formData.startTime) {
      setValidationMessage('Пожалуйста, укажите дату и время начала')
      return
    }
    if (!formData.endTime) {
      setValidationMessage('Пожалуйста, проверьте время окончания')
      return
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`)

    if (endDateTime <= startDateTime) {
      setValidationMessage('Время окончания должно быть позже времени начала')
      return
    }

    setValidationMessage('')
    setSuccessMessage(
      isEditing
        ? 'Запись успешно обновлена! Сейчас вы вернетесь к списку.'
        : 'Запись успешно создана! Сейчас вы вернетесь к списку.'
    )

    setTimeout(() => {
      navigate('/manager/appointments')
    }, 1500)
  }

  if (!isManager) {
    return <PlaceholderPage title="Создание записи на прием" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>{isEditing ? 'Редактирование записи на прием' : 'Создание записи на прием'}</h1>
          <p>
            {isEditing
              ? 'Отредактируйте данные записи и сохраните изменения.'
              : 'Заполните форму для создания новой записи на прием пациента.'}
          </p>
        </div>
        <div className="doctor-head-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => navigate('/manager/appointments')}
          >
            ← Назад
          </button>
        </div>
      </div>

      <form onSubmit={handleCreateAppointment}>
        <div className="form-grid form-grid-two-col" style={{ marginBottom: '1rem' }}>
          <SearchableAutocompleteField
            label="Пациент *"
            placeholder="ФИО пациента"
            emptyText="Пациент не найден"
            items={sortedPatients}
            selectedId={formData.patientId}
            getItemId={getItemId}
            getItemLabel={getPatientLabel}
            onSelect={(patient) => handlePatientSelect(patient.id)}
          />

          <SearchableAutocompleteField
            label="Врач *"
            placeholder="ФИО врача"
            emptyText="Врач не найден"
            items={sortedDoctors}
            selectedId={formData.doctorId}
            getItemId={getItemId}
            getItemLabel={getDoctorLabel}
            onSelect={(doctor) => handleDoctorSelect(doctor.id)}
          />

          <div className="form-span-2">
            <SearchableAutocompleteField
              label="Услуга *"
              placeholder="Название услуги"
              emptyText="Услуга не найдена"
              items={sortedServices}
              selectedId={formData.serviceId}
              getItemId={getItemId}
              getItemLabel={getServiceLabel}
              onSelect={(service) => handleServiceSelect(service.id)}
            />
          </div>

          <div className="form-span-2 appointment-schedule-grid">
            <label>
              <span>Дата начала *</span>
              <input
                type="date"
                defaultValue={formData.startDate}
                onChange={handleStartDateChange}
                required
              />
            </label>

            <label>
              <span>Время начала *</span>
              <input
                type="time"
                value={formData.startTime}
                onChange={handleStartTimeChange}
                required
              />
            </label>

            <label>
              <span>Время окончания *</span>
              <input type="time" value={formData.endTime} readOnly aria-readonly="true" />
            </label>
          </div>

          <label className="form-span-2">
            <span>Комментарий</span>
            <textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              placeholder="Примечание к записи (необязательно)"
            />
          </label>
        </div>

        {validationMessage ? (
          <p className="panel-feedback" style={{ color: '#b10030', borderLeftColor: '#b10030' }}>
            {validationMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="panel-feedback"
            style={{ color: '#0f5f2d', borderLeftColor: '#0f5f2d', backgroundColor: '#dff4e7' }}
          >
            {successMessage}
          </p>
        ) : null}

        <div className="button-row" style={{ marginTop: '1.5rem' }}>
          <button type="submit">{isEditing ? 'Сохранить изменения' : 'Создать запись'}</button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/manager/appointments')}
          >
            Отмена
          </button>
        </div>
      </form>
    </section>
  )
}
