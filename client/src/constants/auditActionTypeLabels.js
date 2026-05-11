/**
 * Подписи типов событий (совпадают с map в server/src/services/audit-read.service.js).
 * Значения — ключи для query actionType.
 */
export const AUDIT_ACTION_TYPE_LABELS = {
  AUTH_LOGIN_SUCCESS: 'Successful login',
  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  USER_PASSWORD_CHANGED: 'User password changed',
  USER_DEACTIVATED: 'User deactivated',
  PATIENT_CREATED: 'Patient created',
  PATIENT_UPDATED: 'Patient updated',
  PATIENT_ARCHIVED: 'Patient archived',
  SERVICE_CREATED: 'Service created',
  SERVICE_UPDATED: 'Service updated',
  SERVICE_DEACTIVATED: 'Service deactivated',
  SCHEDULE_RULES_REPLACED: 'Schedule rules replaced',
  SCHEDULE_EXCEPTION_CREATED: 'Schedule exception created',
  SCHEDULE_EXCEPTION_UPDATED: 'Schedule exception updated',
  SCHEDULE_EXCEPTION_ARCHIVED: 'Schedule exception archived',
  APPOINTMENT_CREATED: 'Appointment created',
  APPOINTMENT_STATUS_UPDATED: 'Appointment status changed',
  APPOINTMENT_CANCELLED: 'Appointment cancelled',
  APPOINTMENT_RESCHEDULED: 'Appointment rescheduled',
}
