import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { getDoctorScheduleView, getDoctorAppointments } from '../../services/schedule'
import { PlaceholderPage } from './PlaceholderPage'

const HOUR_HEIGHT = 46
const DAY_LINE_HEIGHT = `${HOUR_HEIGHT}px`
const DISPLAY_START_HOUR = 8
const DISPLAY_END_HOUR = 20
const DISPLAY_START_MINUTES = DISPLAY_START_HOUR * 60
const DISPLAY_END_MINUTES = DISPLAY_END_HOUR * 60
const VISIBLE_HOURS = DISPLAY_END_HOUR - DISPLAY_START_HOUR
const GAP_PX = 8

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const APPOINTMENT_STATUS_LABELS = {
  created: 'Создана',
  confirmed: 'Подтверждена',
  completed: 'Проведена',
  cancelled: 'Отменена',
}

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDayLabel(date) {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTH_NAMES[date.getMonth()]}`
}

function formatRangeLabel(monday) {
  const sunday = addDays(monday, 6)
  const from = `${String(monday.getDate()).padStart(2, '0')}.${String(monday.getMonth() + 1).padStart(2, '0')}.${monday.getFullYear()}`
  const to = `${String(sunday.getDate()).padStart(2, '0')}.${String(sunday.getMonth() + 1).padStart(2, '0')}.${sunday.getFullYear()}`
  return `${from} — ${to}`
}

function isoWeekday(date) {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

function timeToMinutes(time) {
  if (!time) return 0
  const parts = String(time).split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

function minutesToDisplayPx(minutesFromMidnight) {
  return ((minutesFromMidnight - DISPLAY_START_MINUTES) / 60) * HOUR_HEIGHT
}

function buildWeekDays(monday, rules, exceptions) {
  const rulesByWeekday = {}
  for (const rule of rules) {
    const wd = rule.weekday
    if (!rulesByWeekday[wd]) rulesByWeekday[wd] = []
    rulesByWeekday[wd].push(rule)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const dateKey = formatDateKey(date)
    const wd = isoWeekday(date)

    const dayRules = (rulesByWeekday[wd] || [])
      .filter((r) => !r.is_archived)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

    let windows = dayRules.map((r) => {
      const st = r.start_time?.substring(0, 5) || '00:00'
      const en = r.end_time?.substring(0, 5) || '00:00'
      return [st, en]
    })

    const dayExceptions = exceptions.filter((ex) => {
      const exStart = new Date(ex.start_at)
      const exEnd = new Date(ex.end_at)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      return exStart <= dayEnd && exEnd >= dayStart
    })

    for (const ex of dayExceptions) {
      if (ex.exception_type === 'day_off') {
        const exStart = new Date(ex.start_at)
        const exEnd = new Date(ex.end_at)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        if (exStart <= dayStart && exEnd >= dayEnd) {
          windows = []
        }
      } else if (ex.exception_type === 'extra_shift') {
        const exStart = new Date(ex.start_at)
        const exEnd = new Date(ex.end_at)
        const h1 = String(exStart.getHours()).padStart(2, '0')
        const m1 = String(exStart.getMinutes()).padStart(2, '0')
        const h2 = String(exEnd.getHours()).padStart(2, '0')
        const m2 = String(exEnd.getMinutes()).padStart(2, '0')
        windows.push([`${h1}:${m1}`, `${h2}:${m2}`])
      }
    }

    return {
      date: dateKey,
      day: DAY_NAMES[i],
      label: formatDayLabel(date),
      windows,
      exceptions: dayExceptions,
    }
  })
}

function appointmentToEvent(apt) {
  const startAt = new Date(apt.start_at)
  const endAt = new Date(apt.end_at)

  const startTime = `${String(startAt.getHours()).padStart(2, '0')}:${String(startAt.getMinutes()).padStart(2, '0')}`
  const endTime = `${String(endAt.getHours()).padStart(2, '0')}:${String(endAt.getMinutes()).padStart(2, '0')}`
  const dateKey = formatDateKey(startAt)

  return {
    id: apt.id,
    date: dateKey,
    start: startTime,
    end: endTime,
    status: apt.status === 'cancelled' ? 'unavailable' : 'busy',
    title: apt.service?.name ?? 'Приём',
    patient: apt.patient?.full_name ?? null,
    patientPhone: apt.patient?.phone ?? null,
    service: apt.service?.name ?? null,
    appointmentStatus: apt.status,
    comment: apt.comment ?? null,
    cancelReason: apt.cancel_reason ?? null,
  }
}

function getDayMetrics(day, events) {
  const availableMinutes = day.windows.reduce(
    (sum, [start, end]) => sum + (timeToMinutes(end) - timeToMinutes(start)),
    0,
  )
  const busyMinutes = events
    .filter((e) => e.status === 'busy')
    .reduce((sum, e) => sum + (timeToMinutes(e.end) - timeToMinutes(e.start)), 0)

  return {
    availableMinutes,
    busyMinutes,
    freeMinutes: Math.max(0, availableMinutes - busyMinutes),
  }
}

function buildEventLanes(events) {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  )
  const laneEnds = []

  const laidOut = sorted.map((event) => {
    const start = timeToMinutes(event.start)
    const end = timeToMinutes(event.end)
    let laneIndex = laneEnds.findIndex((le) => le <= start)

    if (laneIndex === -1) {
      laneIndex = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[laneIndex] = end
    }

    return { ...event, laneIndex, laneCount: 1, startMinutes: start, endMinutes: end }
  })

  const laneCount = Math.max(1, laneEnds.length)
  return laidOut.map((e) => ({ ...e, laneCount }))
}

function clampEventToDisplayRange(events) {
  return events
    .map((event) => {
      const start = Math.max(timeToMinutes(event.start), DISPLAY_START_MINUTES)
      const end = Math.min(timeToMinutes(event.end), DISPLAY_END_MINUTES)
      if (end <= start) return null
      return {
        ...event,
        start: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
        end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
      }
    })
    .filter(Boolean)
}

export function SchedulePage() {
  const { user } = useAuth()
  const isDoctor = user?.role === ROLES.DOCTOR
  const isManager = user?.role === ROLES.MANAGER

  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [weekDays, setWeekDays] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [focusedDayKey, setFocusedDayKey] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [scheduleMessage, setScheduleMessage] = useState('')

  const doctorId = isDoctor ? user?.id : null

  const loadSchedule = useCallback(async () => {
    if (!doctorId) return
    setLoading(true)
    setError('')
    try {
      const from = formatDateKey(monday) + 'T00:00:00'
      const to = formatDateKey(addDays(monday, 7)) + 'T00:00:00'

      const [viewEnv, aptsEnv] = await Promise.all([
        getDoctorScheduleView(doctorId, { from, to }),
        getDoctorAppointments(doctorId, { from, to, limit: 200 }),
      ])

      const viewData = viewEnv.data ?? {}
      const rules = viewData.weekly_rules ?? []
      const exceptions = viewData.exceptions ?? []
      const appointments = aptsEnv.data ?? []

      const days = buildWeekDays(monday, rules, exceptions)
      setWeekDays(days)

      const mapped = appointments.map(appointmentToEvent)
      setEvents(clampEventToDisplayRange(mapped))

      if (days.length > 0 && !days.find((d) => d.date === focusedDayKey)) {
        setFocusedDayKey(days[0].date)
      }
    } catch (err) {
      setError(extractApiError(err))
      setWeekDays([])
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [doctorId, monday, focusedDayKey])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  useEffect(() => {
    if (weekDays.length > 0 && !weekDays.find((d) => d.date === focusedDayKey)) {
      setFocusedDayKey(weekDays[0].date)
    }
  }, [weekDays, focusedDayKey])

  const weekRows = useMemo(
    () =>
      weekDays.map((day) => {
        const eventsForDay = events.filter((e) => e.date === day.date)
        return {
          ...day,
          events: eventsForDay,
          laidOutEvents: buildEventLanes(eventsForDay),
          metrics: getDayMetrics(day, eventsForDay),
        }
      }),
    [weekDays, events],
  )

  const focusedDay = weekRows.find((d) => d.date === focusedDayKey) || weekRows[0] || null
  const selectedEvent = selectedEventId
    ? events.find((e) => e.id === selectedEventId) || null
    : null

  function goPrevWeek() {
    setMonday((prev) => addDays(prev, -7))
    setSelectedEventId('')
    setScheduleMessage('')
  }

  function goNextWeek() {
    setMonday((prev) => addDays(prev, 7))
    setSelectedEventId('')
    setScheduleMessage('')
  }

  function goToday() {
    setMonday(getMonday(new Date()))
    setSelectedEventId('')
    setScheduleMessage('')
  }

  function focusDay(day) {
    setFocusedDayKey(day.date)
    setSelectedEventId(day.events[0]?.id ?? '')
    setScheduleMessage(`${day.day} ${day.label} открыт в недельной сетке.`)
  }

  function selectEvent(event) {
    setSelectedEventId(event.id)
    setFocusedDayKey(event.date)
    const label = event.status === 'busy'
      ? `${event.start} – ${event.end}: «${event.title}»${event.patient ? `, пациент ${event.patient}` : ''}.`
      : `${event.start} – ${event.end}: ${event.title}.`
    setScheduleMessage(label)
  }

  function closeEventPopover() {
    setSelectedEventId('')
    setScheduleMessage('')
  }

  function handleEmptySlotAction(day) {
    setFocusedDayKey(day.date)
    setSelectedEventId('')
    setScheduleMessage(`${day.day} ${day.label}: свободный слот.`)
  }

  if (!isDoctor && !isManager) {
    return <PlaceholderPage title="Расписание" />
  }

  if (isManager) {
    return (
      <section className="content-card doctor-page">
        <div className="doctor-page-head">
          <div>
            <h1>Расписание</h1>
            <p>Общая недельная сетка с выбором врача.</p>
          </div>
        </div>
        <article className="admin-panel">
          <p className="panel-muted">
            Расписание менеджера будет подключено в следующей задаче. Используйте раздел «Записи на приём» для управления записями.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Моё расписание</h1>
          <p>Недельная сетка вашего рабочего расписания и записей на приём.</p>
        </div>

        <div className="doctor-head-actions schedule-nav">
          <button type="button" className="button-secondary" onClick={goPrevWeek}>←</button>
          <button type="button" className="button-secondary" onClick={goToday}>Сегодня</button>
          <button type="button" className="button-secondary" onClick={goNextWeek}>→</button>
          <span className="panel-muted">{formatRangeLabel(monday)}</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="panel-muted">Загрузка расписания…</p>
      ) : (
        <>
          <div className="schedule-legend">
            <span>
              <i className="legend-dot free" /> Свободно
            </span>
            <span>
              <i className="legend-dot busy" /> Занято
            </span>
            <span>
              <i className="legend-dot unavailable" /> Недоступно / Отменено
            </span>
          </div>

          {weekRows.length === 0 ? (
            <p className="panel-muted">Расписание на эту неделю не настроено.</p>
          ) : (
            <div className="schedule-week-shell">
              <div className="schedule-week-header">
                <div className="schedule-time-header">
                  <span>Часы</span>
                </div>

                {weekRows.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={focusedDay?.date === day.date ? 'day-header active' : 'day-header'}
                    onClick={() => focusDay(day)}
                    title={`Выбрать ${day.day} ${day.label}`}
                  >
                    <span className="day-header-title">
                      <span style={{ display: 'block', fontWeight: '700', fontSize: '0.95rem' }}>
                        {day.day}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#59637a', marginTop: '0.2rem' }}>
                        {day.label}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="schedule-week-body" style={{ '--hour-height': DAY_LINE_HEIGHT }}>
                <div className="time-rail" aria-hidden>
                  {Array.from({ length: VISIBLE_HOURS }, (_, index) => {
                    const hour = DISPLAY_START_HOUR + index
                    return (
                      <div key={hour} className="time-rail-label">
                        <span>{String(hour).padStart(2, '0')}:00</span>
                      </div>
                    )
                  })}
                </div>

                {weekRows.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className={day.windows.length === 0 ? 'day-column off' : 'day-column'}
                    style={{
                      '--hour-height': DAY_LINE_HEIGHT,
                      height: `${VISIBLE_HOURS * HOUR_HEIGHT}px`,
                      minHeight: `${VISIBLE_HOURS * HOUR_HEIGHT}px`,
                    }}
                    onClick={() => handleEmptySlotAction(day)}
                    role="presentation"
                  >
                    {day.windows.map(([start, end]) => {
                      const startMin = Math.max(timeToMinutes(start), DISPLAY_START_MINUTES)
                      const endMin = Math.min(timeToMinutes(end), DISPLAY_END_MINUTES)
                      if (endMin <= startMin) return null
                      return (
                        <span
                          key={`${day.date}-${start}-${end}`}
                          className="availability-window"
                          style={{
                            top: `${minutesToDisplayPx(startMin)}px`,
                            height: `${minutesToDisplayPx(endMin) - minutesToDisplayPx(startMin)}px`,
                          }}
                        />
                      )
                    })}

                    <div className="day-hour-grid" aria-hidden />

                    {day.laidOutEvents.map((event) => {
                      const durationMinutes = event.endMinutes - event.startMinutes
                      const top = minutesToDisplayPx(event.startMinutes)
                      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 22)
                      const widthPercent = 100 / event.laneCount
                      const left = `${(event.laneIndex / event.laneCount) * 100}%`
                      const isActive = selectedEvent?.id === event.id

                      return (
                        <div key={event.id}>
                          <button
                            type="button"
                            className={
                              isActive
                                ? `calendar-event ${event.status} active`
                                : `calendar-event ${event.status}`
                            }
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left,
                              width: `calc(${widthPercent}% - ${GAP_PX}px)`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectEvent(event)
                            }}
                          >
                            <span className="event-title">{event.title}</span>
                          </button>

                          {isActive ? (
                            <div
                              className={dayIndex >= 5 ? 'event-popover left' : 'event-popover'}
                              style={{
                                top: `${top}px`,
                                left: dayIndex >= 5 ? 'auto' : `calc(${left} + ${widthPercent}% + 6px)`,
                                right: dayIndex >= 5 ? `calc(100% - ${left} + 6px)` : 'auto',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="event-popover-head">
                                <strong>{event.title}</strong>
                                <button type="button" className="link-button" onClick={closeEventPopover}>
                                  Закрыть
                                </button>
                              </div>
                              <p>{event.start} – {event.end}</p>
                              {event.patient ? <p>Пациент: {event.patient}</p> : null}
                              {event.patientPhone ? <p>Телефон: {event.patientPhone}</p> : null}
                              {event.service ? <p>Услуга: {event.service}</p> : null}
                              {event.comment ? <p>Комментарий: {event.comment}</p> : null}
                              {event.appointmentStatus === 'cancelled' && event.cancelReason ? (
                                <p>Причина отмены: {event.cancelReason}</p>
                              ) : null}
                              <p className="event-popover-status">
                                {APPOINTMENT_STATUS_LABELS[event.appointmentStatus] ?? event.appointmentStatus}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <article className="admin-panel">
            <div className="panel-header-row">
              <h2>Подробности записи</h2>
              <span className="panel-muted">
                {focusedDay ? `${focusedDay.day} • ${focusedDay.label}` : 'День не выбран'}
              </span>
            </div>

            {focusedDay ? (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className="panel-muted">
                  Рабочие окна: {focusedDay.windows.length > 0
                    ? focusedDay.windows.map(([s, e]) => `${s}–${e}`).join(', ')
                    : 'Выходной'}
                </span>
                <span className="panel-muted">
                  Записей: {focusedDay.events?.length ?? 0}
                </span>
              </div>
            ) : null}

            <p className="panel-feedback">
              {scheduleMessage || 'Выберите запись в сетке, чтобы открыть подробности приёма.'}
            </p>
          </article>
        </>
      )}
    </section>
  )
}
