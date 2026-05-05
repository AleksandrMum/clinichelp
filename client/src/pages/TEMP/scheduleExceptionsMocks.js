// ВРЕМЕННЫЕ ЗАГЛУШКИ: данные филиалов, врачей и исключений расписания.
// Удалить перед подключением реального бэкенда.

export const BRANCHES = [
  { id: 'branch-1', name: 'Центральный филиал' },
  { id: 'branch-2', name: 'Филиал на Ленина, 8' },
  { id: 'branch-3', name: 'Филиал на Гагарина, 14' },
]

export const DOCTORS = [
  { id: 'doc-1', branchId: 'branch-1', fullName: 'Смирнов Артем Игоревич' },
  { id: 'doc-2', branchId: 'branch-1', fullName: 'Иванова Марина Павловна' },
  { id: 'doc-3', branchId: 'branch-2', fullName: 'Кузнецов Павел Андреевич' },
  { id: 'doc-4', branchId: 'branch-3', fullName: 'Зайцева Ольга Николаевна' },
]

export const EXCEPTION_TYPES = {
  unavailable: {
    label: 'Недоступно',
    description: 'Период блокирует расписание и делает слоты недоступными.',
  },
  available_extra: {
    label: 'Доп. смена',
    description: 'Период расширяет расписание и позволяет добавлять новые слоты.',
  },
}

export const SCHEDULE_EXCEPTIONS = [
  {
    id: 'exc-1',
    scope: 'branch',
    branchId: 'branch-1',
    doctorId: null,
    startAt: '2026-05-10T12:00',
    endAt: '2026-05-10T12:45',
    type: 'unavailable',
    reason: 'Обеденный перерыв (для всех врачей филиала)',
  },
  {
    id: 'exc-2',
    scope: 'doctor',
    branchId: 'branch-1',
    doctorId: 'doc-1',
    startAt: '2026-05-15T08:00',
    endAt: '2026-05-16T18:00',
    type: 'unavailable',
    reason: 'Больничный',
  },
  {
    id: 'exc-3',
    scope: 'doctor',
    branchId: 'branch-1',
    doctorId: 'doc-2',
    startAt: '2026-05-20T16:00',
    endAt: '2026-05-20T20:00',
    type: 'available_extra',
    reason: 'Дополнительная вечерняя смена',
  },
  {
    id: 'exc-4',
    scope: 'branch',
    branchId: 'branch-2',
    doctorId: null,
    startAt: '2026-05-11T09:00',
    endAt: '2026-05-11T11:00',
    type: 'available_extra',
    reason: 'Расширенный утренний прием',
  },
]
