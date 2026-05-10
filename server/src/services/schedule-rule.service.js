const { sequelize, ScheduleRule, User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');
const auditService = require('./audit.service');

const SAFE_RULE_ATTRIBUTES = [
  'id',
  'doctor_id',
  'weekday',
  'start_time',
  'end_time',
  'is_archived',
  'archived_at',
  'created_at',
  'updated_at'
];

function mapRule(row) {
  if (!row) return null;
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
}

function timeToSeconds(value, label) {
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    throw AppError.badRequest(`${label}: invalid time format (use HH:mm or HH:mm:ss)`);
  }
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] !== undefined ? Number(m[3]) : 0;
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) {
    throw AppError.badRequest(`${label}: invalid time`);
  }
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) {
    throw AppError.badRequest(`${label}: time out of range`);
  }
  return hh * 3600 + mm * 60 + ss;
}

function normalizeTimeForDb(value, label) {
  const secs = timeToSeconds(value, label);
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function validateWeekday(wd, idx) {
  const label = `rules[${idx}].weekday`;
  const n = Number(wd);
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    throw AppError.badRequest(`${label} must be integer 1..7`);
  }
  return n;
}

function validateRulesPayload(rules) {
  if (!Array.isArray(rules)) {
    throw AppError.badRequest('rules must be an array');
  }

  const byWeekday = {};
  const normalized = [];

  rules.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') {
      throw AppError.badRequest(`rules[${idx}] must be an object`);
    }
    const weekday = validateWeekday(raw.weekday, idx);
    const startNorm = normalizeTimeForDb(raw.startTime ?? raw.start_time, `rules[${idx}].startTime`);
    const endNorm = normalizeTimeForDb(raw.endTime ?? raw.end_time, `rules[${idx}].endTime`);

    const startSec = timeToSeconds(startNorm, `rules[${idx}].startTime`);
    const endSec = timeToSeconds(endNorm, `rules[${idx}].endTime`);
    if (startSec >= endSec) {
      throw AppError.badRequest(`rules[${idx}]: startTime must be before endTime`);
    }

    if (!byWeekday[weekday]) byWeekday[weekday] = [];
    byWeekday[weekday].push({ startSec, endSec });

    normalized.push({
      weekday,
      start_time: startNorm,
      end_time: endNorm
    });
  });

  Object.entries(byWeekday).forEach(([wd, intervals]) => {
    intervals.sort((a, b) => a.startSec - b.startSec);
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].startSec < intervals[i - 1].endSec) {
        throw AppError.conflict(`Overlapping rules on weekday ${wd}`, 'RULE_OVERLAP');
      }
    }
  });

  return normalized;
}

async function assertDoctorUser(doctorId) {
  const user = await User.findByPk(doctorId);
  if (!user) {
    throw AppError.notFound('Doctor not found');
  }
  if (user.role !== 'doctor') {
    throw AppError.badRequest('schedule targets users with role doctor');
  }
  if (!user.is_active) {
    throw AppError.conflict('Doctor account is deactivated', 'DOCTOR_INACTIVE');
  }
}

class ScheduleRuleService {
  async listDoctorRules(doctorId) {
    await assertDoctorUser(doctorId);

    const rows = await ScheduleRule.findAll({
      where: { doctor_id: doctorId, is_archived: false },
      attributes: SAFE_RULE_ATTRIBUTES,
      order: [
        ['weekday', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    return rows.map(mapRule);
  }

  async replaceDoctorRules(doctorId, rulesInput, actorUserId) {
    await assertDoctorUser(doctorId);
    const normalized = validateRulesPayload(rulesInput);

    return sequelize.transaction(async (transaction) => {
      const archivedAt = new Date();

      await ScheduleRule.update(
        { is_archived: true, archived_at: archivedAt },
        {
          where: { doctor_id: doctorId, is_archived: false },
          transaction
        }
      );

      if (normalized.length > 0) {
        await ScheduleRule.bulkCreate(
          normalized.map((r) => ({
            doctor_id: doctorId,
            weekday: r.weekday,
            start_time: r.start_time,
            end_time: r.end_time,
            is_archived: false,
            archived_at: null
          })),
          { transaction }
        );
      }

      await auditService.logEvent(
        {
          userId: actorUserId,
          actionType: 'SCHEDULE_RULES_REPLACED',
          entityType: 'schedule_rules_doctor',
          entityId: doctorId,
          details: {
            ruleCount: normalized.length
          }
        },
        { transaction }
      );

      const rows = await ScheduleRule.findAll({
        where: { doctor_id: doctorId, is_archived: false },
        attributes: SAFE_RULE_ATTRIBUTES,
        order: [
          ['weekday', 'ASC'],
          ['start_time', 'ASC']
        ],
        transaction
      });

      return rows.map(mapRule);
    });
  }
}

module.exports = new ScheduleRuleService();
