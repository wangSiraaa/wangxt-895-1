import db from '../db/database.js'
import { log } from './audit.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import { getBookingRaw, updateBookingStatus } from './booking.service.js'
import type {
  Schedule,
  ScheduleDetail,
  ScheduleFilter,
  CreateSchedulePayload,
} from '../../shared/types.js'

function checkDuplicateSubmit(
  booking_id: string,
  guide_id: string,
  start_time: string,
  end_time: string,
  excludeId?: string,
): void {
  const stmt = excludeId
    ? db.prepare(
        'SELECT 1 FROM schedules WHERE booking_id = ? AND guide_id = ? AND start_time = ? AND end_time = ? AND id != ? LIMIT 1',
      )
    : db.prepare(
        'SELECT 1 FROM schedules WHERE booking_id = ? AND guide_id = ? AND start_time = ? AND end_time = ? LIMIT 1',
      )
  const exists = excludeId ? stmt.get(booking_id, guide_id, start_time, end_time, excludeId) : stmt.get(booking_id, guide_id, start_time, end_time)
  if (exists) {
    throw new AppError(ERROR_CODES.DUPLICATE_SUBMIT, '相同的排班已存在，请勿重复提交', 400)
  }
}

function checkScheduleConflict(
  guide_id: string,
  start_time: string,
  end_time: string,
  excludeId?: string,
): Schedule[] {
  const stmt = excludeId
    ? db.prepare(
        `SELECT * FROM schedules
         WHERE guide_id = ?
           AND id != ?
           AND start_time < ?
           AND end_time > ?`,
      )
    : db.prepare(
        `SELECT * FROM schedules
         WHERE guide_id = ?
           AND start_time < ?
           AND end_time > ?`,
      )
  const conflicts = (excludeId ? stmt.all(guide_id, excludeId, end_time, start_time) : stmt.all(guide_id, end_time, start_time)) as Schedule[]
  if (conflicts.length > 0) {
    throw new AppError(
      ERROR_CODES.SCHEDULE_CONFLICT,
      `排班时段与现有排班冲突，共 ${conflicts.length} 条冲突`,
      409,
      { conflicts },
    )
  }
  return conflicts
}

export function createSchedule(
  payload: CreateSchedulePayload,
  user_id: string,
  user_name: string,
): ScheduleDetail {
  const booking = getBookingRaw(payload.booking_id)
  const validStatuses = [
    'list_uploaded',
    'scheduled',
    'catering_confirmed',
    'risk_confirmed',
    'checked_in',
    'settled',
  ]
  if (!validStatuses.includes(booking.status)) {
    throw new AppError(
      ERROR_CODES.NO_STUDENT_LIST,
      `预约状态为 ${booking.status}，请先上传名单后再排班`,
      400,
    )
  }

  const start = new Date(payload.start_time).getTime()
  const end = new Date(payload.end_time).getTime()
  if (end <= start) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, '结束时间必须晚于开始时间', 400)
  }

  let created: ScheduleDetail | undefined

  const tx = db.transaction(() => {
    checkDuplicateSubmit(payload.booking_id, payload.guide_id, payload.start_time, payload.end_time)
    checkScheduleConflict(payload.guide_id, payload.start_time, payload.end_time)

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO schedules (id, booking_id, guide_id, start_time, end_time, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      payload.booking_id,
      payload.guide_id,
      payload.start_time,
      payload.end_time,
      payload.notes || null,
      user_id,
      now,
    )
    updateBookingStatus(payload.booking_id, 'scheduled')
    created = getScheduleDetail(id)
  })
  tx()

  if (created) {
    log({
      target_type: 'schedule',
      target_id: created.id,
      action: 'create',
      user_id,
      user_name,
      after: created,
    })
  }

  return created!
}

function getScheduleDetail(id: string): ScheduleDetail {
  const stmt = db.prepare(
    `SELECT sc.*, u.real_name as guide_name, b.visit_date as booking_visit_date, s.name as school_name
     FROM schedules sc
     LEFT JOIN users u ON sc.guide_id = u.id
     LEFT JOIN bookings b ON sc.booking_id = b.id
     LEFT JOIN schools s ON b.school_id = s.id
     WHERE sc.id = ?`,
  )
  const row = stmt.get(id) as ScheduleDetail | undefined
  if (!row) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '排班不存在', 404)
  }
  return row
}

function getScheduleRaw(id: string): Schedule {
  const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?')
  const row = stmt.get(id) as Schedule | undefined
  if (!row) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '排班不存在', 404)
  }
  return row
}

export function listSchedules(filter: ScheduleFilter = {}): ScheduleDetail[] {
  const { guide_id, date_from, date_to, booking_id } = filter
  const conditions: string[] = []
  const params: unknown[] = []

  if (guide_id) {
    conditions.push('sc.guide_id = ?')
    params.push(guide_id)
  }
  if (date_from) {
    conditions.push('date(sc.start_time) >= ?')
    params.push(date_from)
  }
  if (date_to) {
    conditions.push('date(sc.start_time) <= ?')
    params.push(date_to)
  }
  if (booking_id) {
    conditions.push('sc.booking_id = ?')
    params.push(booking_id)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const stmt = db.prepare(
    `SELECT sc.*, u.real_name as guide_name, b.visit_date as booking_visit_date, s.name as school_name
     FROM schedules sc
     LEFT JOIN users u ON sc.guide_id = u.id
     LEFT JOIN bookings b ON sc.booking_id = b.id
     LEFT JOIN schools s ON b.school_id = s.id
     ${where}
     ORDER BY sc.start_time ASC`,
  )
  return stmt.all(...params) as ScheduleDetail[]
}

export function cancelSchedule(id: string, user_id: string, user_name: string): ScheduleDetail {
  const before = getScheduleRaw(id)
  const bookingId = before.booking_id

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id)
    const count = (
      db.prepare('SELECT COUNT(*) as count FROM schedules WHERE booking_id = ?').get(bookingId) as {
        count: number
      }
    ).count
    if (count === 0) {
      const booking = getBookingRaw(bookingId)
      const orderedStatuses = [
        'draft',
        'list_uploaded',
        'scheduled',
        'catering_confirmed',
        'risk_confirmed',
        'checked_in',
        'settled',
      ]
      const currentIdx = orderedStatuses.indexOf(booking.status)
      if (currentIdx >= 2 && currentIdx <= 6) {
        db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(
          'list_uploaded',
          new Date().toISOString(),
          bookingId,
        )
      }
    }
  })
  tx()

  log({
    target_type: 'schedule',
    target_id: id,
    action: 'cancel',
    user_id,
    user_name,
    before,
  })

  return {
    ...before,
    guide_name: '',
    booking_visit_date: '',
    school_name: '',
  }
}
