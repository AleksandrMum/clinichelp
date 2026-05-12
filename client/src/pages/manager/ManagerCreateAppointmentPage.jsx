import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'
import { searchPatients } from '../../services/patients'
import { listDoctors, getDoctorScheduleView, getDoctorAppointments } from '../../services/schedule'
import { listServices } from '../../services/services'
import { findFreeSlots, createAppointment } from '../../services/appointments'

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

function formatDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatSlotTime(isoString) {
  const d = new Date(isoString)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function formatSlotDate(isoString) {
  const d = new Date(isoString)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

const DISPLAY_START = 8
const DISPLAY_END = 20
const DISPLAY_HOURS = DISPLAY_END - DISPLAY_START
const HOUR_PX = 46
const TIMELINE_H = DISPLAY_HOURS * HOUR_PX

function timeToMinutes(t) {
  if (!t) return 0
  const parts = String(t).split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

function minutesToPx(min) {
  return ((min - DISPLAY_START * 60) / 60) * HOUR_PX
}

function isoToMinutes(iso) {
  const d = new Date(iso)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function clamp(min, val, max) {
  return Math.max(min, Math.min(val, max))
}

function buildDayAvailability(dateKey, rules, exceptions) {
  const date = new Date(dateKey + 'T00:00:00.000Z')
  const dow = date.getUTCDay()
  const weekday = dow === 0 ? 7 : dow

  let windows = []
  for (const r of rules) {
    if (r.weekday !== weekday || r.is_archived) continue
    const st = timeToMinutes(r.start_time)
    const en = timeToMinutes(r.end_time)
    if (en > st) windows.push([st, en])
  }

  const dayStart = date.getTime()
  const dayEnd = dayStart + 86400000

  for (const ex of exceptions) {
    const xs = new Date(ex.start_at).getTime()
    const xe = new Date(ex.end_at).getTime()
    if (xe <= dayStart || xs >= dayEnd) continue

    if (ex.exception_type === 'day_off') {
      if (xs <= dayStart && xe >= dayEnd) {
        windows = []
      }
    } else if (ex.exception_type === 'extra_shift') {
      const exS = new Date(ex.start_at)
      const exE = new Date(ex.end_at)
      windows.push([exS.getUTCHours() * 60 + exS.getUTCMinutes(), exE.getUTCHours() * 60 + exE.getUTCMinutes()])
    }
  }

  return windows
}

function SearchField({ label, placeholder, emptyText, items, selectedId, getItemId, getItemLabel, onSelect, loading }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState(-1)

  const selectedItem = useMemo(() => items.find((i) => getItemId(i) === selectedId) || null, [items, selectedId, getItemId])

  useEffect(() => { setQuery(selectedItem ? getItemLabel(selectedItem) : '') }, [selectedItem, selectedId, getItemLabel])

  const filtered = useMemo(() => {
    const n = query.trim().toLowerCase()
    if (!n) return items
    const m = items.filter((i) => getItemLabel(i).toLowerCase().includes(n))
    if (selectedItem && !m.some((i) => getItemId(i) === getItemId(selectedItem))) return [selectedItem, ...m]
    return m
  }, [items, query, selectedItem, getItemId, getItemLabel])

  if (loading) return <label className="autocomplete-field"><span>{label}</span><p className="panel-muted">Загрузка…</p></label>

  return (
    <label className="autocomplete-field">
      <span>{label}</span>
      <div className="autocomplete-root">
        <input value={query} placeholder={placeholder} onFocus={() => setIsOpen(true)} onBlur={() => setIsOpen(false)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHoveredIdx(-1) }} autoComplete="off" aria-autocomplete="list" aria-expanded={isOpen} />
        {isOpen ? (
          <ul className="autocomplete-menu" role="listbox">
            {filtered.length ? filtered.map((item, idx) => (
              <li key={getItemId(item)}>
                <button type="button" className={idx === hoveredIdx ? 'autocomplete-option active' : 'autocomplete-option'}
                  onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(-1)}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(item); setQuery(getItemLabel(item)); setIsOpen(false); setHoveredIdx(-1) }}>
                  {getItemLabel(item)}
                </button>
              </li>
            )) : <li className="autocomplete-empty">{emptyText}</li>}
          </ul>
        ) : null}
      </div>
    </label>
  )
}

