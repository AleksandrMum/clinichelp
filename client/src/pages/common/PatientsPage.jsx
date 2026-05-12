import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { searchPatients, getPatientAppointments } from '../../services/patients'
import { PlaceholderPage } from './PlaceholderPage'

const STATUS_LABELS = {
  created: 'Создана',
  confirmed: 'Подтверждена',
  completed: 'Проведена',
  cancelled: 'Отменена',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

export function PatientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER

  const [patients, setPatients] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState('')
  const [appointmentsMode, setAppointmentsMode] = useState('compact')
  const [appointmentsMeta, setAppointmentsMeta] = useState(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 350)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const loadPatients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const env = await searchPatients({
        search: debouncedSearch || undefined,
        limit: 50,
        page: 1,
      })
      setPatients(env.data ?? [])
      setMeta(env.meta ?? null)
    } catch (err) {
      setError(extractApiError(err))
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  )

  const loadAppointments = useCallback(
    async (patientId, mode = 'compact') => {
      setAppointmentsLoading(true)
      setAppointmentsError('')
      try {
        const env = await getPatientAppointments(patientId, {
          mode,
          limit: mode === 'full' ? 20 : undefined,
          page: 1,
        })
        setAppointments(env.data ?? [])
        setAppointmentsMeta(env.meta ?? null)
      } catch (err) {
        setAppointmentsError(extractApiError(err))
        setAppointments([])
      } finally {
        setAppointmentsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!selectedPatientId) {
      setAppointments([])
      setAppointmentsMode('compact')
      setAppointmentsMeta(null)
      return
    }
    loadAppointments(selectedPatientId, 'compact')
    setAppointmentsMode('compact')
  }, [selectedPatientId, loadAppointments])

  function handleTogglePatient(id) {
    setSelectedPatientId((current) => (current === id ? null : id))
  }

  function handleShowFullHistory() {
    if (!selectedPatientId) return
    setAppointmentsMode('full')
    loadAppointments(selectedPatientId, 'full')
  }

  if (!isDoctor && !isManager) {
    return <PlaceholderPage title="Пациенты" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>{isDoctor ? 'Пациенты врача' : 'Пациенты'}</h1>
          <p>
            {isDoctor
              ? 'Поиск и просмотр пациентов. Карточка открывается внутри раздела.'
              : 'Общий список пациентов с расширенными действиями для менеджера.'}
          </p>
        </div>

        <div className="doctor-head-actions">
          {isManager ? (
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate('/manager/patients/new')}
            >
              Создать пациента
            </button>
          ) : null}
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по ФИО или телефону</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ФИО или телефон"
          />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="panel-muted">Загрузка списка пациентов…</p>
      ) : (
        <div className="doctor-patients-layout">
          <article
            className="doctor-list-panel"
            style={{ flex: selectedPatient ? '0 0 48%' : '1 0 100%' }}
          >
            <div className="panel-header-row">
              <h2>Список пациентов</h2>
              <span className="panel-muted">
                Показано: {patients.length}
                {meta?.total != null ? ` из ${meta.total}` : ''}
              </span>
            </div>

            <div className="patient-list">
              {patients.length === 0 ? (
                <p className="panel-muted">
                  {debouncedSearch
                    ? 'Ничего не найдено по запросу.'
                    : 'Список пациентов пуст.'}
                </p>
              ) : null}

              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={
                    patient.id === selectedPatientId
                      ? 'patient-card active'
                      : 'patient-card'
                  }
                  onClick={() => handleTogglePatient(patient.id)}
                  style={{ padding: '0.5rem 0.6rem' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <p className="item-title" style={{ margin: 0 }}>
                      {patient.full_name}
                    </p>
                    {patient.phone ? (
                      <p className="item-subtitle" style={{ margin: 0 }}>
                        {patient.phone}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </article>

          {selectedPatient ? (
            <aside
              className="doctor-detail-panel"
              style={{ flex: '0 0 48%' }}
            >
              <div className="panel-header-row">
                <h2>Карточка пациента</h2>
              </div>

              <div className="detail-block">
                <h3 className="detail-name">{selectedPatient.full_name}</h3>
                {selectedPatient.phone ? (
                  <p className="item-subtitle">
                    Телефон: {selectedPatient.phone}
                  </p>
                ) : null}
                {selectedPatient.birth_date ? (
                  <p className="item-subtitle">
                    Дата рождения: {formatDate(selectedPatient.birth_date)}
                  </p>
                ) : null}
                {selectedPatient.notes ? (
                  <p className="item-subtitle">
                    Заметки: {selectedPatient.notes}
                  </p>
                ) : null}
              </div>

              <div className="detail-history">
                <h3>
                  {isDoctor ? 'Мои записи с пациентом' : 'История записей'}
                </h3>

                {appointmentsLoading ? (
                  <p className="panel-muted">Загрузка записей…</p>
                ) : appointmentsError ? (
                  <p className="error-text">{appointmentsError}</p>
                ) : appointments.length === 0 ? (
                  <p className="panel-muted">Записей не найдено.</p>
                ) : (
                  <div className="history-list">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="history-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p className="item-title" style={{ margin: 0 }}>
                            {apt.service?.name ?? 'Услуга не указана'}
                          </p>
                          <p className="item-subtitle" style={{ margin: 0 }}>
                            {formatDateTime(apt.startAt)}
                            {apt.doctor?.fullName
                              ? ` — ${apt.doctor.fullName}`
                              : ''}
                          </p>
                        </div>
                        <span
                          className="status-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '32px',
                          }}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </div>
                    ))}

                    {appointmentsMode === 'compact' &&
                    appointments.length >= 3 ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={handleShowFullHistory}
                        >
                          Показать всю историю
                        </button>
                      </div>
                    ) : null}

                    {appointmentsMode === 'full' &&
                    appointmentsMeta?.pages > 1 ? (
                      <p className="panel-muted" style={{ marginTop: '0.5rem' }}>
                        Страница {appointmentsMeta.page} из{' '}
                        {appointmentsMeta.pages} (всего{' '}
                        {appointmentsMeta.total})
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  )
}
