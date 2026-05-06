// ВРЕМЕННЫЕ ЗАГЛУШКИ: данные записей на прием для интерфейса.
// Удалить перед подключением реального бэкенда.

// Соответствие с диаграммой 2.2.1: appointments имеют patient_id, doctor_id, service_id, start_at, end_at, status, booked_price, comment
export const APPOINTMENTS = [
  {
    id: 'apt-001',
    patientId: 'p-101',
    patientName: 'Ковалева Ирина Сергеевна',
    doctorId: 'doc-001',
    doctorName: 'Смирнов Артем Игоревич',
    serviceId: 's-001',
    serviceName: 'Консультация терапевта',
    startAt: '2026-05-04T09:00:00',
    endAt: '2026-05-04T09:30:00',
    status: 'confirmed', // created, confirmed, completed, cancelled
    bookedPrice: 2500,
    comment: 'Контроль после курса лечения',
  },
  {
    id: 'apt-002',
    patientId: 'p-102',
    patientName: 'Сафронов Дмитрий Петрович',
    doctorId: 'doc-001',
    doctorName: 'Смирнов Артем Игоревич',
    serviceId: 's-004',
    serviceName: 'Профилактический осмотр',
    startAt: '2026-05-04T11:00:00',
    endAt: '2026-05-04T11:20:00',
    status: 'confirmed',
    bookedPrice: 1500,
    comment: 'Проверка результатов анализов',
  },
  {
    id: 'apt-003',
    patientId: 'p-103',
    patientName: 'Мельникова Ольга Андреевна',
    doctorId: 'doc-001',
    doctorName: 'Смирнов Артем Игоревич',
    serviceId: 's-003',
    serviceName: 'ЛОР-консультация',
    startAt: '2026-05-05T14:30:00',
    endAt: '2026-05-05T15:00:00',
    status: 'confirmed',
    bookedPrice: 2800,
    comment: 'Подготовка к плановому приему',
  },
  {
    id: 'apt-004',
    patientId: 'p-101',
    patientName: 'Ковалева Ирина Сергеевна',
    doctorId: 'doc-002',
    doctorName: 'Иванова Марина Павловна',
    serviceId: 's-002',
    serviceName: 'Консультация кардиолога',
    startAt: '2026-05-06T10:00:00',
    endAt: '2026-05-06T10:45:00',
    status: 'created',
    bookedPrice: 3500,
    comment: 'Первичная консультация',
  },
  {
    id: 'apt-005',
    patientId: 'p-104',
    patientName: 'Егоров Николай Ильич',
    doctorId: 'doc-001',
    doctorName: 'Смирнов Артем Игоревич',
    serviceId: 's-005',
    serviceName: 'УЗИ диагностика',
    startAt: '2026-05-05T09:00:00',
    endAt: '2026-05-05T09:40:00',
    status: 'completed',
    bookedPrice: 2000,
    comment: 'УЗИ диагностика проведена',
  },
  {
    id: 'apt-006',
    patientId: 'p-105',
    patientName: 'Чернов Андрей Павлович',
    doctorId: 'doc-001',
    doctorName: 'Смирнов Артем Игоревич',
    serviceId: 's-001',
    serviceName: 'Консультация терапевта',
    startAt: '2026-05-07T15:00:00',
    endAt: '2026-05-07T15:30:00',
    status: 'cancelled',
    bookedPrice: 2500,
    comment: 'Отмена по просьбе пациента',
  },
]

export const APPOINTMENT_STATUS_LABELS = {
  created: 'Создана',
  confirmed: 'Подтверждена',
  completed: 'Проведена',
  cancelled: 'Отменена',
}

export const APPOINTMENT_STATUS_STYLES = {
  created: '#fff0d9', // желтый
  confirmed: '#e5f0ff', // голубой
  completed: '#dff4e7', // зеленый
  cancelled: '#f9e3e0', // розовый
}

// Для быстрого доступа к услугам при расчете времени окончания
export const SERVICES_BY_ID = {
  's-001': { name: 'Консультация терапевта', duration: 30 },
  's-002': { name: 'Консультация кардиолога', duration: 45 },
  's-003': { name: 'ЛОР-консультация', duration: 30 },
  's-004': { name: 'Профилактический осмотр', duration: 20 },
  's-005': { name: 'УЗИ диагностика', duration: 40 },
  's-006': { name: 'ЭКГ', duration: 15 },
}

// Врачи для выбора при создании записи
export const DOCTORS = [
  { id: 'doc-001', name: 'Смирнов Артем Игоревич' },
  { id: 'doc-002', name: 'Иванова Марина Павловна' },
]
