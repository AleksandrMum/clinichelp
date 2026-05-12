import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'

const ADMIN_SHORTCUTS = [
  { title: 'Пользователи', to: '/admin/users', text: 'Управление учётными записями сотрудников.' },
  { title: 'Аудит', to: '/admin/audit', text: 'Журнал действий пользователей в системе.' },
  { title: 'Настройки', to: '/settings', text: 'Настройки вашего профиля.' },
]

const MANAGER_SHORTCUTS = [
  { title: 'Пациенты', to: '/manager/patients', text: 'Список пациентов и создание новых записей.' },
  { title: 'Записи на приём', to: '/manager/appointments', text: 'Управление записями на приём.' },
  { title: 'Расписание', to: '/manager/schedule', text: 'Просмотр расписания врачей.' },
  { title: 'Услуги', to: '/manager/clinic/services', text: 'Управление услугами клиники.' },
  { title: 'График врача', to: '/manager/clinic/doctor-schedule', text: 'Правила и исключения расписания врачей.' },
]

const DOCTOR_SHORTCUTS = [
  { title: 'Расписание', to: '/doctor/schedule', text: 'Ваше недельное расписание и записи на приём.' },
  { title: 'Пациенты', to: '/doctor/patients', text: 'Список ваших пациентов.' },
  { title: 'Настройки', to: '/settings', text: 'Настройки вашего профиля.' },
]

export function HomePage() {
  const { user } = useAuth()

  if (user?.role === ROLES.MANAGER) {
    return (
      <section className="content-card admin-home">
        <h1>Главная менеджера</h1>
        <p>Оперативные показатели по пациентам, расписанию и клинике.</p>

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
