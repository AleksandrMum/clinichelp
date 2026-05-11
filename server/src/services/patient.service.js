/**
 * Patients catalog — operational CRUD for managers; read access for doctors/admins.
 *
 * TEMPORARY (doctor): read endpoints allow listing/viewing patients broadly. Narrowing
 * visibility to “only patients linked to this doctor’s appointments” requires
 * AppointmentService + queries across appointments; intentionally not implemented here.
 *
 * @module services/patient.service
 */
const { Op } = require('sequelize');
const { sequelize, Patient } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');
const { nonEmptyTrimmedString, optionalTrimmedNullable } = require('../utils/validation');

const SAFE_PATIENT_ATTRIBUTES = [
  'id',
  'full_name',
  'phone',
  'birth_date',
  'notes',
  'is_archived',
  'archived_at',
  'created_at',
  'updated_at'
];

function mapPatient(row) {
  if (!row) return null;
  const plain = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return plain;
}

function parsePagination(pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

class PatientService {
  async searchPatients(search, pagination = {}, options = {}) {
    const { includeArchived = false } = options;
    const where = {};

    if (!includeArchived) {
      where.is_archived = false;
    }

    const term = typeof search === 'string' ? search.trim() : '';
    if (term) {
      const like = `%${term}%`;
      where[Op.or] = [{ full_name: { [Op.iLike]: like } }, { phone: { [Op.iLike]: like } }];
    }

    const { page, limit, offset } = parsePagination(pagination);

    const { rows, count } = await Patient.findAndCountAll({
      where,
      attributes: SAFE_PATIENT_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      items: rows.map(mapPatient),
      meta: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit) || 1
      }
    };
  }

  async getPatientById(id) {
    const patient = await Patient.findByPk(id, { attributes: SAFE_PATIENT_ATTRIBUTES });
    if (!patient) {
      throw AppError.notFound('Patient not found');
    }
    return mapPatient(patient);
  }

  async createPatient(payload, actorUserId) {
    const { fullName, phone, birthDate = null, notes } = payload || {};
    const safeFullName = nonEmptyTrimmedString(fullName, 'fullName');
    const safePhone = nonEmptyTrimmedString(phone, 'phone');
    const safeNotes = notes === undefined ? null : optionalTrimmedNullable(notes);

    return sequelize.transaction(async (transaction) => {
      const patient = await Patient.create(
        {
          full_name: safeFullName,
          phone: safePhone,
          birth_date: birthDate ?? null,
          notes: safeNotes,
          is_archived: false,
          archived_at: null
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'PATIENT_CREATED',
          entityType: 'patient',
          entityId: patient.id,
          details: { phone: patient.phone }
        },
        { transaction }
      );

      return mapPatient(patient);
    });
  }

  async updatePatient(id, payload, actorUserId) {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw AppError.notFound('Patient not found');
    }

    const patch = {};
    if (payload.fullName !== undefined) patch.full_name = nonEmptyTrimmedString(payload.fullName, 'fullName');
    if (payload.phone !== undefined) patch.phone = nonEmptyTrimmedString(payload.phone, 'phone');
    if (payload.birthDate !== undefined) patch.birth_date = payload.birthDate;
    if (payload.notes !== undefined) patch.notes = optionalTrimmedNullable(payload.notes);

    if (Object.keys(patch).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    return sequelize.transaction(async (transaction) => {
      await patient.update(patch, { transaction });

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'PATIENT_UPDATED',
          entityType: 'patient',
          entityId: patient.id,
          details: { changedFields: Object.keys(patch) }
        },
        { transaction }
      );

      await patient.reload({ attributes: SAFE_PATIENT_ATTRIBUTES, transaction });
      return mapPatient(patient);
    });
  }

  async archivePatient(id, actorUserId) {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw AppError.notFound('Patient not found');
    }
    if (patient.is_archived) {
      throw AppError.conflict('Patient is already archived', 'ALREADY_ARCHIVED');
    }

    return sequelize.transaction(async (transaction) => {
      await patient.update(
        {
          is_archived: true,
          archived_at: new Date()
        },
        { transaction }
      );

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'PATIENT_ARCHIVED',
          entityType: 'patient',
          entityId: patient.id,
          details: null
        },
        { transaction }
      );

      await patient.reload({ attributes: SAFE_PATIENT_ATTRIBUTES, transaction });
      return mapPatient(patient);
    });
  }
}

module.exports = new PatientService();