function DayTimeline({ dateKey, rules, exceptions, appointments, selectedSlot }) {
  const windows = useMemo(() => buildDayAvailability(dateKey, rules, exceptions), [dateKey, rules, exceptions])

  const busyBlocks = useMemo(() => {
    return appointments
      .filter((a) => a.status !== 'cancelled')
      .map((a) => {
        const s = isoToMinutes(a.start_at)
        const e = isoToMinutes(a.end_at)
        return { s, e, patient: a.patient?.full_name ?? '', service: a.service?.name ?? '' }
      })
      .filter((b) => b.e > DISPLAY_START * 60 && b.s < DISPLAY_END * 60)
  }, [appointments])

  const displayStart = DISPLAY_START * 60
  const displayEnd = DISPLAY_END * 60
  const selectedStart = selectedSlot ? isoToMinutes(selectedSlot.startAt) : null
  const selectedEnd = selectedSlot ? isoToMinutes(selectedSlot.endAt) : null

  return (
    <div className="apt-timeline-wrap">
      <div className="apt-timeline-hours">
        {Array.from({ length: DISPLAY_HOURS }, (_, i) => (
          <div key={i} className="apt-timeline-hour-label" style={{ height: `${HOUR_PX}px` }}>
            {String(DISPLAY_START + i).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="apt-timeline-body" style={{ height: `${TIMELINE_H}px` }}>
        {windows.map(([ws, we], idx) => {
          const top = minutesToPx(clamp(displayStart, ws, displayEnd))
          const bot = minutesToPx(clamp(displayStart, we, displayEnd))
          if (bot <= top) return null
          return <div key={`w${idx}`} className="apt-tl-avail" style={{ top: `${top}px`, height: `${bot - top}px` }} />
        })}

        {busyBlocks.map((b, idx) => {
          const top = minutesToPx(clamp(displayStart, b.s, displayEnd))
          const bot = minutesToPx(clamp(displayStart, b.e, displayEnd))
          if (bot <= top) return null
          return (
            <div key={`b${idx}`} className="apt-tl-busy" style={{ top: `${top}px`, height: `${bot - top}px` }} title={`${b.patient} — ${b.service}`}>
              <span className="apt-tl-busy-label">{b.patient}</span>
            </div>
          )
        })}

        {selectedStart != null ? (
          <div className="apt-tl-selected" style={{
            top: `${minutesToPx(clamp(displayStart, selectedStart, displayEnd))}px`,
            height: `${minutesToPx(clamp(displayStart, selectedEnd, displayEnd)) - minutesToPx(clamp(displayStart, selectedStart, displayEnd))}px`,
          }} />
        ) : null}

        <div className="apt-tl-grid">
          {Array.from({ length: DISPLAY_HOURS }, (_, i) => (
            <div key={i} style={{ height: `${HOUR_PX}px`, borderBottom: '1px solid #edf2fb' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const DAY_NAMES = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MONTH_NAMES_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return {
      key: formatDateInput(d),
      day: DAY_NAMES[d.getDay()],
      label: `${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES_SHORT[d.getMonth()]}`,
    }
  })
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function ManagerCreateAppointmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER

  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)

  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [comment, setComment] = useState('')

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateInput(new Date()))

  const [scheduleRules, setScheduleRules] = useState([])
  const [scheduleExceptions, setScheduleExceptions] = useState([])
  const [dayAppointments, setDayAppointments] = useState([])
  const [daySlots, setDaySlots] = useState([])

  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotMessage, setSlotMessage] = useState('')
  const [timeInput, setTimeInput] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [apiError, setApiError] = useState('')
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    if (!isManager) return
    let c = false
    setPatientsLoading(true)
    searchPatients({ limit: 500 }).then((e) => { if (!c) setPatients(e.data ?? []) }).catch(() => { if (!c) setPatients([]) }).finally(() => { if (!c) setPatientsLoading(false) })
    return () => { c = true }
  }, [isManager])

  useEffect(() => {
    if (!isManager) return
    let c = false
    setDoctorsLoading(true)
    listDoctors().then((e) => { if (!c) setDoctors(e.data ?? []) }).catch(() => { if (!c) setDoctors([]) }).finally(() => { if (!c) setDoctorsLoading(false) })
    return () => { c = true }
  }, [isManager])

  useEffect(() => {
    if (!isManager) return
    let c = false
    setServicesLoading(true)
    listServices({ isAvailable: true, limit: 200 }).then((e) => { if (!c) setServices(e.data ?? []) }).catch(() => { if (!c) setServices([]) }).finally(() => { if (!c) setServicesLoading(false) })
    return () => { c = true }
  }, [isManager])

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const weekFrom = useMemo(() => formatDateInput(weekStart) + 'T00:00:00.000Z', [weekStart])

  const weekTo = useMemo(() => formatDateInput(addDays(weekStart, 7)) + 'T00:00:00.000Z', [weekStart])

  useEffect(() => {
    if (!doctorId) { setScheduleRules([]); setScheduleExceptions([]); return }
    let c = false
    setScheduleLoading(true); setScheduleError('')
    getDoctorScheduleView(doctorId, { from: weekFrom, to: weekTo })
      .then((env) => {
        if (c) return
        const d = env.data ?? {}
        setScheduleRules(d.weekly_rules ?? [])
        setScheduleExceptions(d.exceptions ?? [])
      })
      .catch((err) => { if (!c) setScheduleError(extractApiError(err)) })
      .finally(() => { if (!c) setScheduleLoading(false) })
    return () => { c = true }
  }, [doctorId, weekFrom, weekTo])

  const loadDayData = useCallback(async () => {
    if (!doctorId || !serviceId || !selectedDateKey) {
      setDayAppointments([]); setDaySlots([]); return
    }
    setSlotsLoading(true)
    const from = `${selectedDateKey}T00:00:00.000Z`
    const to = `${selectedDateKey}T23:59:59.000Z`
    const toSlots = new Date(new Date(selectedDateKey + 'T00:00:00.000Z').getTime() + 86400000).toISOString()
    try {
      const [aptsEnv, slotsEnv] = await Promise.all([
        getDoctorAppointments(doctorId, { from, to, limit: 200 }),
        findFreeSlots({ doctorId, serviceId, from, to: toSlots }),
      ])
      setDayAppointments(aptsEnv.data ?? [])
      setDaySlots(slotsEnv.data ?? [])
    } catch (err) {
      setDayAppointments([]); setDaySlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctorId, serviceId, selectedDateKey])

  useEffect(() => { loadDayData() }, [loadDayData])

  const slotsSet = useMemo(() => new Set(daySlots.map((s) => s.startAt)), [daySlots])

  const selectedService = services.find((s) => s.id === serviceId) || null
  const durationMin = selectedService?.duration_min ?? 30

  const canShowTimeline = Boolean(doctorId && serviceId)

  function handleDoctorChange(doc) {
    setDoctorId(doc.id); setSelectedSlot(null); setSlotMessage(''); setTimeInput(''); setApiError(''); setSuccessData(null)
  }
  function handleServiceChange(svc) {
    setServiceId(svc.id); setSelectedSlot(null); setSlotMessage(''); setTimeInput(''); setApiError(''); setSuccessData(null)
  }
  function handlePatientChange(pat) {
    setPatientId(pat.id); setValidationError(''); setApiError(''); setSuccessData(null)
  }

  function validateTime(time) {
    if (!time || !selectedDateKey) { setSelectedSlot(null); setSlotMessage(''); return }

    const startIso = `${selectedDateKey}T${time}:00.000Z`
    const minutes = timeToMinutes(time)
    const endMin = minutes + durationMin
    const endIso = `${selectedDateKey}T${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00.000Z`

    if (slotsSet.has(startIso)) {
      setSelectedSlot({ startAt: startIso, endAt: endIso })
      setSlotMessage('')
      setValidationError('')
    } else {
      setSelectedSlot(null)
      const windows = buildDayAvailability(selectedDateKey, scheduleRules, scheduleExceptions)
      const insideWindow = windows.some(([ws, we]) => minutes >= ws && endMin <= we)
      const isBusy = dayAppointments
        .filter((a) => a.status !== 'cancelled')
        .some((a) => {
          const as = isoToMinutes(a.start_at)
          const ae = isoToMinutes(a.end_at)
          return minutes < ae && endMin > as
        })
      if (isBusy) setSlotMessage('Это время уже занято.')
      else if (!insideWindow) setSlotMessage('Нерабочее время.')
      else setSlotMessage('Слот недоступен для выбранной услуги.')
    }
  }

  function handleTimeChange(e) {
    const val = e.target.value
    setTimeInput(val)
    validateTime(val)
  }

  function goPrevWeek() { setWeekStart((p) => addDays(p, -7)); setSelectedSlot(null); setSlotMessage(''); setTimeInput('') }
  function goNextWeek() { setWeekStart((p) => addDays(p, 7)); setSelectedSlot(null); setSlotMessage(''); setTimeInput('') }
  function goThisWeek() { setWeekStart(getMonday(new Date())); setSelectedSlot(null); setSlotMessage(''); setTimeInput('') }

  function selectDay(key) { setSelectedDateKey(key); setSelectedSlot(null); setSlotMessage(''); setTimeInput('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setValidationError(''); setApiError('')

    if (!patientId) { setValidationError('Выберите пациента.'); return }
    if (!doctorId) { setValidationError('Выберите врача.'); return }
    if (!serviceId) { setValidationError('Выберите услугу.'); return }
    if (!selectedSlot) { setValidationError('Укажите время начала приёма.'); return }

    setSubmitting(true)
    try {
      const env = await createAppointment({
        patientId, doctorId, serviceId,
        startAt: selectedSlot.startAt,
        comment: comment.trim() || undefined,
      })
      setSuccessData(env.data)
    } catch (err) {
      const msg = extractApiError(err)
      if (err.response?.status === 409) {
        setApiError(`Конфликт слота: ${msg}. Попробуйте другой слот.`)
        loadDayData()
      } else { setApiError(msg) }
    } finally { setSubmitting(false) }
  }

  function resetForm() {
    setPatientId(''); setDoctorId(''); setServiceId(''); setComment('')
    setSelectedSlot(null); setSuccessData(null); setValidationError(''); setApiError(''); setSlotMessage(''); setTimeInput('')
    setWeekStart(getMonday(new Date())); setSelectedDateKey(formatDateInput(new Date()))
  }

  if (!isManager) return <PlaceholderPage title="Создание записи на приём" />

  if (successData) {
    const apt = successData
    return (
      <section className="content-card doctor-page">
        <div className="doctor-page-head">
          <div><h1>Запись создана</h1><p>Запись на приём успешно создана.</p></div>
        </div>
        <article className="admin-panel">
          <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.95rem' }}>
            <p><strong>Пациент:</strong> {apt.patient?.full_name ?? '—'}</p>
            <p><strong>Услуга:</strong> {apt.service?.name ?? '—'}</p>
            <p><strong>Начало:</strong> {formatSlotDate(apt.start_at)} {formatSlotTime(apt.start_at)}</p>
            <p><strong>Окончание:</strong> {formatSlotTime(apt.end_at)}</p>
            <p><strong>Стоимость:</strong> {apt.booked_price != null ? `${apt.booked_price} ₽` : '—'}</p>
            {apt.comment ? <p><strong>Комментарий:</strong> {apt.comment}</p> : null}
            <p><strong>Статус:</strong> Создана</p>
          </div>
        </article>
        <div className="button-row" style={{ marginTop: '1rem' }}>
          <button type="button" onClick={resetForm}>Создать ещё</button>
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/appointments')}>К списку записей</button>
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/schedule')}>Расписание</button>
        </div>
      </section>
    )
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div><h1>Создание записи на приём</h1><p>Выберите пациента, врача, услугу, затем укажите день и время.</p></div>
        <div className="doctor-head-actions">
          <button type="button" className="text-button" onClick={() => navigate('/manager/appointments')}>← Назад</button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid form-grid-two-col" style={{ marginBottom: '1rem' }}>
          <SearchField label="Пациент *" placeholder="ФИО пациента" emptyText="Не найден" items={patients} selectedId={patientId}
            getItemId={(p) => p.id} getItemLabel={(p) => p.full_name} onSelect={handlePatientChange} loading={patientsLoading} />
          <SearchField label="Врач *" placeholder="ФИО врача" emptyText="Не найден" items={doctors} selectedId={doctorId}
            getItemId={(d) => d.id} getItemLabel={(d) => d.full_name} onSelect={handleDoctorChange} loading={doctorsLoading} />
          <div className="form-span-2">
            <SearchField label="Услуга *" placeholder="Название услуги" emptyText="Не найдена" items={services} selectedId={serviceId}
              getItemId={(s) => s.id} getItemLabel={(s) => `${s.name} (${s.duration_min} мин) — ${s.price} ₽`} onSelect={handleServiceChange} loading={servicesLoading} />
          </div>
          <label className="form-span-2">
            <span>Комментарий</span>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Примечание к записи (необязательно)" />
          </label>
        </div>

        {canShowTimeline ? (
          <article className="admin-panel" style={{ marginBottom: '1rem' }}>
            <div className="panel-header-row" style={{ marginBottom: '0.5rem' }}>
              <h2>Выбор времени</h2>
              <div className="doctor-head-actions schedule-nav">
                <button type="button" className="button-secondary" onClick={goPrevWeek}>←</button>
                <button type="button" className="button-secondary" onClick={goThisWeek}>Сегодня</button>
                <button type="button" className="button-secondary" onClick={goNextWeek}>→</button>
              </div>
            </div>

            {selectedService ? (
              <p className="panel-muted" style={{ marginBottom: '0.5rem' }}>Длительность: {durationMin} мин</p>
            ) : null}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="apt-day-tabs" style={{ flex: '1 1 auto' }}>
                {weekDays.map((wd) => (
                  <button key={wd.key} type="button"
                    className={wd.key === selectedDateKey ? 'apt-day-tab active' : 'apt-day-tab'}
                    onClick={() => selectDay(wd.key)}>
                    <span className="apt-day-tab-name">{wd.day}</span>
                    <span className="apt-day-tab-date">{wd.label}</span>
                  </button>
                ))}
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '140px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e374a' }}>Время начала</span>
                <input
                  type="time"
                  value={timeInput}
                  onChange={handleTimeChange}
                  step="900"
                  style={{ padding: '0.45rem 0.5rem', border: '1px solid #cdd5e3', borderRadius: '0.4rem', fontSize: '0.95rem' }}
                />
              </label>
            </div>

            {scheduleError ? <p className="error-text">{scheduleError}</p> : null}

            {scheduleLoading || slotsLoading ? (
              <p className="panel-muted">Загрузка расписания…</p>
            ) : (
              <DayTimeline
                dateKey={selectedDateKey}
                rules={scheduleRules}
                exceptions={scheduleExceptions}
                appointments={dayAppointments}
                selectedSlot={selectedSlot}
              />
            )}

            {slotMessage ? (
              <p className="panel-feedback" style={{ color: '#b10030', borderLeftColor: '#b10030', marginTop: '0.5rem' }}>
                {slotMessage}
              </p>
            ) : null}

            {selectedSlot ? (
              <p className="panel-feedback" style={{ marginTop: '0.5rem' }}>
                Выбран слот: {formatSlotDate(selectedSlot.startAt)} {formatSlotTime(selectedSlot.startAt)} – {formatSlotTime(selectedSlot.endAt)}
              </p>
            ) : null}
          </article>
        ) : null}

        {validationError ? <p className="panel-feedback" style={{ color: '#b10030', borderLeftColor: '#b10030' }}>{validationError}</p> : null}
        {apiError ? <p className="panel-feedback" style={{ color: '#b10030', borderLeftColor: '#b10030' }}>{apiError}</p> : null}

        <div className="button-row" style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={submitting}>{submitting ? 'Создание…' : 'Создать запись'}</button>
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/appointments')}>Отмена</button>
        </div>
      </form>
    </section>
  )
}
