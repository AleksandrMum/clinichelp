const { Op } = require('sequelize');
const { ScheduleRule, ScheduleException, Appointment, Service, User } = require('../../db/models');
const { AppError } = require('../common/errors/app-error');

const STEP_MS = 60 * 1000;

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

/** Monday=1 .. Sunday=7 (UTC calendar day). */
function utcWeekday1To7(d) {
  const w = d.getUTCDay();
  return w === 0 ? 7 : w;
}

function utcDayStart(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(dayStart, n) {
  return new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate() + n));
}

/** Combine UTC calendar day with TIME string HH:mm:ss */
function combineUtcDayAndTime(dayStartUtc, timeVal) {
  const s = String(timeVal);
  const parts = s.split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1] || 0);
  const ss = Number(parts[2] || 0);
  return new Date(
    Date.UTC(dayStartUtc.getUTCFullYear(), dayStartUtc.getUTCMonth(), dayStartUtc.getUTCDate(), hh, mm, ss)
  );
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      out.push([cur[0], cur[1]]);
    }
  }
  return out;
}

function subtractInterval(ranges, sub) {
  const [s, e] = sub;
  const out = [];
  for (const rng of ranges) {
    const [rs, re] = rng;
    if (e <= rs || s >= re) {
      out.push([rs, re]);
      continue;
    }
    if (s > rs) out.push([rs, Math.min(s, re)]);
    if (e < re) out.push([Math.max(e, rs), re]);
  }
  return mergeIntervals(out.filter(([a, b]) => b > a));
}

function clipInterval(interval, clipStart, clipEnd) {
  const [s, e] = interval;
  const ns = Math.max(s, clipStart);
  const ne = Math.min(e, clipEnd);
  if (ns >= ne) return null;
  return [ns, ne];
}

/** True if [a,b) ⊆ some merged interval [rs,re] with rs<=a and re>=b. */
function intervalContained(ranges, a, b) {
  for (const [rs, re] of ranges) {
    if (rs <= a && re >= b) return true;
  }
  return false;
}

async function assertDoctorAndService(doctorId, serviceId) {
  const doctor = await User.findByPk(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.is_active) {
    throw AppError.notFound('Doctor not found');
  }
  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw AppError.notFound('Service not found');
  }
  if (!service.is_available) {
    throw AppError.conflict('Service is not available', 'SERVICE_UNAVAILABLE');
  }
  const dur = Number(service.duration_min);
  if (!Number.isFinite(dur) || dur <= 0) {
    throw AppError.badRequest('Invalid service duration');
  }
  return service;
}

class SlotService {
  /**
   * Build merged availability (ms ranges) for one UTC calendar day from rules + exceptions (active only).
   */
  async buildDayAvailabilityMs(doctorId, dayStartUtc, rules, exceptions) {
    const weekday = utcWeekday1To7(dayStartUtc);
    const dayEndUtc = addUtcDays(dayStartUtc, 1).getTime();

    let ranges = [];
    for (const r of rules) {
      if (r.weekday !== weekday) continue;
      const st = combineUtcDayAndTime(dayStartUtc, r.start_time).getTime();
      const en = combineUtcDayAndTime(dayStartUtc, r.end_time).getTime();
      if (en > st) ranges.push([st, en]);
    }
    ranges = mergeIntervals(ranges);

    const dayStartMs = dayStartUtc.getTime();

    for (const ex of exceptions) {
      const xs = new Date(ex.start_at).getTime();
      const xe = new Date(ex.end_at).getTime();
      const overlap = clipInterval([xs, xe], dayStartMs, dayEndUtc);
      if (!overlap) continue;

      if (ex.exception_type === 'day_off') {
        ranges = subtractInterval(ranges, overlap);
      } else if (ex.exception_type === 'extra_shift') {
        ranges = mergeIntervals([...ranges, overlap]);
      }
    }

    return ranges;
  }

  subtractAppointments(ranges, appointments, dayStartMs, dayEndMs) {
    let out = ranges;
    for (const appt of appointments) {
      if (appt.status === 'cancelled') continue;
      const as = new Date(appt.start_at).getTime();
      const ae = new Date(appt.end_at).getTime();
      const o = clipInterval([as, ae], dayStartMs, dayEndMs);
      if (o) out = subtractInterval(out, o);
    }
    return out;
  }

  /**
   * @returns {{ startAt: string, endAt: string }[]}
   */
  async findFreeSlots({ doctorId, serviceId, from, to, durationMin: durationMinOverride }) {
    const fromD = parseDateRequired(from, 'from');
    const toD = parseDateRequired(to, 'to');
    if (fromD >= toD) {
      throw AppError.badRequest('from must be before to');
    }

    const service = await assertDoctorAndService(doctorId, serviceId);
    const durationMin = durationMinOverride != null ? Number(durationMinOverride) : Number(service.duration_min);
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      throw AppError.badRequest('durationMin must be a positive number');
    }
    const durationMs = durationMin * 60 * 1000;

