// ВРЕМЕННЫЕ ЗАГЛУШКИ: данные для панели главной страницы.
// Удалить перед подключением реального бэкенда.
export const ADMIN_STATS = [
  { label: 'Пользователи', value: '18', hint: '14 активных, 4 заблокированных', to: '/admin/users' },
  { label: 'События аудита', value: '124', hint: 'за последние 24 часа', to: '/admin/audit' },
]

export const MANAGER_STATS = [
  { label: 'Пациенты в работе', value: '42', hint: '6 новых обращений', to: '/manager/patients' },
  { label: 'Записи на сегодня', value: '19', hint: '3 свободных окна', to: '/manager/schedule' },
  { label: 'Услуги клиники', value: '12', hint: 'справочник доступен', to: '/manager/clinic/services' },
  { label: 'Карточки на проверке', value: '5', hint: 'требуют подтверждения', to: '/manager/patients/card' },
]

export const DOCTOR_STATS = [
  { label: 'Пациенты', value: '34', hint: '4 ожидают приема', to: '/doctor/patients' },
  { label: 'Приемы сегодня', value: '11', hint: '2 перерыва', to: '/doctor/schedule' },
  { label: 'Карточки пациентов', value: '9', hint: 'доступны внутри раздела пациентов', to: '/doctor/patients' },
  { label: 'Настройки профиля', value: '1', hint: 'личные параметры', to: '/settings' },
]

export const ADMIN_SHORTCUTS = [
  { title: 'Пользователи', text: 'Создание, блокировка, роли и восстановление доступа', to: '/admin/users' },
  { title: 'Аудит', text: 'Последние действия и журнал событий', to: '/admin/audit' },
]

export const MANAGER_SHORTCUTS = [
  { title: 'Пациенты', text: 'Поиск, карточки и создание новых обращений', to: '/manager/patients' },
  { title: 'Расписание', text: 'Просмотр сетки и свободных слотов', to: '/manager/schedule' },
  { title: 'Клиника', text: 'Услуги и рабочая структура', to: '/manager/clinic' },
]

export const DOCTOR_SHORTCUTS = [
  { title: 'Пациенты', text: 'Просмотр текущих пациентов и карточек', to: '/doctor/patients' },
  { title: 'Расписание', text: 'Личный график и окна приема', to: '/doctor/schedule' },
  { title: 'Настройки', text: 'Профиль и персональные параметры', to: '/settings' },
]
