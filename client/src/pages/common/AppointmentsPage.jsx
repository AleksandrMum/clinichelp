import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from './PlaceholderPage'
import { getDailyAppointments, updateAppointmentStatus, cancelAppointment } from '../../services/appointments'
import { getDoctorAppointments, listDoctors } from '../../services/schedule'

const STATUS_LABELS = {
  created: 'Создана',
  confirmed: 'Подтверждена',
  completed: 'Проведена',
  cancelled: 'Отменена',
}

const STATUS_STYLES = {
  created: '#e8f0fe',
  confirmed: '#dff4e7',
  completed: '#f0f0f0',
  cancelled: '#ffe4e1',
}

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

function formatTime(isoString) {
  const d = new Date(isoString)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

function formatDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDuration(startIso, endIso) {
  return Math.round((new Date(endIso) - new Date(startIso)) / 60000)
}

function normalizeDailyApt(apt) {
  return {
    id: apt.id,
    start_at: apt.startAt,
    end_at: apt.endAt,
    status: apt.status,
    booked_price: apt.bookedPrice,
    comment: apt.comment ?? null,
    cancel_reason: apt.cancelReason ?? null,
    patient: apt.patient ? { id: apt.patient.id, full_name: apt.patient.fullName, phone: apt.patient.phone } : null,
    doctor: apt.doctor ? { id: apt.doctor.id, full_name: apt.doctor.fullName } : null,
    service: apt.service ? { id: apt.service.id, name: apt.service.name, duration_min: apt.service.durationMin, price: apt.service.price } : null,
  }
}

export function AppointmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER

  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)

  const [filterDoctorId, setFilterDoctorId] = useState('')
  const [filterDate, setFilterDate] = useState(() => formatDateInput(new Date()))

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAptId, setSelectedAptId] = useState(null)
  const [cardMessage, setCardMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!isManager) return
    let cancelled = false
    setDoctorsLoading(true)
    listDoctors()
      .then((env) => { if (!cancelled) setDoctors(env.data ?? []) })
      .catch(() => { if (!cancelled) setDoctors([]) })
      .finally(() => { if (!cancelled) setDoctorsLoading(false) })
    return () => { cancelled = true }
  }, [isManager])

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelectedAptId(null)
    setCardMessage('')
    try {
      let items
      if (isDoctor && user?.id) {
        const from = `${filterDate}T00:00:00.000Z`
        const to = `${filterDate}T23:59:59.999Z`
        const env = await getDoctorAppointments(user.id, { from, to, limit: 200 })
        items = env.data ?? []
      } else if (isManager && filterDoctorId) {
        const from = `${filterDate}T00:00:00.000Z`
        const to = `${filterDate}T23:59:59.999Z`
        const env = await getDoctorAppointments(filterDoctorId, { from, to, limit: 200 })
        items = env.data ?? []
      } else if (isManager) {
        const env = await getDailyAppointments({ date: filterDate, limit: 200 })
        items = (env.data ?? []).map(normalizeDailyApt)
      } else {
        items = []
      }
      setAppointments(items)
    } catch (err) {
      setError(extractApiError(err))
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [isDoctor, isManager, user?.id, filterDoctorId, filterDate])

  useEffect(() => {
    if (isManager || isDoctor) loadAppointments()
  }, [loadAppointments, isManager, isDoctor])

  const filteredAppointments = useMemo(() => {
    const norm = searchTerm.trim().toLowerCase()
    if (!norm) return appointments
    return appointments.filter((apt) => {
      const name = (apt.patient?.full_name || '').toLowerCase()
      const svc = (apt.service?.name || '').toLowerCase()
      const doc = (apt.doctor?.full_name || '').toLowerCase()
      return name.includes(norm) || svc.includes(norm) || doc.includes(norm)
    })
  }, [searchTerm, appointments])

  const selectedApt = filteredAppointments.find((a) => a.id === selectedAptId) || null

  const filterDoctorName = useMemo(() => {
    if (!filterDoctorId) return ''
    return doctors.find((d) => d.id === filterDoctorId)?.full_name ?? ''
  }, [filterDoctorId, doctors])

  function goPrevDay() {
    const d = new Date(filterDate)
    d.setDate(d.getDate() - 1)
    setFilterDate(formatDateInput(d))
  }

  function goNextDay() {
    const d = new Date(filterDate)
    d.setDate(d.getDate() + 1)
    setFilterDate(formatDateInput(d))
  }

  function goToday() {
    setFilterDate(formatDateInput(new Date()))
  }

  async function handleConfirm() {
    if (!selectedApt) return
    setActionLoading(true); setCardMessage('')
    try {
      await updateAppointmentStatus(selectedApt.id, 'confirmed')
      setCardMessage('Запись подтверждена.')
      loadAppointments()
    } catch (err) { setCardMessage(extractApiError(err)) }
    finally { setActionLoading(false) }
  }

  async function handleComplete() {
    if (!selectedApt) return
    setActionLoading(true); setCardMessage('')
    try {
      await updateAppointmentStatus(selectedApt.id, 'completed')
      setCardMessage('Приём завершён.')
      loadAppointments()
    } catch (err) { setCardMessage(extractApiError(err)) }
    finally { setActionLoading(false) }
  }

  async function handleCancel() {
    if (!selectedApt) return
    const reason = window.prompt('Причина отмены:')
    if (reason === null) return
    setActionLoading(true); setCardMessage('')
    try {
      await cancelAppointment(selectedApt.id, reason || undefined)
      setCardMessage('Запись отменена.')
      loadAppointments()
    } catch (err) { setCardMessage(extractApiError(err)) }
    finally { setActionLoading(false) }
  }

  if (!isDoctor && !isManager) return <PlaceholderPage title="Записи на приём" />

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>{isDoctor ? 'Мои записи пациентов' : 'Записи на приём'}</h1>
          <p>
            {isDoctor
              ? 'Просмотр приёмов ваших пациентов.'
              : 'Управление записями на приём. Нажмите на запись для подробностей.'}
          </p>
        </div>
        {isManager ? (
          <div className="doctor-head-actions">
            <button type="button" className="button-secondary" onClick={() => navigate('/manager/appointments/new')}>
              + Создать запись
            </button>
          </div>
        ) : null}
      </div>

      <div className="doctor-toolbar" style={{ gap: '0.6rem' }}>
        <div className="doctor-head-actions schedule-nav">
          <button type="button" className="button-secondary" onClick={goPrevDay}>←</button>
          <button type="button" className="button-secondary" onClick={goToday}>Сегодня</button>
          <button type="button" className="button-secondary" onClick={goNextDay}>→</button>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ border: '1px solid #cdd5e3', borderRadius: '0.4rem', padding: '0.35rem 0.5rem', fontSize: '0.9rem' }}
          />
        </div>

        {isManager ? (
          <DoctorFilter
            doctors={doctors}
            loading={doctorsLoading}
            selectedId={filterDoctorId}
            onSelect={setFilterDoctorId}
          />
        ) : null}

        <label className="doctor-search" style={{ minWidth: '200px' }}>
          <span>Поиск</span>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ФИО, услуга, врач" />
        </label>
      </div>

      {isManager && filterDoctorId ? (
        <p className="panel-muted" style={{ marginBottom: '0.25rem' }}>
          Врач: <strong>{filterDoctorName}</strong> — показаны все статусы.
          {' '}<button type="button" className="link-button" onClick={() => setFilterDoctorId('')}>Сбросить</button>
        </p>
      ) : null}

      {isManager && !filterDoctorId ? (
        <p className="panel-muted" style={{ marginBottom: '0.25rem' }}>
          Все врачи — активные записи (без завершённых и отменённых).
        </p>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="panel-muted">Загрузка записей…</p>
      ) : (
        <div className="doctor-patients-layout">
          <article className="doctor-list-panel" style={{ flex: selectedApt ? '0 0 48%' : '1 0 100%' }}>
            <div className="panel-header-row">
              <h2>Записи на {formatDate(`${filterDate}T00:00:00.000Z`)}</h2>
              <span className="panel-muted">{filteredAppointments.length} шт.</span>
            </div>

            <div className="patient-list">
              {filteredAppointments.length === 0 ? (
                <p className="panel-muted">Нет записей на выбранную дату.</p>
              ) : null}

              {filteredAppointments.map((apt) => {
                const isActive = apt.id === selectedApt?.id
                return (
                  <button
                    key={apt.id}
                    type="button"
                    className={isActive ? 'patient-card active' : 'patient-card'}
                    onClick={() => { setSelectedAptId(isActive ? null : apt.id); setCardMessage('') }}
                    style={{
                      padding: '0.6rem 0.7rem',
                      backgroundColor: isActive ? (STATUS_STYLES[apt.status] ?? '#f5f8fc') : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <p className="item-title" style={{ margin: 0 }}>{apt.patient?.full_name ?? 'Пациент'}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#59637a' }}>
                        {formatTime(apt.start_at)} – {formatTime(apt.end_at)}
                        {apt.doctor?.full_name ? ` • ${apt.doctor.full_name}` : ''}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a8699' }}>{apt.service?.name ?? '—'}</p>
                      <span className="status-pill" style={{ backgroundColor: STATUS_STYLES[apt.status] ?? '#f0f0f0', color: '#1d2433', fontSize: '0.75rem' }}>
                        {STATUS_LABELS[apt.status] ?? apt.status}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </article>

          {selectedApt ? (
            <article className="doctor-detail-panel">
              <div className="panel-header-row">
                <h2>Подробности записи</h2>
                <button type="button" className="link-button" onClick={() => { setSelectedAptId(null); setCardMessage('') }}>Закрыть</button>
              </div>
              <div className="form-grid">
                <label><span>Пациент</span><input type="text" value={selectedApt.patient?.full_name ?? '—'} readOnly /></label>
                <label><span>Телефон</span><input type="text" value={selectedApt.patient?.phone ?? '—'} readOnly /></label>
                {selectedApt.doctor?.full_name ? (
                  <label><span>Врач</span><input type="text" value={selectedApt.doctor.full_name} readOnly /></label>
                ) : null}
                <label><span>Услуга</span><input type="text" value={selectedApt.service?.name ?? '—'} readOnly /></label>
                <label><span>Начало</span><input type="text" value={`${formatDate(selectedApt.start_at)} ${formatTime(selectedApt.start_at)}`} readOnly /></label>
                <label><span>Окончание</span><input type="text" value={formatTime(selectedApt.end_at)} readOnly /></label>
                <label><span>Длительность</span><input type="text" value={`${getDuration(selectedApt.start_at, selectedApt.end_at)} мин`} readOnly /></label>
                <label><span>Стоимость</span><input type="text" value={selectedApt.booked_price != null ? `${selectedApt.booked_price} ₽` : '—'} readOnly /></label>
                <label><span>Статус</span><input type="text" value={STATUS_LABELS[selectedApt.status] ?? selectedApt.status} readOnly /></label>
                {selectedApt.comment ? <label className="form-span-2"><span>Комментарий</span><textarea readOnly value={selectedApt.comment} /></label> : null}
                {selectedApt.cancel_reason ? <label className="form-span-2"><span>Причина отмены</span><textarea readOnly value={selectedApt.cancel_reason} /></label> : null}
              </div>

              {cardMessage ? <p className="panel-feedback" style={{ marginTop: '1rem' }}>{cardMessage}</p> : null}

              {isManager ? (
                <div className="button-row" style={{ marginTop: '1rem' }}>
                  {selectedApt.status === 'created' ? (
                    <>
                      <button type="button" className="button-secondary" onClick={handleConfirm} disabled={actionLoading}>Подтвердить</button>
                      <button type="button" className="button-secondary" onClick={handleCancel} disabled={actionLoading}>Отменить</button>
                    </>
                  ) : null}
                  {selectedApt.status === 'confirmed' ? (
                    <>
                      <button type="button" className="button-secondary" onClick={handleComplete} disabled={actionLoading}>Завершить</button>
                      <button type="button" className="button-secondary" onClick={handleCancel} disabled={actionLoading}>Отменить</button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  )
}

function DoctorFilter({ doctors, loading, selectedId, onSelect }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const selected = useMemo(() => doctors.find((d) => d.id === selectedId) || null, [doctors, selectedId])

  useEffect(() => {
    setQuery(selected ? selected.full_name : '')
  }, [selected, selectedId])

  const filtered = useMemo(() => {
    const norm = query.trim().toLowerCase()
    if (!norm) return doctors
    return doctors.filter((d) => d.full_name.toLowerCase().includes(norm))
  }, [doctors, query])

  if (loading) return <span className="panel-muted">Загрузка врачей…</span>

  return (
    <label className="autocomplete-field" style={{ minWidth: '200px' }}>
      <span>Врач</span>
      <div className="autocomplete-root">
        <input
          value={query}
          placeholder="Все врачи"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          autoComplete="off"
        />
        {isOpen ? (
          <ul className="autocomplete-menu" role="listbox">
            <li>
              <button type="button" className="autocomplete-option" onMouseDown={(e) => { e.preventDefault(); onSelect(''); setQuery(''); setIsOpen(false) }}>
                Все врачи
              </button>
            </li>
            {filtered.map((d) => (
              <li key={d.id}>
                <button type="button" className="autocomplete-option" onMouseDown={(e) => { e.preventDefault(); onSelect(d.id); setQuery(d.full_name); setIsOpen(false) }}>
                  {d.full_name}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? <li className="autocomplete-empty">Врач не найден</li> : null}
          </ul>
        ) : null}
      </div>
    </label>
  )
}
