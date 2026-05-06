import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
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

export function ManagerCreateAppointmentPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER
  const editingAppointment = location.state?.appointment || null
  const isEditing = Boolean(editingAppointment)

  // Состояние формы
  const [formData, setFormData] = useState(() => buildInitialFormData(editingAppointment))

  const [validationMessage, setValidationMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setFormData(buildInitialFormData(editingAppointment))
    setValidationMessage('')
    setSuccessMessage('')
  }, [editingAppointment])

  // Автоматический расчет времени окончания при выборе услуги или изменении времени начала
  useEffect(() => {
    const nextEndTime = calculateEndTime(formData.startTime, formData.serviceId)

    if (nextEndTime && nextEndTime !== formData.endTime) {
      setFormData((prev) => ({
        ...prev,
        endTime: nextEndTime,
      }))
    }
  }, [formData.serviceId, formData.startTime])

  // Обработчик выбора пациента
  function handlePatientSelect(e) {
    const patientId = e.target.value
    const patient = PATIENTS.find((p) => p.id === patientId)
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: patient?.fullName || '',
    }))
    setValidationMessage('')
  }

  // Обработчик выбора врача
  function handleDoctorSelect(e) {
    setFormData((prev) => ({
      ...prev,
      doctorId: e.target.value,
    }))
    setValidationMessage('')
  }

  // Обработчик выбора услуги
  function handleServiceSelect(e) {
    setFormData((prev) => ({
      ...prev,
      serviceId: e.target.value,
    }))
    setValidationMessage('')
  }

  // Обработчик изменения времени начала
  function handleStartTimeChange(e) {
    setFormData((prev) => ({
      ...prev,
      startTime: e.target.value,
    }))
  }

  // Обработчик изменения даты начала (ISO format)
  function handleStartDateChange(e) {
    setFormData((prev) => ({
      ...prev,
      startDate: e.target.value,
    }))
  }

  // Валидация и создание записи
  function handleCreateAppointment(e) {
    e.preventDefault()

    // Базовая валидация
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

    // Проверка что время окончания позже времени начала
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`)

    if (endDateTime <= startDateTime) {
      setValidationMessage('Время окончания должно быть позже времени начала')
      return
    }

    // Если все хорошо, показываем сообщение об успехе
    setValidationMessage('')
    setSuccessMessage(
      isEditing
        ? 'Запись успешно обновлена! Сейчас вы вернетесь к списку.'
        : 'Запись успешно создана! Сейчас вы вернетесь к списку.'
    )

    // Симуляция сохранения (в реальном приложении здесь был бы API запрос)
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
          <label>
            <span>Пациент *</span>
            <select value={formData.patientId} onChange={handlePatientSelect}>
              <option value="">Выберите пациента</option>
              {PATIENTS.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Врач *</span>
            <select value={formData.doctorId} onChange={handleDoctorSelect}>
              <option value="">Выберите врача</option>
              {DOCTORS.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-span-2">
            <span>Услуга *</span>
            <select value={formData.serviceId} onChange={handleServiceSelect}>
              <option value="">Выберите услугу</option>
              {SERVICES.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} мин) - {service.price} ₽
                </option>
              ))}
            </select>
          </label>

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
