/**
 * AppointmentService — записи на приём (создание, перенос, статусы, отмена).
 *
 * Будущие методы:
 * - listAppointments(filters, pagination, scope)
 * - createAppointment(payload, transactionContext)
 * - rescheduleAppointment(id, startAt, ...)
 * - cancelAppointment(id, reason)
 * - updateStatus(id, status, actorRole)
 * - getDailyReminderList(date, filters)
 *
 * Тяжёлая логика пересечений/слотов координируется с schedule-* сервисами и отдельным Slot-подмодулем при необходимости.
 */
class AppointmentService {}

module.exports = new AppointmentService();
