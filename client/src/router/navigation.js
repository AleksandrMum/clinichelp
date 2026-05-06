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
        { label: 'Исключения расписания', to: '/manager/clinic/schedule-exceptions' },
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
    { label: 'Клиника', to: '/admin/clinic', exact: true },
    { label: 'Пользователи', to: '/admin/clinic/users' },
    { label: 'Аудит', to: '/admin/clinic/audit' },
    { label: 'Настройки', to: '/settings' },
  ],
}

export function getDefaultRoute(role) {
  return '/home'
}
