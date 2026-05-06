// ВРЕМЕННЫЕ ЗАГЛУШКИ: пользователи для интерфейса администратора.
// Удалить перед подключением реального бэкенда.
export const MOCK_USERS = [
  {
    id: 'u-101',
    fullName: 'Иванова Марина Павловна',
    username: 'm.ivanova',
    role: 'Менеджер',
    branch: 'Филиал на Ленина, 8',
    status: 'Активен',
  },
  {
    id: 'u-102',
    fullName: 'Смирнов Артем Игоревич',
    username: 'a.smirnov',
    role: 'Врач',
    branch: 'Филиал на Гагарина, 14',
    status: 'Активен',
  },
  {
    id: 'u-103',
    fullName: 'Зайцева Ольга Николаевна',
    username: 'o.zaytseva',
    role: 'Администратор',
    branch: 'Центральный филиал',
    blocked: true,
  },
]

export const INITIAL_FORM = {
  fullName: '',
  username: '',
  role: 'manager',
  phone: '+7',
  email: '',
  branch: 'main',
  department: '',
  position: '',
  note: '',
}
