import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'
import {
  listDoctors,
  getDoctorRules,
  replaceDoctorRules,
  getDoctorExceptions,
  createException,
  updateException,
  archiveException,
} from '../../services/schedule'

function extractApiError(err) {
  return err.response?.data?.error?.message || err.message || 'Произошла ошибка'
}

const WEEKDAYS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 7, label: 'Воскресенье' },
]

const WEEKDAY_SHORT = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const EXCEPTION_TYPE_LABELS = {
  day_off: 'Выходной / Недоступность',
  extra_shift: 'Дополнительная смена',
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  return timeStr.substring(0, 5)
}

function toLocalDatetimeValue(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${hh}:${mm}`
}

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

function formatRangeLabel(monday) {
  const sunday = addDays(monday, 6)
  const from = `${String(monday.getDate()).padStart(2, '0')}.${String(monday.getMonth() + 1).padStart(2, '0')}.${monday.getFullYear()}`
  const to = `${String(sunday.getDate()).padStart(2, '0')}.${String(sunday.getMonth() + 1).padStart(2, '0')}.${sunday.getFullYear()}`
  return `${from} — ${to}`
}

function SearchableSelect({ label, placeholder, emptyText, items, selectedValue, getValue, getLabel, onSelect }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const selectedItem = useMemo(
    () => items.find((item) => getValue(item) === selectedValue) || null,
    [getValue, items, selectedValue],
  )

  useEffect(() => {
    setQuery(selectedItem ? getLabel(selectedItem) : '')
  }, [getLabel, selectedItem, selectedValue])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    const matched = items.filter((item) => getLabel(item).toLowerCase().includes(normalized))
    if (selectedItem && !matched.some((item) => getValue(item) === getValue(selectedItem))) {
      return [selectedItem, ...matched]
    }
    return matched
  }, [getLabel, getValue, items, query, selectedItem])

  function handlePick(item) {
    onSelect(item)
    setQuery(getLabel(item))
    setIsOpen(false)
    setHoveredIndex(-1)
  }

  return (
    <label className="autocomplete-field">
      <span>{label}</span>
      <div className="autocomplete-root">
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHoveredIndex(-1)
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isOpen ? (
          <ul className="autocomplete-menu" role="listbox">
            {filteredItems.length ? (
              filteredItems.map((item, index) => (
                <li key={getValue(item)}>
                  <button
                    type="button"
                    className={index === hoveredIndex ? 'autocomplete-option active' : 'autocomplete-option'}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(-1)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handlePick(item)
                    }}
                  >
                    {getLabel(item)}
                  </button>
                </li>
              ))
            ) : (
              <li className="autocomplete-empty">{emptyText}</li>
            )}
          </ul>
        ) : null}
      </div>
    </label>
  )
}

function rulesToDraft(rules) {
  const draft = {}
  for (const wd of WEEKDAYS) {
    draft[wd.value] = []
  }
  for (const r of rules) {
    if (!draft[r.weekday]) draft[r.weekday] = []
    draft[r.weekday].push({
      startTime: formatTime(r.start_time),
      endTime: formatTime(r.end_time),
    })
  }
  for (const wd of WEEKDAYS) {
    if (draft[wd.value].length === 0) {
      draft[wd.value].push({ startTime: '', endTime: '' })
    }
  }
  return draft
}

function draftToPayload(draft) {
  const rules = []
  for (const [wdStr, intervals] of Object.entries(draft)) {
    const wd = Number(wdStr)
    for (const iv of intervals) {
      if (iv.startTime && iv.endTime) {
        rules.push({ weekday: wd, startTime: iv.startTime, endTime: iv.endTime })
      }
    }
  }
  return rules
}

function RulesEditor({ rules, rulesLoading, onSaved, doctorId }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleStartEdit() {
    setDraft(rulesToDraft(rules))
    setEditing(true)
    setError('')
    setMessage('')
  }

  function handleCancel() {
    setEditing(false)
    setError('')
  }

  function updateInterval(wd, idx, field, value) {
    setDraft((prev) => {
      const next = { ...prev }
      next[wd] = [...next[wd]]
      next[wd][idx] = { ...next[wd][idx], [field]: value }
      return next
    })
  }

  function addInterval(wd) {
    setDraft((prev) => {
      const next = { ...prev }
      next[wd] = [...next[wd], { startTime: '', endTime: '' }]
      return next
    })
  }

  function removeInterval(wd, idx) {
    setDraft((prev) => {
      const next = { ...prev }
      next[wd] = next[wd].filter((_, i) => i !== idx)
      if (next[wd].length === 0) {
        next[wd] = [{ startTime: '', endTime: '' }]
      }
      return next
    })
  }

  async function handleSave() {
    setError('')
    const payload = draftToPayload(draft)

    for (const r of payload) {
      if (r.startTime >= r.endTime) {
        setError(`${WEEKDAY_SHORT[r.weekday]}: начало должно быть раньше окончания.`)
        return
      }
    }

    setSaving(true)
    try {
      await replaceDoctorRules(doctorId, payload)
      setEditing(false)
      setMessage('Правила сохранены.')
      onSaved()
    } catch (err2) {
      setError(extractApiError(err2))
    } finally {
      setSaving(false)
    }
  }

  if (rulesLoading) return <p className="panel-muted">Загрузка правил…</p>

  const grouped = {}
  for (const r of rules) {
    if (!grouped[r.weekday]) grouped[r.weekday] = []
    grouped[r.weekday].push(r)
  }

  return (
    <>
      {!editing ? (
        <>
          {rules.length === 0 ? (
            <p className="panel-muted">У врача нет настроенных правил расписания.</p>
          ) : (
            <div className="rules-compact-list">
              {WEEKDAYS.map(({ value, label }) => {
                const dayRules = grouped[value]
                if (!dayRules) return null
                return (
                  <span key={value} className="rules-compact-item">
                    <strong>{WEEKDAY_SHORT[value]}</strong>
                    {' '}
                    {dayRules.map((r, i) => (
                      <span key={r.id}>
                        {i > 0 ? ', ' : ''}
                        {formatTime(r.start_time)}–{formatTime(r.end_time)}
                      </span>
                    ))}
                  </span>
                )
              })}
            </div>
          )}

          {message ? <p className="panel-feedback">{message}</p> : null}

          <div className="button-row" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="button-secondary" onClick={handleStartEdit}>
              Редактировать правила
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rules-edit-grid">
            {WEEKDAYS.map(({ value, label }) => (
              <div key={value} className="rules-edit-day">
                <span className="rules-edit-day-label">{label}</span>
                <div className="rules-edit-intervals">
                  {draft[value]?.map((iv, idx) => (
                    <div key={idx} className="rules-edit-row">
                      <input
                        type="time"
                        value={iv.startTime}
                        onChange={(e) => updateInterval(value, idx, 'startTime', e.target.value)}
                      />
                      <span>—</span>
                      <input
                        type="time"
                        value={iv.endTime}
                        onChange={(e) => updateInterval(value, idx, 'endTime', e.target.value)}
                      />
                      {draft[value].length > 1 ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeInterval(value, idx)}
                          title="Удалить интервал"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => addInterval(value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    + интервал
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <p className="panel-muted" style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Оставьте оба поля пустыми, чтобы сделать день выходным. Сохранение полностью заменяет текущие правила.
          </p>

          <div className="button-row" style={{ marginTop: '0.5rem' }}>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить правила'}
            </button>
            <button type="button" className="button-secondary" onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </>
      )}
    </>
  )
}

const EMPTY_FORM = { startAt: '', endAt: '', exceptionType: 'day_off', comment: '' }

export function ManagerDoctorSchedulePage() {
  const { user } = useAuth()
  const isManager = user?.role === ROLES.MANAGER

  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  const [rules, setRules] = useState([])
  const [rulesLoading, setRulesLoading] = useState(false)

  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [exceptions, setExceptions] = useState([])
  const [exceptionsLoading, setExceptionsLoading] = useState(false)
  const [exceptionsError, setExceptionsError] = useState('')

  const [selectedExceptionId, setSelectedExceptionId] = useState(null)
  const [isEditingException, setIsEditingException] = useState(false)
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM })
  const [createError, setCreateError] = useState('')
  const [createSaving, setCreateSaving] = useState(false)

  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    setDoctorsLoading(true)
    listDoctors()
      .then((env) => { if (!cancelled) setDoctors(env.data ?? []) })
      .catch(() => { if (!cancelled) setDoctors([]) })
      .finally(() => { if (!cancelled) setDoctorsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const loadRules = useCallback(async () => {
    if (!selectedDoctorId) { setRules([]); return }
    setRulesLoading(true)
    try {
      const env = await getDoctorRules(selectedDoctorId)
      setRules(env.data ?? [])
    } catch {
      setRules([])
    } finally {
      setRulesLoading(false)
    }
  }, [selectedDoctorId])

  useEffect(() => { loadRules() }, [loadRules])

  const loadExceptions = useCallback(async () => {
    if (!selectedDoctorId) { setExceptions([]); return }
    setExceptionsLoading(true)
    setExceptionsError('')
    try {
      const from = formatDateKey(monday) + 'T00:00:00.000Z'
      const to = formatDateKey(addDays(monday, 7)) + 'T00:00:00.000Z'
      const env = await getDoctorExceptions(selectedDoctorId, { from, to, includeArchived: false })
      setExceptions(env.data ?? [])
    } catch (err) {
      setExceptionsError(extractApiError(err))
      setExceptions([])
    } finally {
      setExceptionsLoading(false)
    }
  }, [selectedDoctorId, monday])

  useEffect(() => { loadExceptions() }, [loadExceptions])

  const selectedException = useMemo(
    () => exceptions.find((e) => e.id === selectedExceptionId) || null,
    [exceptions, selectedExceptionId],
  )

  function handleSelectDoctor(doctor) {
    setSelectedDoctorId(doctor.id)
    resetExceptionState()
  }

  function resetExceptionState() {
    setSelectedExceptionId(null)
    setIsEditingException(false)
    setIsCreating(false)
    setFormError('')
    setCreateError('')
    setActionMessage('')
  }

  function goPrevWeek() { setMonday((p) => addDays(p, -7)); resetExceptionState() }
  function goNextWeek() { setMonday((p) => addDays(p, 7)); resetExceptionState() }
  function goToday() { setMonday(getMonday(new Date())); resetExceptionState() }

  function handleSelectException(id) {
    setSelectedExceptionId((cur) => (cur === id ? null : id))
    setIsEditingException(false)
    setIsCreating(false)
    setFormError('')
    setActionMessage('')
  }

  function handleStartCreate() {
    setIsCreating(true)
    setSelectedExceptionId(null)
    setIsEditingException(false)
    setCreateForm({ ...EMPTY_FORM })
    setCreateError('')
    setActionMessage('')
  }

  function handleCancelCreate() {
    setIsCreating(false)
    setCreateForm({ ...EMPTY_FORM })
    setCreateError('')
  }

  function validateForm(form) {
    if (!form.startAt) return 'Укажите начало периода.'
    if (!form.endAt) return 'Укажите окончание периода.'
    if (new Date(form.endAt) <= new Date(form.startAt)) return 'Окончание должно быть позже начала.'
    return null
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setCreateError('')
    const err = validateForm(createForm)
    if (err) { setCreateError(err); return }

    setCreateSaving(true)
    try {
      await createException({
        doctorId: selectedDoctorId,
        startAt: createForm.startAt + ':00.000Z',
        endAt: createForm.endAt + ':00.000Z',
        exceptionType: createForm.exceptionType,
        comment: createForm.comment.trim() || null,
      })
      setIsCreating(false)
      setCreateForm({ ...EMPTY_FORM })
      setActionMessage('Исключение создано.')
      await loadExceptions()
    } catch (err2) {
      setCreateError(extractApiError(err2))
    } finally {
      setCreateSaving(false)
    }
  }

  function handleStartEditException() {
    if (!selectedException) return
    setIsEditingException(true)
    setEditForm({
      startAt: toLocalDatetimeValue(selectedException.start_at),
      endAt: toLocalDatetimeValue(selectedException.end_at),
      exceptionType: selectedException.exception_type,
      comment: selectedException.comment ?? '',
    })
    setFormError('')
    setActionMessage('')
  }

  function handleCancelEditException() {
    setIsEditingException(false)
    setFormError('')
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!selectedException) return
    setFormError('')
    const err = validateForm(editForm)
    if (err) { setFormError(err); return }

    setSaving(true)
    try {
      await updateException(selectedException.id, {
        startAt: editForm.startAt + ':00.000Z',
        endAt: editForm.endAt + ':00.000Z',
        exceptionType: editForm.exceptionType,
        comment: editForm.comment.trim() || null,
      })
      setIsEditingException(false)
      setActionMessage('Исключение обновлено.')
      await loadExceptions()
    } catch (err2) {
      setFormError(extractApiError(err2))
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!selectedException) return
    setArchiving(true)
    setActionMessage('')
    try {
      await archiveException(selectedException.id)
      setSelectedExceptionId(null)
      setActionMessage('Исключение архивировано.')
      await loadExceptions()
    } catch (err2) {
      setActionMessage(extractApiError(err2))
    } finally {
      setArchiving(false)
    }
  }

  if (!isManager) {
    return <PlaceholderPage title="График врача" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>График врача</h1>
          <p>Еженедельные правила и разовые исключения расписания.</p>
        </div>
      </div>

      <div className="doctor-toolbar">
        <div style={{ maxWidth: '360px' }}>
          {doctorsLoading ? (
            <p className="panel-muted">Загрузка списка врачей…</p>
          ) : (
            <SearchableSelect
              label="Врач"
              placeholder="Выберите врача"
              emptyText="Врачи не найдены"
              items={doctors}
              selectedValue={selectedDoctorId}
              getValue={(d) => d.id}
              getLabel={(d) => d.full_name}
              onSelect={handleSelectDoctor}
            />
          )}
        </div>
      </div>

      {!selectedDoctorId ? (
        <p className="panel-muted">Выберите врача, чтобы управлять его расписанием.</p>
      ) : (
        <>
          {/* ── Block 1: Weekly Rules ── */}
          <article className="admin-panel">
            <div className="panel-header-row">
              <h2>Еженедельные правила</h2>
            </div>
            <RulesEditor
              rules={rules}
              rulesLoading={rulesLoading}
              doctorId={selectedDoctorId}
              onSaved={loadRules}
            />
          </article>

          {/* ── Block 2: Exceptions ── */}
          <article className="admin-panel">
            <div className="panel-header-row">
              <h2>Исключения</h2>
              <div className="doctor-head-actions schedule-nav" style={{ flexShrink: 0 }}>
                <button type="button" className="button-secondary" onClick={goPrevWeek}>←</button>
                <button type="button" className="button-secondary" onClick={goToday}>Сегодня</button>
                <button type="button" className="button-secondary" onClick={goNextWeek}>→</button>
                <span className="panel-muted">{formatRangeLabel(monday)}</span>
              </div>
            </div>

            <div className="button-row" style={{ marginBottom: '0.5rem' }}>
              <button type="button" className="button-secondary" onClick={handleStartCreate}>
                + Новое исключение
              </button>
            </div>

            {actionMessage ? <p className="panel-feedback">{actionMessage}</p> : null}
            {exceptionsError ? <p className="error-text">{exceptionsError}</p> : null}

            <div className="doctor-patients-layout">
              <div
                className="doctor-list-panel"
                style={{ flex: isCreating || selectedException ? '0 0 48%' : '1 0 100%' }}
              >
                {exceptionsLoading ? (
                  <p className="panel-muted">Загрузка…</p>
                ) : exceptions.length === 0 ? (
                  <p className="panel-muted">За выбранную неделю исключений нет.</p>
                ) : (
                  <div className="patient-list">
                    {exceptions.map((exc) => (
                      <button
                        key={exc.id}
                        type="button"
                        className={exc.id === selectedExceptionId ? 'patient-card active' : 'patient-card'}
                        onClick={() => handleSelectException(exc.id)}
                        style={{ padding: '0.5rem 0.6rem' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                          <p className="item-title" style={{ margin: 0 }}>
                            {EXCEPTION_TYPE_LABELS[exc.exception_type] || exc.exception_type}
                          </p>
                          <p className="item-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
                            {toLocalDatetimeValue(exc.start_at).replace('T', ' ')} → {toLocalDatetimeValue(exc.end_at).replace('T', ' ')}
                          </p>
                          {exc.comment ? (
                            <p className="item-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: '#59637a' }}>
                              {exc.comment}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isCreating ? (
                <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
                  <div className="panel-header-row"><h2>Новое исключение</h2></div>
                  <form className="form-grid" onSubmit={handleCreateSubmit}>
                    <label>
                      Тип
                      <select
                        value={createForm.exceptionType}
                        onChange={(e) => setCreateForm((p) => ({ ...p, exceptionType: e.target.value }))}
                      >
                        <option value="day_off">Выходной / Недоступность</option>
                        <option value="extra_shift">Дополнительная смена</option>
                      </select>
                    </label>
                    <label>
                      Начало
                      <input type="datetime-local" value={createForm.startAt} onChange={(e) => setCreateForm((p) => ({ ...p, startAt: e.target.value }))} />
                    </label>
                    <label>
                      Окончание
                      <input type="datetime-local" value={createForm.endAt} onChange={(e) => setCreateForm((p) => ({ ...p, endAt: e.target.value }))} />
                    </label>
                    <label>
                      Комментарий
                      <textarea
                        value={createForm.comment}
                        onChange={(e) => setCreateForm((p) => ({ ...p, comment: e.target.value }))}
                        placeholder="Причина (необязательно)"
                        style={{ minHeight: '70px' }}
                      />
                    </label>
                    {createError ? <p className="error-text">{createError}</p> : null}
                    <div className="button-row">
                      <button type="submit" disabled={createSaving}>{createSaving ? 'Сохранение…' : 'Создать'}</button>
                      <button type="button" className="button-secondary" onClick={handleCancelCreate}>Отмена</button>
                    </div>
                  </form>
                </aside>
              ) : selectedException ? (
                <aside className="doctor-detail-panel" style={{ flex: '0 0 48%' }}>
                  <div className="panel-header-row">
                    <h2>Подробности</h2>
                    <span className="status-pill">{EXCEPTION_TYPE_LABELS[selectedException.exception_type] || selectedException.exception_type}</span>
                  </div>

                  {!isEditingException ? (
                    <>
                      <div className="detail-block">
                        <p className="item-subtitle">Начало: {toLocalDatetimeValue(selectedException.start_at).replace('T', ' ')}</p>
                        <p className="item-subtitle">Окончание: {toLocalDatetimeValue(selectedException.end_at).replace('T', ' ')}</p>
                        {selectedException.comment ? <p className="item-subtitle">Комментарий: {selectedException.comment}</p> : null}
                      </div>
                      <div className="button-row">
                        <button type="button" className="button-secondary" onClick={handleStartEditException}>Редактировать</button>
                        <button type="button" className="button-secondary" onClick={handleArchive} disabled={archiving}>
                          {archiving ? 'Архивация…' : 'Архивировать'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <form className="form-grid" onSubmit={handleEditSubmit}>
                      <label>
                        Тип
                        <select value={editForm.exceptionType} onChange={(e) => setEditForm((p) => ({ ...p, exceptionType: e.target.value }))}>
                          <option value="day_off">Выходной / Недоступность</option>
                          <option value="extra_shift">Дополнительная смена</option>
                        </select>
                      </label>
                      <label>
                        Начало
                        <input type="datetime-local" value={editForm.startAt} onChange={(e) => setEditForm((p) => ({ ...p, startAt: e.target.value }))} />
                      </label>
                      <label>
                        Окончание
                        <input type="datetime-local" value={editForm.endAt} onChange={(e) => setEditForm((p) => ({ ...p, endAt: e.target.value }))} />
                      </label>
                      <label>
                        Комментарий
                        <textarea
                          value={editForm.comment}
                          onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
                          placeholder="Причина (необязательно)"
                          style={{ minHeight: '70px' }}
                        />
                      </label>
                      {formError ? <p className="error-text">{formError}</p> : null}
                      <div className="button-row">
                        <button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
                        <button type="button" className="button-secondary" onClick={handleCancelEditException}>Отмена</button>
                      </div>
                    </form>
                  )}
                </aside>
              ) : null}
            </div>
          </article>
        </>
      )}
    </section>
  )
}
