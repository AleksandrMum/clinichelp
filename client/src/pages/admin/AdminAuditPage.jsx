const MOCK_LOGS = [
  '2026-04-26 08:31:10 | admin | CREATE_USER | users:u-104 | Добавлен новый менеджер',
  '2026-04-26 08:40:02 | admin | UPDATE_BRANCH | branches:b-2 | Изменен график филиала',
  '2026-04-26 09:15:19 | admin | ATTACH_USER | assignment:a-42 | Врач прикреплен к филиалу',
  '2026-04-26 09:47:51 | admin | RESET_PASSWORD | users:u-102 | Запрошен временный пароль',
  '2026-04-26 10:02:33 | admin | VIEW_AUDIT | audit_log | Просмотр журнала действий',
]

export function AdminAuditPage() {
  return (
    <section className="content-card admin-page">
      <h1>Аудит ИС</h1>
      <p>Журнал действий в режиме чтения.</p>

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
