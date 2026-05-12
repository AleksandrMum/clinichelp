import { ROLES } from '../auth/roles'

export const NAVIGATION_BY_ROLE = {
  [ROLES.MANAGER]: [
    { label: 'Главная', to: '/home' },
    { label: 'Пациенты', to: '/manager/patients' },
    { label: 'Записи на прием', to: '/manager/appointments' },
    { label: 'Расписание', to: '/manager/schedule' },
    {
      label: 'Клиника',
      to: '/manager/clinic',
      submenu: [
        { label: 'Услуги', to: '/manager/clinic/services' },
        { label: 'График врача', to: '/manager/clinic/doctor-schedule' },
      ],
    },
    { label: 'Настройки', to: '/settings' },
  ],
  [ROLES.DOCTOR]: [
    { label: 'Главная', to: '/home' },
    { label: 'Пациенты', to: '/doctor/patients' },
    { label: 'Расписание', to: '/doctor/schedule' },
    { label: 'Настройки', to: '/settings' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Главная', to: '/home' },
    { label: 'Пользователи', to: '/admin/users' },
    { label: 'Аудит', to: '/admin/audit' },
    { label: 'Настройки', to: '/settings' },
  ],
}

export function getDefaultRoute(role) {
  return '/home'
}
