/**
 * Записи на приём: слоты через SlotService, статусы, аудит, транзакции.
 *
 * @module services/appointment.service
 */
const { Op } = require('sequelize');
const { sequelize, Appointment, Patient, User, Service } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');
const slotService = require('./slot.service');
const { nonEmptyTrimmedString, optionalTrimmedNullable } = require('../utils/validation');

const APPOINTMENT_STATUSES = Object.freeze(['created', 'confirmed', 'completed', 'cancelled']);

const NEXT_STATUS = {
  created: ['confirmed'],
  confirmed: ['completed'],
  completed: [],
  cancelled: []
};

const SAFE_APPOINTMENT_INCLUDES = [
  {
    model: Patient,
    as: 'patient',
    attributes: ['id', 'full_name', 'phone', 'birth_date', 'is_archived']
  },
  {
    model: Service,
    as: 'service',
    attributes: ['id', 'name', 'duration_min', 'price', 'is_available']
  }
];

function parseDateRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw AppError.badRequest(`${fieldName} is required`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw AppError.badRequest(`${fieldName} must be a valid date/datetime`);
  }
  return d;
}

function parsePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Collect PostgreSQL error codes from Sequelize / node-postgres error chains. */
function collectPgCodes(err, acc = new Set()) {
  if (!err || typeof err !== 'object') return acc;
  const direct = err.original?.code || err.parent?.code || err.code;
  if (direct) acc.add(direct);
  if (err.parent) collectPgCodes(err.parent, acc);
  if (err.original && err.original !== err.parent) collectPgCodes(err.original, acc);
  if (Array.isArray(err.errors)) {
    for (const e of err.errors) collectPgCodes(e, acc);
  }
  return acc;
}

function isOverlapDbError(err) {
  return collectPgCodes(err).has('23P01');
}

function assertDoctorActorScope(appointment, actorRole, actorUserId) {
  if (actorRole === 'doctor' && appointment.doctor_id !== actorUserId) {
    throw AppError.forbidden('You can only modify your own appointments');
  }
}

function mapRow(row) {
  if (!row) return null;
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
}

