import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { PATIENTS } from '../TEMP/patientsMocks'
import { SERVICES } from '../TEMP/servicesMocks'
import { DOCTORS, SERVICES_BY_ID } from '../TEMP/appointmentsMocks'

export function ManagerCreateAppointmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER

  // Состояние формы
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    serviceId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    comment: '',
  })

  const [validationMessage, setValidationMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Вспомогательная функция для форматирования даты в ISO
  function formatDateToISO(dateStr) {
    if (!dateStr) return ''
    const [day, month, year] = dateStr.split('.').map(Number)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Вспомогательная функция для преобразования ISO даты в DD.MM.YYYY
  function formatDateFromISO(isoStr) {
    if (!isoStr) return ''
    const date = new Date(isoStr + 'T00:00:00')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Автоматический расчет времени окончания при выборе услуги
  useEffect(() => {
    if (formData.serviceId && formData.startTime) {
      const service = SERVICES_BY_ID[formData.serviceId]
      if (service) {
        const [hours, minutes] = formData.startTime.split(':').map(Number)
        const startMinutes = hours * 60 + minutes + service.duration
        const endHours = Math.floor(startMinutes / 60)
        const endMinutes = startMinutes % 60
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
        
        setFormData((prev) => ({
          ...prev,
          endDate: prev.startDate, // По умолчанию та же дата
          endTime,
        }))
      }
    }
  }, [formData.serviceId, formData.startTime, formData.startDate])

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

  // Обработчик изменения даты начала
  function handleStartDateChange(e) {
    setFormData((prev) => ({
      ...prev,
      startDate: e.target.value,
    }))
  }

  // Обработчик изменения времени окончания (ручное редактирование)
  function handleEndTimeChange(e) {
    setFormData((prev) => ({
      ...prev,
      endTime: e.target.value,
    }))
  }

  // Обработчик изменения даты окончания (ручное редактирование)
  function handleEndDateChange(e) {
    setFormData((prev) => ({
      ...prev,
      endDate: e.target.value,
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
    if (!formData.endDate || !formData.endTime) {
      setValidationMessage('Пожалуйста, укажите дату и время окончания')
      return
    }

    // Проверка что время окончания позже времени начала
    const startDateTime = new Date(
      `${formatDateToISO(formData.startDate)}T${formData.startTime}:00`
    )
    const endDateTime = new Date(
      `${formatDateToISO(formData.endDate)}T${formData.endTime}:00`
    )

    if (endDateTime <= startDateTime) {
      setValidationMessage('Время окончания должно быть позже времени начала')
      return
    }

    // Если все хорошо, показываем сообщение об успехе
    setValidationMessage('')
    setSuccessMessage('Запись успешно создана! Сейчас вы вернетесь к списку.')

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
          <h1>Создание записи на прием</h1>
          <p>Заполните форму для создания новой записи на прием пациента.</p>
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

          <label>
            <span>Дата начала *</span>
            <input
              type="date"
              value={formatDateToISO(formData.startDate) || ''}
              onChange={(e) => {
                const isoDate = e.target.value
                const parts = isoDate.split('-')
                const formatted = `${parts[2]}.${parts[1]}.${parts[0]}`
                handleStartDateChange({ target: { value: formatted } })
              }}
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
            <span>Дата окончания *</span>
            <input
              type="date"
              value={formatDateToISO(formData.endDate) || ''}
              onChange={(e) => {
                const isoDate = e.target.value
                const parts = isoDate.split('-')
                const formatted = `${parts[2]}.${parts[1]}.${parts[0]}`
                handleEndDateChange({ target: { value: formatted } })
              }}
              required
            />
          </label>

          <label>
            <span>Время окончания *</span>
            <input
              type="time"
              value={formData.endTime}
              onChange={handleEndTimeChange}
              required
            />
          </label>

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
          <button type="submit">
            Создать запись
          </button>
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
