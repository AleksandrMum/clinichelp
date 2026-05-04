import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from './PlaceholderPage'

const HOUR_HEIGHT = 46
const DAY_LINE_HEIGHT = `${HOUR_HEIGHT}px`
const DISPLAY_START_HOUR = 8
const DISPLAY_END_HOUR = 18
const DISPLAY_START_MINUTES = DISPLAY_START_HOUR * 60
const DISPLAY_END_MINUTES = DISPLAY_END_HOUR * 60
const VISIBLE_HOURS = DISPLAY_END_HOUR - DISPLAY_START_HOUR
const GAP_PX = 8

// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { DOCTORS, WEEK_DAYS, WEEK_EVENTS, EVENT_STATUS_LABELS } from '../TEMP/scheduleMocks'

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToDisplayPx(minutesFromMidnight) {
  return ((minutesFromMidnight - DISPLAY_START_MINUTES) / 60) * HOUR_HEIGHT
}

function formatWindowLabel(windows) {
  if (windows.length === 0) {
    return 'Выходной'
  }

  return windows.map(([start, end]) => `${start} - ${end}`).join(', ')
}

function getDayMetrics(day, events) {
  const availableMinutes = day.windows.reduce(
    (sum, [start, end]) => sum + (timeToMinutes(end) - timeToMinutes(start)),
    0,
  )
  const busyMinutes = events
    .filter((event) => event.status === 'busy')
    .reduce((sum, event) => sum + (timeToMinutes(event.end) - timeToMinutes(event.start)), 0)
  const bufferMinutes = events
    .filter((event) => event.status === 'buffer')
    .reduce((sum, event) => sum + (timeToMinutes(event.end) - timeToMinutes(event.start)), 0)
  const unavailableMinutes = events
    .filter((event) => event.status === 'unavailable')
    .reduce((sum, event) => sum + (timeToMinutes(event.end) - timeToMinutes(event.start)), 0)

  return {
    availableMinutes,
    busyMinutes,
    bufferMinutes,
    unavailableMinutes,
    freeMinutes: Math.max(0, availableMinutes - busyMinutes - bufferMinutes - unavailableMinutes),
  }
}

function buildEventLanes(events) {
  const sorted = [...events].sort(
    (left, right) => timeToMinutes(left.start) - timeToMinutes(right.start),
  )
  const laneEnds = []

  const laidOut = sorted.map((event) => {
    const start = timeToMinutes(event.start)
    const end = timeToMinutes(event.end)
    let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= start)

    if (laneIndex === -1) {
      laneIndex = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[laneIndex] = end
    }

    return {
      ...event,
      laneIndex,
      laneCount: 1,
      startMinutes: start,
      endMinutes: end,
    }
  })

  const laneCount = Math.max(1, laneEnds.length)

  return laidOut.map((event) => ({
    ...event,
    laneCount,
  }))
}