class AppointmentService {
  async listDoctorAppointments(doctorId, filters = {}, actorRole, actorUserId) {
    nonEmptyTrimmedString(doctorId, 'doctorId');
    if (actorRole === 'doctor' && doctorId !== actorUserId) {
      throw AppError.forbidden('You can only list your own appointments');
    }

    const { page, limit, offset } = parsePagination(filters);
    const where = { doctor_id: doctorId };

    if (filters.status != null && String(filters.status).trim() !== '') {
      const s = nonEmptyTrimmedString(filters.status, 'status');
      if (!APPOINTMENT_STATUSES.includes(s)) {
        throw AppError.badRequest(
          `status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      where.status = s;
    }

    let fromD = null;
    let toD = null;
    if (filters.from != null && filters.from !== '') {
      fromD = parseDateRequired(filters.from, 'from');
    }
    if (filters.to != null && filters.to !== '') {
      toD = parseDateRequired(filters.to, 'to');
    }
    if (fromD && toD && fromD.getTime() > toD.getTime()) {
      throw AppError.badRequest('from must be before or equal to to', 'VALIDATION_ERROR');
    }
    if (fromD) {
      where.start_at = { ...where.start_at, [Op.gte]: fromD };
    }
    if (toD) {
      where.start_at = { ...where.start_at, [Op.lte]: toD };
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: SAFE_APPOINTMENT_INCLUDES,
      order: [['start_at', 'ASC']],
      limit,
      offset
    });

    return {
      items: rows.map(mapRow),
      meta: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit) || 1
      }
    };
  }

  async createAppointment(payload, actorUserId) {
    const patientId = nonEmptyTrimmedString(payload.patientId, 'patientId');
    const doctorId = nonEmptyTrimmedString(payload.doctorId, 'doctorId');
    const serviceId = nonEmptyTrimmedString(payload.serviceId, 'serviceId');
    const startAt = parseDateRequired(payload.startAt, 'startAt');
    const comment = payload.comment === undefined ? null : optionalTrimmedNullable(payload.comment);

    const patient = await Patient.findByPk(patientId);
    if (!patient || patient.is_archived) {
      throw AppError.notFound('Patient not found');
    }

    const doctor = await User.findByPk(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.is_active) {
      throw AppError.notFound('Doctor not found');
    }

    const service = await Service.findByPk(serviceId);
    if (!service || !service.is_available) {
      throw AppError.conflict('Service is not available', 'SERVICE_UNAVAILABLE');
    }

    const durationMs = Number(service.duration_min) * 60 * 1000;
    const endAt = new Date(startAt.getTime() + durationMs);

    try {
      return await sequelize.transaction(async (transaction) => {
        await slotService.assertIntervalFree({
          doctorId,
          serviceId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString()
        });

        const appointment = await Appointment.create(
          {
            patient_id: patientId,
            doctor_id: doctorId,
            service_id: serviceId,
            start_at: startAt,
            end_at: endAt,
            status: 'created',
            booked_price: service.price,
            comment,
            cancel_reason: null,
            cancelled_at: null
          },
          { transaction }
        );

        await auditService.logEvent(
          {
            userId: actorUserId,
            actionType: 'APPOINTMENT_CREATED',
            entityType: 'appointment',
            entityId: appointment.id,
            details: {
              doctor_id: doctorId,
              patient_id: patientId,
              service_id: serviceId,
              start_at: appointment.start_at,
              booked_price: String(service.price)
            }
          },
          { transaction }
        );

        const full = await Appointment.findByPk(appointment.id, {
          include: SAFE_APPOINTMENT_INCLUDES,
          transaction
        });
        return mapRow(full);
      });
    } catch (err) {
      if (isOverlapDbError(err)) {
        throw AppError.conflict('Time slot is no longer available', 'SLOT_UNAVAILABLE');
      }
      throw err;
    }
  }

  async updateAppointmentStatus(id, status, actorUserId, actorRole) {
    const next = nonEmptyTrimmedString(status, 'status');
    if (!['confirmed', 'completed'].includes(next)) {
      throw AppError.badRequest('status must be confirmed or completed');
    }

    const appointment = await Appointment.findByPk(id, { include: SAFE_APPOINTMENT_INCLUDES });
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    assertDoctorActorScope(appointment, actorRole, actorUserId);

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      throw AppError.conflict('Appointment cannot change status in its current state', 'INVALID_STATUS');
    }

    const allowed = NEXT_STATUS[appointment.status] || [];
    if (!allowed.includes(next)) {
      throw AppError.badRequest(`Cannot transition from ${appointment.status} to ${next}`);
    }

    const prev = appointment.status;
    await sequelize.transaction(async (transaction) => {
      await appointment.update({ status: next }, { transaction });

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'APPOINTMENT_STATUS_UPDATED',
          entityType: 'appointment',
          entityId: appointment.id,
          details: { from: prev, to: next }
        },
        { transaction }
      );
    });

    await appointment.reload({ include: SAFE_APPOINTMENT_INCLUDES });
    return mapRow(appointment);
  }

  async cancelAppointment(id, reason, actorUserId, actorRole) {
    const safeReason = nonEmptyTrimmedString(reason, 'reason');

    const appointment = await Appointment.findByPk(id, { include: SAFE_APPOINTMENT_INCLUDES });
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    assertDoctorActorScope(appointment, actorRole, actorUserId);

    if (appointment.status === 'cancelled') {
      throw AppError.conflict('Appointment is already cancelled', 'INVALID_STATUS');
    }
    if (appointment.status === 'completed') {
      throw AppError.conflict('Cannot cancel a completed appointment', 'INVALID_STATUS');
    }

    await sequelize.transaction(async (transaction) => {
      await appointment.update(
        {
          status: 'cancelled',
          cancel_reason: safeReason,
          cancelled_at: new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'APPOINTMENT_CANCELLED',
          entityType: 'appointment',
          entityId: appointment.id,
          details: { reason: safeReason }
        },
        { transaction }
      );
    });

    await appointment.reload({ include: SAFE_APPOINTMENT_INCLUDES });
    return mapRow(appointment);
  }

  async rescheduleAppointment(id, newStartAt, actorUserId) {
    const startAt = parseDateRequired(newStartAt, 'startAt');

    const appointment = await Appointment.findByPk(id, { include: SAFE_APPOINTMENT_INCLUDES });
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      throw AppError.conflict('Cannot reschedule appointment in its current state', 'INVALID_STATUS');
    }

    const service = await Service.findByPk(appointment.service_id);
    if (!service || !service.is_available) {
      throw AppError.conflict('Service is not available', 'SERVICE_UNAVAILABLE');
    }

    const durationMs = Number(service.duration_min) * 60 * 1000;
    const endAt = new Date(startAt.getTime() + durationMs);

    try {
      await sequelize.transaction(async (transaction) => {
        await slotService.assertIntervalFree({
          doctorId: appointment.doctor_id,
          serviceId: appointment.service_id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          excludeAppointmentId: appointment.id
        });

        const prevStart = appointment.start_at;
        const prevEnd = appointment.end_at;

        await appointment.update(
          {
            start_at: startAt,
            end_at: endAt
          },
          { transaction }
        );

        await auditService.logEvent(
          {
            userId: actorUserId,
            actionType: 'APPOINTMENT_RESCHEDULED',
            entityType: 'appointment',
            entityId: appointment.id,
            details: {
              previous_start_at: prevStart,
              previous_end_at: prevEnd,
              new_start_at: startAt,
              new_end_at: endAt
            }
          },
          { transaction }
        );
      });
    } catch (err) {
      if (isOverlapDbError(err)) {
        throw AppError.conflict('Time slot is no longer available', 'SLOT_UNAVAILABLE');
      }
      throw err;
    }

    await appointment.reload({ include: SAFE_APPOINTMENT_INCLUDES });
    return mapRow(appointment);
  }
}

module.exports = new AppointmentService();
