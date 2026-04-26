import { ROLES } from '../auth/roles'

export const NAVIGATION_BY_ROLE = {
  [ROLES.MANAGER]: [
    { label: 'Главная', to: '/home' },
    { label: 'Пациенты', to: '/manager/patients' },
    { label: 'Расписание', to: '/manager/schedule' },
    { label: 'Клиника', to: '/manager/clinic' },
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
    { label: 'Клиника', to: '/admin/clinic' },
    { label: 'Настройки', to: '/settings' },
  ],
}

export function getDefaultRoute(role) {
  if (role === ROLES.ADMIN) {
    return '/admin/clinic'
  }

  if (role === ROLES.DOCTOR) {
    return '/doctor/schedule'
  }

  return '/manager/schedule'
}
