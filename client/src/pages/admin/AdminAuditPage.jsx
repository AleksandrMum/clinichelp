import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUDIT_ACTION_TYPE_LABELS } from '../../constants/auditActionTypeLabels'
import { getAudit } from '../../services/audit'

const EMPTY_FILTERS = {
  dateFrom: '',
  dateTo: '',
  actionType: '',
  userId: '',
  entityType: '',
  entityId: '',
}

function emptyFilters() {
  return { ...EMPTY_FILTERS }
}

function hasAnyFilter(applied) {
  return Object.values(applied).some((v) => String(v || '').trim() !== '')
}

function buildAuditParams(applied, page = 1, limit = 50) {
  const params = { page, limit }
  if (applied.dateFrom.trim()) {
    params.dateFrom = applied.dateFrom.trim()
  }
  if (applied.dateTo.trim()) {
    params.dateTo = applied.dateTo.trim()
  }
  if (applied.actionType.trim()) {
    params.actionType = applied.actionType.trim()
  }
  if (applied.userId.trim()) {
    params.userId = applied.userId.trim()
  }
  if (applied.entityType.trim()) {
    params.entityType = applied.entityType.trim()
  }
  if (applied.entityId.trim()) {
    params.entityId = applied.entityId.trim()
  }
  return params
}

function formatItemLine(item) {
  const at = item.occurredAt ? new Date(item.occurredAt) : null
  const time =
    at && !Number.isNaN(at.getTime())
      ? at.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })
      : '—'
  const who = item.user?.login || item.user?.fullName || item.userId || '—'
  const entity = [item.entityType, item.entityId].filter(Boolean).join(':') || '—'
  const actionLabel = AUDIT_ACTION_TYPE_LABELS[item.actionType] || item.actionType || '—'
  return `${time} | ${who} | ${item.actionType || '—'} (${actionLabel}) | ${entity} | ${item.summary || ''}`
}

function buildLogText(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return ''
  }
  const lines = []
  for (const group of groups) {
    lines.push(`=== ${group.date} ===`)
    for (const item of group.items || []) {
      lines.push(formatItemLine(item))
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

export function AdminAuditPage() {
  const [draft, setDraft] = useState(() => emptyFilters())
  const [applied, setApplied] = useState(() => emptyFilters())
  const [groups, setGroups] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const env = await getAudit(buildAuditParams(applied))
      if (env?.error) {
        setError(env.error.message || 'Не удалось загрузить журнал')
        setGroups([])
        setMeta(null)
        return
      }
      setGroups(Array.isArray(env.data) ? env.data : [])
      setMeta(env.meta ?? null)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Не удалось загрузить журнал')
      setGroups([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  const logText = useMemo(() => buildLogText(groups), [groups])

  const empty = !loading && !error && groups.every((g) => !(g.items && g.items.length))
  const emptyMessage = hasAnyFilter(applied)
    ? 'По выбранным фильтрам записей нет.'
    : 'Записей в журнале пока нет.'

  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleApply(event) {
    event.preventDefault()
    setApplied({ ...draft })
  }

  function handleClear() {
    const next = emptyFilters()
    setDraft(next)
    setApplied({ ...next })
  }

  const showLogArea = !error && !empty
  const showEmptyLine = !loading && !error && empty

  return (
    <section className="content-card admin-page">
      <h1>Аудит ИС</h1>
      <p>Просмотр журнала всех действий в системе.</p>

      <article className="admin-panel admin-panel-spaced">
        <h2>Логи системы</h2>

        <form className="form-grid form-grid-two-col" onSubmit={handleApply} style={{ marginBottom: '1rem' }}>
          <label>
            <span>С даты и времени</span>
            <input
              type="datetime-local"
              value={draft.dateFrom}
              onChange={(e) => updateDraft('dateFrom', e.target.value)}
            />
          </label>
          <label>
            <span>По дату и время</span>
            <input
              type="datetime-local"
              value={draft.dateTo}
              onChange={(e) => updateDraft('dateTo', e.target.value)}
            />
          </label>

          <label>
            <span>Тип события (важность / категория)</span>
            <select value={draft.actionType} onChange={(e) => updateDraft('actionType', e.target.value)}>
              <option value="">Все типы</option>
              {Object.entries(AUDIT_ACTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {key} — {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>User ID (UUID)</span>
            <input
              value={draft.userId}
              onChange={(e) => updateDraft('userId', e.target.value)}
              placeholder="Необязательно"
              autoComplete="off"
            />
          </label>

          <label>
            <span>Тип сущности</span>
            <input
              value={draft.entityType}
              onChange={(e) => updateDraft('entityType', e.target.value)}
              placeholder="например appointment"
              autoComplete="off"
            />
          </label>

          <label>
            <span>ID сущности (UUID)</span>
            <input
              value={draft.entityId}
              onChange={(e) => updateDraft('entityId', e.target.value)}
              placeholder="Необязательно"
              autoComplete="off"
            />
          </label>

          <div className="button-row form-span-2" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" disabled={loading}>
              Применить фильтры
            </button>
            <button type="button" className="button-secondary" onClick={handleClear} disabled={loading}>
              Сбросить
            </button>
          </div>
        </form>

        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p className="panel-muted">{showLogArea ? 'Обновление…' : 'Загрузка…'}</p> : null}
        {showEmptyLine ? <p className="panel-muted">{emptyMessage}</p> : null}

        {showLogArea ? (
          <>
            <textarea className="audit-log" readOnly value={logText} aria-label="Логи аудита" />
            {meta ? (
              <p className="panel-muted" style={{ marginTop: '0.5rem' }}>
                Страница {meta.page} из {meta.pages}, всего записей: {meta.total}
              </p>
            ) : null}
          </>
        ) : null}
      </article>
    </section>
  )
}
