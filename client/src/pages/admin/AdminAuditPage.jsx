// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { MOCK_LOGS } from '../TEMP/adminAuditMocks'

export function AdminAuditPage() {
  return (
    <section className="content-card admin-page">
      <h1>Аудит ИС</h1>
      <p>Просмотр журнала всех действий в системе.</p>

      <article className="admin-panel admin-panel-spaced">
        <h2>Логи системы</h2>
        <textarea
          className="audit-log"
          readOnly
          value={MOCK_LOGS.join('\n')}
          aria-label="Логи аудита"
        />
      </article>
    </section>
  )
}
