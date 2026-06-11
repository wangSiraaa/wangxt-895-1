import db from '../db/database.js'
import { log } from './audit.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type {
  Booking,
  BookingDetail,
  BookingFilter,
  CreateBookingPayload,
  UpdateBookingPayload,
  BookingStatus,
  AuditBookingPayload,
  AuditStatus,
  Schedule,
} from '../../shared/types.js'

const STATUSES_ALLOW_UPDATE: BookingStatus[] = ['draft', 'list_uploaded']

const STATUS_ORDER: BookingStatus[] = [
  'draft',
  'list_uploaded',
  'scheduled',
  'catering_confirmed',
  'risk_confirmed',
  'checked_in',
  'settled',
  'settlement_confirmed',
  'completed',
  'cancelled',
]

export function ensureMinStatus(current: BookingStatus, target: BookingStatus): BookingStatus {
  const currentIdx = STATUS_ORDER.indexOf(current)
  const targetIdx = STATUS_ORDER.indexOf(target)
  return targetIdx > currentIdx ? target : current
}

export function createBooking(payload: CreateBookingPayload, user_id: string, user_name: string): Booking {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const stmt = db.prepare(
    `INSERT INTO bookings (
      id, school_id, visit_date, expected_student_count, expected_teacher_count,
      status, contact_name, contact_phone, notes, audit_status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  stmt.run(
    id,
    payload.school_id,
    payload.visit_date,
    payload.expected_student_count,
    payload.expected_teacher_count,
    'draft',
    payload.contact_name || null,
    payload.contact_phone || null,
    payload.notes || null,
    'pending',
    user_id,
    now,
    now,
  )
  const booking = getBookingDetail(id)
  log({
    target_type: 'booking',
    target_id: id,
    action: 'create',
    user_id,
    user_name,
    after: booking,
  })
  return booking as Booking
}

export function getBookings(filter: BookingFilter = {}): { list: BookingDetail[]; total: number } {
  const { visit_date_from, visit_date_to, status, school_id, page = 1, page_size = 20 } = filter
  const conditions: string[] = []
  const params: unknown[] = []

  if (visit_date_from) {
    conditions.push('b.visit_date >= ?')
    params.push(visit_date_from)
  }
  if (visit_date_to) {
    conditions.push('b.visit_date <= ?')
    params.push(visit_date_to)
  }
  if (status) {
    conditions.push('b.status = ?')
    params.push(status)
  }
  if (school_id) {
    conditions.push('b.school_id = ?')
    params.push(school_id)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM bookings b ${where}`)
  const total = (countStmt.get(...params) as { count: number }).count

  const offset = (page - 1) * page_size
  const listStmt = db.prepare(
    `SELECT b.*, s.name as school_name, s.address as school_address, u.real_name as created_by_name, au.real_name as audit_by_name
     FROM bookings b
     LEFT JOIN schools s ON b.school_id = s.id
     LEFT JOIN users u ON b.created_by = u.id
     LEFT JOIN users au ON b.audit_by = au.id
     ${where}
     ORDER BY b.visit_date DESC, b.created_at DESC
     LIMIT ? OFFSET ?`,
  )
  const list = listStmt.all(...params, page_size, offset) as BookingDetail[]

  return { list, total }
}

export function getBookingDetail(id: string): BookingDetail {
  const stmt = db.prepare(
    `SELECT b.*, s.name as school_name, s.address as school_address, u.real_name as created_by_name, au.real_name as audit_by_name
     FROM bookings b
     LEFT JOIN schools s ON b.school_id = s.id
     LEFT JOIN users u ON b.created_by = u.id
     LEFT JOIN users au ON b.audit_by = au.id
     WHERE b.id = ?`,
  )
  const row = stmt.get(id) as BookingDetail | undefined
  if (!row) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '预约不存在', 404)
  }
  return row
}

export function getBookingRaw(id: string): Booking {
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?')
  const row = stmt.get(id) as Booking | undefined
  if (!row) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '预约不存在', 404)
  }
  return row
}

function checkGuideScheduleConflictOnDate(
  guide_id: string,
  visit_date: string,
  start_time: string,
  end_time: string,
  excludeBookingId?: string,
): Schedule[] {
  const dateStart = `${visit_date}T00:00:00.000Z`
  const dateEnd = `${visit_date}T23:59:59.999Z`
  const stmt = excludeBookingId
    ? db.prepare(
        `SELECT * FROM schedules
         WHERE guide_id = ?
           AND booking_id != ?
           AND start_time >= ?
           AND start_time <= ?
           AND start_time < ?
           AND end_time > ?`,
      )
    : db.prepare(
        `SELECT * FROM schedules
         WHERE guide_id = ?
           AND start_time >= ?
           AND start_time <= ?
           AND start_time < ?
           AND end_time > ?`,
      )
  const conflicts = (excludeBookingId
    ? stmt.all(guide_id, excludeBookingId, dateStart, dateEnd, end_time, start_time)
    : stmt.all(guide_id, dateStart, dateEnd, end_time, start_time)) as Schedule[]
  if (conflicts.length > 0) {
    throw new AppError(
      ERROR_CODES.SCHEDULE_CONFLICT,
      `修改到访日期后，讲解员在新日期存在 ${conflicts.length} 条排班冲突`,
      409,
      { conflicts },
    )
  }
  return conflicts
}

