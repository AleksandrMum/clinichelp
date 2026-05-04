import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
// TEMP: временные заглушки данных для интерфейса — удалить при подключении реального бэкенда
import { ADMIN_STATS, MANAGER_STATS, DOCTOR_STATS, ADMIN_SHORTCUTS, MANAGER_SHORTCUTS, DOCTOR_SHORTCUTS } from '../TEMP/homeMocks'

export function HomePage() {
  const { user } = useAuth()

  if (user?.role === ROLES.MANAGER) {
    return (
      <section className="content-card admin-home">
        <h1>Главная менеджера</h1>
        <p>Оперативные показатели по пациентам, расписанию и клинике.</p>

        <div className="stats-grid">
          {MANAGER_STATS.map((item) => (
            <Link key={item.label} to={item.to} className="stat-card stat-link-card">
              <p className="stat-label">{item.label}</p>
              <p className="stat-value">{item.value}</p>
              <p className="stat-hint">{item.hint}</p>
            </Link>
          ))}
        </div>

        <div className="admin-grid admin-grid-top-margin">
          {MANAGER_SHORTCUTS.map((item) => (
            <Link key={item.title} to={item.to} className="admin-panel admin-link-card">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (user?.role === ROLES.DOCTOR) {
    return (
      <section className="content-card admin-home">
        <h1>Главная врача</h1>
        <p>Личный обзор расписания, пациентов и быстрых переходов к рабочим экранам.</p>

        <div className="stats-grid">
          {DOCTOR_STATS.map((item) => (
            <Link key={item.label} to={item.to} className="stat-card stat-link-card">
              <p className="stat-label">{item.label}</p>
              <p className="stat-value">{item.value}</p>
              <p className="stat-hint">{item.hint}</p>
            </Link>
          ))}
        </div>

        <div className="admin-grid admin-grid-top-margin">
          {DOCTOR_SHORTCUTS.map((item) => (
            <Link key={item.title} to={item.to} className="admin-panel admin-link-card">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="content-card admin-home">
      <h1>Главная панель администратора</h1>
      <p>Краткая сводка по системе и быстрые переходы к ключевым разделам.</p>

      <div className="stats-grid">
        {ADMIN_STATS.map((item) => (
          <Link key={item.label} to={item.to} className="stat-card stat-link-card">
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{item.value}</p>
            <p className="stat-hint">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div className="admin-grid admin-grid-top-margin">
        {ADMIN_SHORTCUTS.map((item) => (
          <Link key={item.title} to={item.to} className="admin-panel admin-link-card">
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