function clampEventToDisplayRange(events) {
  return events
    .map((event) => {
      const start = Math.max(timeToMinutes(event.start), DISPLAY_START_MINUTES)
      const end = Math.min(timeToMinutes(event.end), DISPLAY_END_MINUTES)

      if (end <= start) {
        return null
      }

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
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0])
  const [focusedDayKey, setFocusedDayKey] = useState(WEEK_DAYS[0].date)
  const [selectedEventId, setSelectedEventId] = useState(WEEK_EVENTS[0].id)
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const activeDoctor = isDoctor ? 'Смирнов Артем Игоревич' : selectedDoctor

  const visibleEvents = useMemo(
    () => clampEventToDisplayRange(WEEK_EVENTS.filter((event) => event.doctor === activeDoctor)),
    [activeDoctor],
  )

  const weekRows = useMemo(
    () =>
      WEEK_DAYS.map((day) => {
        const eventsForDay = visibleEvents.filter((event) => event.date === day.date)
        return {
          ...day,
          events: eventsForDay,
          laidOutEvents: buildEventLanes(eventsForDay),
          metrics: getDayMetrics(day, eventsForDay),
        }
      }),
    [visibleEvents],
  )

  const focusedDay = weekRows.find((day) => day.date === focusedDayKey) || weekRows[0]
  const selectedEvent = selectedEventId
    ? visibleEvents.find((event) => event.id === selectedEventId) || null
    : null

  const totalBusyMinutes = weekRows.reduce((sum, day) => sum + day.metrics.busyMinutes, 0)
  const totalBufferMinutes = weekRows.reduce((sum, day) => sum + day.metrics.bufferMinutes, 0)
  const totalUnavailableMinutes = weekRows.reduce((sum, day) => sum + day.metrics.unavailableMinutes, 0)
  const totalFreeMinutes = weekRows.reduce((sum, day) => sum + day.metrics.freeMinutes, 0)

  function focusDay(day) {
    setFocusedDayKey(day.date)
    setSelectedEventId(day.events[0]?.id ?? '')
    setScheduleMessage(`${day.day} ${day.label} открыт в недельной сетке.`)
  }

  function selectEvent(event) {
    setSelectedEventId(event.id)
    setFocusedDayKey(event.date)
    setScheduleMessage(
      event.status === 'busy'
        ? `${event.start} - ${event.end}: выбрана услуга «${event.title}» для пациента ${event.patient}.`
        : event.status === 'buffer'
          ? `${event.start} - ${event.end}: буфер подготовки к приему.`
          : `${event.start} - ${event.end}: слот недоступен. Причина: ${event.reason}.`,
    )
  }

  function closeEventPopover() {
    setSelectedEventId('')
    setScheduleMessage('')
  }

  function handleEmptySlotAction(day) {
    setFocusedDayKey(day.date)
    setSelectedEventId('')
    setScheduleMessage(`${day.day} ${day.label}: открыт просмотр дня без выбранного приема.`)
  }

  useEffect(() => {
    const firstVisibleEvent = visibleEvents[0]

    if (firstVisibleEvent) {
      setFocusedDayKey(firstVisibleEvent.date)
      setSelectedEventId(firstVisibleEvent.id)
      setScheduleMessage('')
      return
    }

    setSelectedEventId('')
    setScheduleMessage('')
  }, [activeDoctor, visibleEvents])

  if (!isDoctor && !isManager) {
    return <PlaceholderPage title="Расписание" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>{isDoctor ? 'Мое расписание' : 'Расписание'}</h1>
          <p>
            {isDoctor
              ? 'Недельная сетка по рабочему диапазону 08:00 - 18:00. Детали приема открываются рядом с выбранной записью.'
              : 'Общая недельная сетка в рабочем диапазоне 08:00 - 18:00 с выбором врача.'}
          </p>
        </div>

        <div className="doctor-head-actions">
          <span className="role-pill">{isDoctor ? 'Режим врача' : 'Режим менеджера'}</span>
          <span className="panel-muted">Неделя: 04.05.2026 - 10.05.2026</span>
        </div>
      </div>

      {!isDoctor ? (
        <div className="schedule-toolbar admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Врач:</span>
            <select value={selectedDoctor} onChange={(event) => setSelectedDoctor(event.target.value)}>
              {DOCTORS.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: '0.6rem' }}>
        <button type="button" className="text-button" onClick={() => setShowSummary((s) => !s)}>
          {showSummary ? 'Скрыть краткую статистику' : 'Открыть краткую статистику'}
        </button>
      </div>

      {showSummary ? (
        <div className="schedule-summary">
        <article className="stat-card">
          <p className="stat-label">Свободные часы</p>
          <p className="stat-value">{Math.round(totalFreeMinutes / 60)}</p>
          <p className="stat-hint">в рабочих окнах</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Занятые часы</p>
          <p className="stat-value">{Math.round(totalBusyMinutes / 60)}</p>
          <p className="stat-hint">по услугам</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Буфер</p>
          <p className="stat-value">{Math.round(totalBufferMinutes / 60)}</p>
          <p className="stat-hint">подготовка</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Недоступно</p>
          <p className="stat-value">{Math.round(totalUnavailableMinutes / 60)}</p>
          <p className="stat-hint">исключения</p>
        </article>
        </div>
      ) : null}

      <div className="schedule-legend" style={{ marginTop: '0.5rem' }}>
        <span>
          <i className="legend-dot free" /> Свободно
        </span>
        <span>
          <i className="legend-dot busy" /> Занято
        </span>
        <span>
          <i className="legend-dot unavailable" /> Недоступно
        </span>
      </div>

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
            >
              <span className="day-header-title">{day.day} {day.label}</span>
            </button>
          ))}
        </div>

        <div className="schedule-week-body" style={{ ['--hour-height']: DAY_LINE_HEIGHT }}>
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
                ['--hour-height']: DAY_LINE_HEIGHT,
                height: `${VISIBLE_HOURS * HOUR_HEIGHT}px`,
                minHeight: `${VISIBLE_HOURS * HOUR_HEIGHT}px`,
              }}
              onClick={() => handleEmptySlotAction(day)}
              role="presentation"
            >
              {day.windows.map(([start, end]) => (
                <span
                  key={`${day.date}-${start}-${end}`}
                  className="availability-window"
                  style={{
                    top: `${minutesToDisplayPx(timeToMinutes(start))}px`,
                    height: `${minutesToDisplayPx(timeToMinutes(end)) - minutesToDisplayPx(timeToMinutes(start))}px`,
                  }}
                />
              ))}

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
                      className={isActive ? `calendar-event ${event.status} active` : `calendar-event ${event.status}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left,
                        width: `calc(${widthPercent}% - ${GAP_PX}px)`,
                      }}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
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
                        onClick={(clickEvent) => clickEvent.stopPropagation()}
                      >
                        <div className="event-popover-head">
                          <strong>{event.title}</strong>
                          <button type="button" className="link-button" onClick={closeEventPopover}>
                            Закрыть
                          </button>
                        </div>
                        <p>{event.start} - {event.end}</p>
                        {event.patient ? <p>Пациент: {event.patient}</p> : null}
                        {event.service ? <p>Услуга: {event.service}</p> : null}
                        <p>Причина: {event.reason}</p>
                        <p className="event-popover-status">{EVENT_STATUS_LABELS[event.status]}</p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <article className="admin-panel">
        <div className="panel-header-row">
          <h2>Подробности записи</h2>
          <span className="panel-muted">{focusedDay ? `${focusedDay.day} • ${focusedDay.label}` : 'День не выбран'}</span>
        </div>
        <p className="panel-feedback">
          {scheduleMessage || 'Выберите запись в сетке, чтобы открыть подробности приема.'}
        </p>
      </article>
    </section>
  )
}