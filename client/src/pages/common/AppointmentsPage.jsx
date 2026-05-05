import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from './PlaceholderPage'

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { APPOINTMENTS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from '../TEMP/appointmentsMocks'

export function AppointmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  const [cardMessage, setCardMessage] = useState('')

  const filteredAppointments = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return APPOINTMENTS.filter((appointment) => {
      if (!normalized) return true

      const matchesName = appointment.patientName.toLowerCase().includes(normalized)
      const matchesDate = appointment.startAt.includes(searchTerm.trim())

      return matchesName || matchesDate
    })
  }, [searchTerm])

  const selectedAppointment =
    filteredAppointments.find((apt) => apt.id === selectedAppointmentId) || null

  // Вспомогательные функции для форматирования
  function formatDateTime(isoString) {
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  function getDuration(startAt, endAt) {
    const start = new Date(startAt)
    const end = new Date(endAt)
    return Math.round((end - start) / 60000) // в минутах
  }

  function toggleAppointmentDetails(appointment) {
    setSelectedAppointmentId((currentId) =>
      currentId === appointment.id ? null : appointment.id
    )
    setCardMessage('')
  }

  if (!isDoctor && !isManager) {
    return <PlaceholderPage title="Записи на прием" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>{isDoctor ? 'Мои записи пациентов' : 'Записи на прием'}</h1>
          <p>
            {isDoctor
              ? 'Просмотр расписания приемов ваших пациентов без административных действий.'
              : 'Управление записями на прием. Нажмите на запись для просмотра подробностей.'}
          </p>
        </div>

        <div className="doctor-head-actions">
          {isManager ? (
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate('/manager/appointments/new')}
            >
              Создать запись
            </button>
          ) : null}
          <span className="role-pill">{isDoctor ? 'Режим врача' : 'Режим менеджера'}</span>
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по ФИО пациента или дате</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Например, Ковалева или 05.05.2026"
          />
        </label>
      </div>

      <div className="doctor-patients-layout">
        <article
          className="doctor-list-panel"
          style={{ flex: selectedAppointment ? '0 0 48%' : '1 0 100%' }}
        >
          <div className="panel-header-row">
            <h2>Список записей</h2>
            <span className="panel-muted">
              Показано: {Math.min(filteredAppointments.length, 6)} из {filteredAppointments.length}
            </span>
          </div>

          <div className="patient-list">
            {filteredAppointments.length === 0 ? (
              <p className="panel-muted">Ничего не найдено по запросу.</p>
            ) : null}

            {filteredAppointments.slice(0, 6).map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                className={
                  appointment.id === selectedAppointment?.id ? 'patient-card active' : 'patient-card'
                }
                onClick={() => toggleAppointmentDetails(appointment)}
                style={{
                  padding: '0.6rem 0.7rem',
                  backgroundColor: appointment.id === selectedAppointment?.id
                    ? APPOINTMENT_STATUS_STYLES[appointment.status]
                    : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <p className="item-title" style={{ margin: 0 }}>
                    {appointment.patientName}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#59637a' }}>
                    {formatDateTime(appointment.startAt)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a8699' }}>
                    {appointment.serviceName}
                  </p>
                  <span
                    className="status-pill"
                    style={{
                      backgroundColor: APPOINTMENT_STATUS_STYLES[appointment.status],
                      color: '#1d2433',
                      fontSize: '0.75rem',
                    }}
                  >
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </article>

        {selectedAppointment ? (
          <article className="doctor-detail-panel">
            <div className="panel-header-row">
              <h2>Подробности записи</h2>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setSelectedAppointmentId(null)
                  setCardMessage('')
                }}
              >
                Закрыть
              </button>
            </div>

            <div className="form-grid">
              <label>
                <span>Пациент</span>
                <input type="text" value={selectedAppointment.patientName} readOnly />
              </label>

              <label>
                <span>Врач</span>
                <input type="text" value={selectedAppointment.doctorName} readOnly />
              </label>

              <label>
                <span>Услуга</span>
                <input type="text" value={selectedAppointment.serviceName} readOnly />
              </label>

              <label>
                <span>Дата и время начала</span>
                <input type="text" value={formatDateTime(selectedAppointment.startAt)} readOnly />
              </label>

              <label>
                <span>Дата и время окончания</span>
                <input type="text" value={formatDateTime(selectedAppointment.endAt)} readOnly />
              </label>

              <label>
                <span>Продолжительность</span>
                <input
                  type="text"
                  value={`${getDuration(selectedAppointment.startAt, selectedAppointment.endAt)} мин`}
                  readOnly
                />
              </label>

              <label>
                <span>Стоимость</span>
                <input type="text" value={`${selectedAppointment.bookedPrice} ₽`} readOnly />
              </label>

              <label>
                <span>Статус</span>
                <input
                  type="text"
                  value={APPOINTMENT_STATUS_LABELS[selectedAppointment.status]}
                  readOnly
                />
              </label>

              <label className="form-span-2">
                <span>Комментарий</span>
                <textarea readOnly value={selectedAppointment.comment} />
              </label>
            </div>

            {isManager ? (
              <div className="button-row" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="button-secondary"
                  title="Изменить запись (в разработке)"
                  disabled
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  title="Отменить запись (в разработке)"
                  disabled
                >
                  Отменить
                </button>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </section>
  )
}