    const [rules, exceptions, appointments] = await Promise.all([
      ScheduleRule.findAll({
        where: { doctor_id: doctorId, is_archived: false },
        attributes: ['weekday', 'start_time', 'end_time']
      }),
      ScheduleException.findAll({
        where: {
          doctor_id: doctorId,
          is_archived: false,
          end_at: { [Op.gt]: fromD },
          start_at: { [Op.lt]: toD }
        },
        attributes: ['start_at', 'end_at', 'exception_type']
      }),
      Appointment.findAll({
        where: {
          doctor_id: doctorId,
          status: { [Op.ne]: 'cancelled' },
          end_at: { [Op.gt]: fromD },
          start_at: { [Op.lt]: toD }
        },
        attributes: ['start_at', 'end_at', 'status']
      })
    ]);

    const slots = [];
    let day = utcDayStart(fromD);

    while (day < toD) {
      const dayStartMs = day.getTime();
      const dayEndMs = addUtcDays(day, 1).getTime();

      let avail = await this.buildDayAvailabilityMs(doctorId, day, rules, exceptions);
      avail = this.subtractAppointments(avail, appointments, dayStartMs, dayEndMs);

      const windowStart = Math.max(dayStartMs, fromD.getTime());
      const windowEnd = Math.min(dayEndMs, toD.getTime());

      for (const rng of avail) {
        const clipped = clipInterval(rng, windowStart, windowEnd);
        if (!clipped) continue;
        const [fs, fe] = clipped;
        for (let t = fs; t + durationMs <= fe; t += STEP_MS) {
          slots.push({
            startAt: new Date(t).toISOString(),
            endAt: new Date(t + durationMs).toISOString()
          });
        }
      }

      day = addUtcDays(day, 1);
    }

    return slots;
  }

  /**
   * True if [startAt, endAt) lies fully inside merged availability (rules + exceptions − appointments).
   * MVP: start/end must fall on the same UTC calendar day as service duration implies single-day visits.
   */
  async assertIntervalFree({ doctorId, serviceId, startAt, endAt, excludeAppointmentId = null }) {
    const start = parseDateRequired(startAt, 'startAt');
    const end = parseDateRequired(endAt, 'endAt');
    if (start >= end) {
      throw AppError.badRequest('startAt must be before endAt');
    }

    const service = await assertDoctorAndService(doctorId, serviceId);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = durationMs / (60 * 1000);
    if (Math.abs(durationMin - Number(service.duration_min)) > 1e-9) {
      throw AppError.badRequest('Interval length must match service duration');
    }

    const dayStartUtc = utcDayStart(start);
    if (utcDayStart(end).getTime() !== dayStartUtc.getTime()) {
      throw AppError.badRequest('Appointment must start and end on the same UTC calendar day');
    }

    const dayStartMs = dayStartUtc.getTime();
    const dayEndMs = addUtcDays(dayStartUtc, 1).getTime();

    const [rules, exceptions, appointments] = await Promise.all([
      ScheduleRule.findAll({
        where: { doctor_id: doctorId, is_archived: false },
        attributes: ['weekday', 'start_time', 'end_time']
      }),
      ScheduleException.findAll({
        where: {
          doctor_id: doctorId,
          is_archived: false,
          end_at: { [Op.gt]: dayStartUtc },
          start_at: { [Op.lt]: new Date(dayEndMs) }
        },
        attributes: ['start_at', 'end_at', 'exception_type']
      }),
      Appointment.findAll({
        where: {
          doctor_id: doctorId,
          status: { [Op.ne]: 'cancelled' },
          end_at: { [Op.gt]: dayStartUtc },
          start_at: { [Op.lt]: new Date(dayEndMs) },
          ...(excludeAppointmentId ? { id: { [Op.ne]: excludeAppointmentId } } : {})
        },
        attributes: ['start_at', 'end_at', 'status']
      })
    ]);

    let avail = await this.buildDayAvailabilityMs(doctorId, dayStartUtc, rules, exceptions);
    avail = this.subtractAppointments(avail, appointments, dayStartMs, dayEndMs);

    const sm = start.getTime();
    const em = end.getTime();
    if (!intervalContained(avail, sm, em)) {
      throw AppError.conflict('Selected time is not available', 'SLOT_UNAVAILABLE');
    }
  }
}

module.exports = new SlotService();
