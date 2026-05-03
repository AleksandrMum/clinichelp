import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'

const ADMIN_STATS = [
  { label: 'Филиалы', value: '3', hint: '2 активных, 1 в работе', to: '/admin/clinic' },
  { label: 'Пользователи', value: '18', hint: '14 активных, 4 заблокированных', to: '/admin/clinic/users' },
  { label: 'События аудита', value: '124', hint: 'за последние 24 часа', to: '/admin/clinic/audit' },
]

const MANAGER_STATS = [
  { label: 'Пациенты в работе', value: '42', hint: '6 новых обращений', to: '/manager/patients' },
  { label: 'Записи на сегодня', value: '19', hint: '3 свободных окна', to: '/manager/schedule' },
  { label: 'Услуги клиники', value: '12', hint: 'справочник доступен', to: '/manager/clinic/services' },
  { label: 'Карточки на проверке', value: '5', hint: 'требуют подтверждения', to: '/manager/patients/card' },
]

const DOCTOR_STATS = [
  { label: 'Пациенты', value: '34', hint: '4 ожидают приема', to: '/doctor/patients' },
  { label: 'Приемы сегодня', value: '11', hint: '2 перерыва', to: '/doctor/schedule' },
  { label: 'Карточки пациентов', value: '9', hint: 'доступны для просмотра', to: '/doctor/patients/card' },
  { label: 'Настройки профиля', value: '1', hint: 'личные параметры', to: '/settings' },
]

const ADMIN_SHORTCUTS = [
  { title: 'Управление клиникой', text: 'Филиалы, прикрепление, структура площадок', to: '/admin/clinic' },
  { title: 'Пользователи', text: 'Создание, блокировка, роли и восстановление доступа', to: '/admin/clinic/users' },
  { title: 'Аудит', text: 'Последние действия и журнал событий', to: '/admin/clinic/audit' },
]

const MANAGER_SHORTCUTS = [
  { title: 'Пациенты', text: 'Поиск, карточки и создание новых обращений', to: '/manager/patients' },
  { title: 'Расписание', text: 'Просмотр сетки и свободных слотов', to: '/manager/schedule' },
  { title: 'Клиника', text: 'Услуги, филиалы и рабочая структура', to: '/manager/clinic' },
]

const DOCTOR_SHORTCUTS = [
  { title: 'Пациенты', text: 'Просмотр текущих пациентов и карточек', to: '/doctor/patients' },
  { title: 'Расписание', text: 'Личный график и окна приема', to: '/doctor/schedule' },
  { title: 'Настройки', text: 'Профиль и персональные параметры', to: '/settings' },
]

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