export function updateBooking(
  id: string,
  payload: UpdateBookingPayload,
  user_id: string,
  user_name: string,
): BookingDetail {
  const before = getBookingRaw(id)
  if (!STATUSES_ALLOW_UPDATE.includes(before.status)) {
    throw new AppError(
      ERROR_CODES.INVALID_STATUS,
      `当前状态 ${before.status} 不允许修改，仅 draft/list_uploaded 可修改`,
      400,
    )
  }

  if (payload.visit_date && payload.visit_date !== before.visit_date) {
    const existingSchedules = db
      .prepare('SELECT * FROM schedules WHERE booking_id = ?')
      .all(id) as Schedule[]
    for (const sch of existingSchedules) {
      const startTime = new Date(sch.start_time)
      const endTime = new Date(sch.end_time)
      const hhmmss = (d: Date) => d.toISOString().substring(11, 23) + 'Z'
      const newStartStr = `${payload.visit_date}T${hhmmss(startTime)}`
      const newEndStr = `${payload.visit_date}T${hhmmss(endTime)}`
      checkGuideScheduleConflictOnDate(sch.guide_id, payload.visit_date, newStartStr, newEndStr, id)
    }
  }

  const now = new Date().toISOString()
  const fields: string[] = []
  const params: unknown[] = []

  const updatable: (keyof UpdateBookingPayload)[] = [
    'school_id',
    'visit_date',
    'expected_student_count',
    'expected_teacher_count',
    'contact_name',
    'contact_phone',
    'notes',
  ]
  for (const key of updatable) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(payload[key])
    }
  }
  fields.push('updated_at = ?')
  params.push(now, id)

  const stmt = db.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`)
  stmt.run(...params)

  const after = getBookingDetail(id)
  log({
    target_type: 'booking',
    target_id: id,
    action: 'update',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export function updateBookingStatus(
  id: string,
  minStatus: BookingStatus,
  extraFields?: Record<string, unknown>,
): void {
  const current = getBookingRaw(id)
  const newStatus = ensureMinStatus(current.status, minStatus)
  if (newStatus === current.status && !extraFields) return

  const fields: string[] = ['status = ?', 'updated_at = ?']
  const params: unknown[] = [newStatus, new Date().toISOString()]

  if (extraFields) {
    for (const [k, v] of Object.entries(extraFields)) {
      fields.push(`${k} = ?`)
      params.push(v)
    }
  }
  params.push(id)
  const stmt = db.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`)
  stmt.run(...params)
}

export function cancelBooking(id: string, user_id: string, user_name: string): BookingDetail {
  const before = getBookingRaw(id)
  if (before.status === 'cancelled') {
    throw new AppError(ERROR_CODES.INVALID_STATUS, '预约已取消', 400)
  }
  if (before.status === 'settlement_confirmed' || before.status === 'completed') {
    throw new AppError(ERROR_CODES.INVALID_STATUS, `当前状态 ${before.status} 不允许取消`, 400)
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM schedules WHERE booking_id = ?').run(id)
    const now = new Date().toISOString()
    db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(
      'cancelled',
      now,
      id,
    )
  })
  tx()

  const after = getBookingDetail(id)
  log({
    target_type: 'booking',
    target_id: id,
    action: 'cancel',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export function auditBooking(
  id: string,
  payload: AuditBookingPayload,
  user_id: string,
  user_name: string,
): BookingDetail {
  const before = getBookingRaw(id)
  const validStatuses: AuditStatus[] = ['pending', 'approved', 'rejected']
  if (!validStatuses.includes(payload.audit_status)) {
    throw new AppError(ERROR_CODES.AUDIT_INVALID, '审核状态无效', 400)
  }
  if (before.audit_status !== 'pending') {
    throw new AppError(ERROR_CODES.ALREADY_AUDITED, '该预约已审核，不可重复审核', 409)
  }
  if (payload.audit_status === 'rejected' && !payload.audit_remark) {
    throw new AppError(ERROR_CODES.AUDIT_INVALID, '审核驳回时必须填写审核说明', 400)
  }

  const now = new Date().toISOString()
  const stmt = db.prepare(
    `UPDATE bookings SET audit_status = ?, audit_remark = ?, audit_by = ?, audit_at = ?, updated_at = ? WHERE id = ?`,
  )
  stmt.run(
    payload.audit_status,
    payload.audit_remark || null,
    user_id,
    now,
    now,
    id,
  )

  const after = getBookingDetail(id)
  log({
    target_type: 'booking',
    target_id: id,
    action: `audit_${payload.audit_status}`,
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export interface PublicResultFilter {
  visit_date_from?: string
  visit_date_to?: string
  page?: number
  page_size?: number
}

export function getPublicResults(filter: PublicResultFilter = {}): { list: BookingDetail[]; total: number } {
  const { visit_date_from, visit_date_to, page = 1, page_size = 20 } = filter
  const conditions: string[] = ["b.audit_status IN ('approved','rejected')"]
  const params: unknown[] = []

  if (visit_date_from) {
    conditions.push('b.visit_date >= ?')
    params.push(visit_date_from)
  }
  if (visit_date_to) {
    conditions.push('b.visit_date <= ?')
    params.push(visit_date_to)
  }

  const where = 'WHERE ' + conditions.join(' AND ')

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM bookings b ${where}`)
  const total = (countStmt.get(...params) as { count: number }).count

  const offset = (page - 1) * page_size
  const listStmt = db.prepare(
    `SELECT b.id, b.visit_date, b.expected_student_count, b.expected_teacher_count,
            b.status, b.audit_status, b.audit_remark, b.audit_at, b.notes,
            s.name as school_name, s.address as school_address,
            u.real_name as created_by_name, au.real_name as audit_by_name
     FROM bookings b
     LEFT JOIN schools s ON b.school_id = s.id
     LEFT JOIN users u ON b.created_by = u.id
     LEFT JOIN users au ON b.audit_by = au.id
     ${where}
     ORDER BY b.audit_at DESC, b.visit_date DESC
     LIMIT ? OFFSET ?`,
  )
  const list = listStmt.all(...params, page_size, offset) as BookingDetail[]

  return { list, total }
}
