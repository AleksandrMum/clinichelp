import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from './PlaceholderPage'

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { PATIENTS, PATIENT_FILTERS } from '../TEMP/patientsMocks'

export function PatientsPage() {
  const { user } = useAuth()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('Все')
  const [selectedPatientId, setSelectedPatientId] = useState(PATIENTS[0].id)
  const [cardMessage, setCardMessage] = useState('')

  const filteredPatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return PATIENTS.filter((patient) => {
      const matchesSearch =
        !normalized ||
        patient.fullName.toLowerCase().includes(normalized) ||
        patient.phone.toLowerCase().includes(normalized)

      const matchesFilter = activeFilter === 'Все' || patient.tag === activeFilter

      return matchesSearch && matchesFilter
    })
  }, [activeFilter, searchTerm])

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) || filteredPatients[0] || null

  function handleAction(message) {
    setCardMessage(message)
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
              ? 'Поиск и просмотр своих пациентов без административных действий. Карточка открывается внутри раздела.'
              : 'Общий список пациентов с расширенными действиями для менеджера.'}
          </p>
        </div>

        <div className="doctor-head-actions">
          {isManager ? (
            <button type="button" className="button-secondary" onClick={() => handleAction('Форма создания пациента пока работает как заглушка.') }>
              Создать пациента
            </button>
          ) : null}
          <span className="role-pill">{isDoctor ? 'Режим врача' : 'Режим менеджера'}</span>
        </div>
      </div>

      <div className="doctor-toolbar">
        <label className="doctor-search">
          <span>Поиск по ФИО или телефону</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Например, Ковалева"
          />
        </label>

        <div className="filter-chip-row">
          {PATIENT_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={filter === activeFilter ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="doctor-patients-layout">
        <article className="doctor-list-panel">
          <div className="panel-header-row">
            <h2>Список пациентов</h2>
            <span className="panel-muted">Найдено: {filteredPatients.length}</span>
          </div>

          <div className="patient-list">
            {filteredPatients.length === 0 ? (
              <p className="panel-muted">Ничего не найдено по запросу.</p>
            ) : null}

            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className={patient.id === selectedPatient?.id ? 'patient-card active' : 'patient-card'}
                onClick={() => setSelectedPatientId(patient.id)}
              >
                <div>
                  <p className="item-title">{patient.fullName}</p>
                  <p className="item-subtitle">{patient.age} лет • {patient.phone}</p>
                </div>

                <div className="patient-card-meta">
                  <span className="status-pill">{patient.tag}</span>
                  <span className="item-subtitle">{patient.lastService}</span>
                  <span className="item-subtitle">Следующий визит: {patient.nextVisit}</span>
                </div>
              </button>
            ))}
          </div>
        </article>

        <aside className="doctor-detail-panel">
          {selectedPatient ? (
            <>
              <div className="panel-header-row">
                <div>
                  <h2>Карточка пациента</h2>
                  <p className="panel-muted">Открыта внутри раздела «Пациенты»</p>
                </div>
                <span className="status-pill">{selectedPatient.status}</span>
              </div>

              <div className="detail-block">
                <p className="detail-name">{selectedPatient.fullName}</p>
                <p className="item-subtitle">Врач: {selectedPatient.doctor}</p>
                <p className="item-subtitle">Телефон: {selectedPatient.phone}</p>
                <p className="item-subtitle">Возраст: {selectedPatient.age}</p>
                <p className="item-subtitle">Последняя услуга: {selectedPatient.lastService}</p>
                <p className="item-subtitle">Следующий визит: {selectedPatient.nextVisit}</p>
                <p className="item-subtitle">Заметка: {selectedPatient.note}</p>
              </div>

              <div className="detail-actions">
                <button type="button" onClick={() => handleAction(`Пациент ${selectedPatient.fullName} отмечен как просмотренный в режиме заглушки.`)}>
                  Отметить просмотренным
                </button>
                <button type="button" className="button-secondary" onClick={() => handleAction(`Контакт пациента ${selectedPatient.fullName} подготовлен для звонка.`)}>
                  Скопировать телефон
                </button>
                <button type="button" className="button-secondary" onClick={() => handleAction(`История пациента ${selectedPatient.fullName} раскрыта в карточке.`)}>
                  Показать историю
                </button>
              </div>

              {isManager ? (
                <div className="detail-actions detail-actions-secondary">
                  <button type="button" className="button-secondary" onClick={() => handleAction(`Создание записи для ${selectedPatient.fullName} пока работает как заглушка.`)}>
                    Создать запись
                  </button>
                  <button type="button" className="button-secondary" onClick={() => handleAction(`Редактирование карточки ${selectedPatient.fullName} доступно в менеджерском режиме прототипа.`)}>
                    Редактировать карточку
                  </button>
                </div>
              ) : null}

              <div className="detail-history">
                <h3>История записей</h3>
                <div className="history-list">
                  {selectedPatient.history.map((entry) => (
                    <div key={`${selectedPatient.id}-${entry.date}`} className="history-item">
                      <div>
                        <p className="item-title">{entry.text}</p>
                        <p className="item-subtitle">{entry.date}</p>
                      </div>
                      <span className="status-pill">{entry.state}</span>
                    </div>
                  ))}
                </div>
              </div>

              {cardMessage ? <p className="panel-feedback">{cardMessage}</p> : null}
            </>
          ) : (
            <p className="panel-muted">Выберите пациента, чтобы открыть карточку.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
