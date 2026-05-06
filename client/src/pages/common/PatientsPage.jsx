import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from './PlaceholderPage'

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { PATIENTS } from '../TEMP/patientsMocks'

export function PatientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [cardMessage, setCardMessage] = useState('')
  const [historyLimit, setHistoryLimit] = useState(5)

  const filteredPatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return PATIENTS.filter((patient) => {
      const matchesSearch =
        !normalized ||
        patient.fullName.toLowerCase().includes(normalized) ||
        patient.phone.toLowerCase().includes(normalized)

      return matchesSearch
    })
  }, [searchTerm])

  const selectedPatient = filteredPatients.find((patient) => patient.id === selectedPatientId) || null

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
              ? 'Поиск и просмотр своих пациентов без административных действий. Карточка открывается внутри раздела.'
              : 'Общий список пациентов с расширенными действиями для менеджера.'}
          </p>
        </div>

        <div className="doctor-head-actions">
          {isManager ? (
            <button type="button" className="button-secondary" onClick={() => navigate('/manager/patients/new')}>
              Создать пациента
            </button>
          ) : null}
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по ФИО или телефону</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ФИО или телефон"
          />
        </label>
      </div>

      <div className="doctor-patients-layout">
        <article className="doctor-list-panel" style={{ flex: selectedPatient ? '0 0 48%' : '1 0 100%' }}>
          <div className="panel-header-row">
            <h2>Список пациентов</h2>
            <span className="panel-muted">Показано: {Math.min(filteredPatients.length, 6)} из {filteredPatients.length}</span>
          </div>

          <div className="patient-list">
            {filteredPatients.length === 0 ? (
              <p className="panel-muted">Ничего не найдено по запросу.</p>
            ) : null}

            {filteredPatients.slice(0, 6).map((patient) => (
              <button
                key={patient.id}
                type="button"
                className={patient.id === selectedPatient?.id ? 'patient-card active' : 'patient-card'}
                onClick={() => {
                  setSelectedPatientId((currentPatientId) => (currentPatientId === patient.id ? null : patient.id))
                  setCardMessage('')
                }}
                style={{ padding: '0.5rem 0.6rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <p className="item-title" style={{ margin: 0 }}>{patient.fullName}</p>
                </div>
              </button>
            ))}
          </div>
        </article>

        {selectedPatient ? (
          <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
            <div className="panel-header-row">
              <div>
                <h2>Карточка пациента</h2>
              </div>
              <span className="status-pill">{selectedPatient.status}</span>
            </div>

            <div className="detail-block">
              <h3 className="detail-name">{selectedPatient.fullName}</h3>
              <p className="item-subtitle">Телефон: {selectedPatient.phone}</p>
              <p className="item-subtitle">Возраст: {selectedPatient.age}</p>
              <p className="item-subtitle">Ближайший визит: {selectedPatient?.nextVisit ?? 'Не запланирован'}</p>
            </div>

            <div className="detail-history">
              <h3>История записей</h3>
              <div className="history-list">
                {(selectedPatient.history || []).slice(0, historyLimit).map((entry) => (
                  <div key={`${selectedPatient.id}-${entry.date}`} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="item-title" style={{ margin: 0 }}>{entry.text}</p>
                      <p className="item-subtitle" style={{ margin: 0 }}>{entry.date}</p>
                    </div>
                    <span className="status-pill" style={{ display: 'inline-flex', alignItems: 'center', height: '32px' }}>{entry.state}</span>
                  </div>
                ))}
                {(selectedPatient.history || []).length > historyLimit ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="button-secondary" onClick={() => setHistoryLimit((prev) => prev + 5)}>Загрузить ещё</button>
                  </div>
                ) : null}
              </div>
            </div>

            {cardMessage ? <p className="panel-feedback">{cardMessage}</p> : null}
          </aside>
        ) : null}
      </div>
    </section>
  )
}
