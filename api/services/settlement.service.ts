import db from '../db/database.js'
import { log } from './audit.service.js'
import { getBookingRaw, updateBookingStatus } from './booking.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type {
  Settlement,
  SettlementFilter,
  SettlementDetail,
  SettlementDetailItem,
} from '../../shared/types.js'

interface BookingCounts {
  student_count: number
  teacher_count: number
}

function getBookingCounts(booking_id: string): BookingCounts {
  const booking = getBookingRaw(booking_id)
  const sc = booking.actual_student_count ?? booking.expected_student_count
  const tc = booking.actual_teacher_count ?? booking.expected_teacher_count
  return { student_count: sc, teacher_count: tc }
}

function calculateSettlement(booking_id: string): {
  meal_cost: number
  guide_fee: number
  ticket_fee: number
  total_amount: number
  details: SettlementDetailItem[]
} {
  const counts = getBookingCounts(booking_id)
  const details: SettlementDetailItem[] = []

  const cateringRow = db
    .prepare('SELECT total_meal_cost FROM catering WHERE booking_id = ?')
    .get(booking_id) as { total_meal_cost: number } | undefined
  const meal_cost = cateringRow?.total_meal_cost ?? 0
  if (meal_cost > 0) {
    details.push({
      type: 'meal',
      name: '餐饮费用',
      unit_price: 0,
      quantity: 1,
      amount: meal_cost,
      remark: '合计',
    })
  }

  const scheduleCount = (
    db.prepare('SELECT COUNT(*) as count FROM schedules WHERE booking_id = ?').get(booking_id) as {
      count: number
    }
  ).count
  const guide_fee = scheduleCount * 500
  if (guide_fee > 0) {
    details.push({
      type: 'guide',
      name: '讲解费',
      unit_price: 500,
      quantity: scheduleCount,
      amount: guide_fee,
    })
  }

  const ticket_fee = counts.student_count * 80 + counts.teacher_count * 60
  if (counts.student_count > 0) {
    details.push({
      type: 'ticket',
      name: '学生门票',
      unit_price: 80,
      quantity: counts.student_count,
      amount: counts.student_count * 80,
    })
  }
  if (counts.teacher_count > 0) {
    details.push({
      type: 'ticket',
      name: '教师门票',
      unit_price: 60,
      quantity: counts.teacher_count,
      amount: counts.teacher_count * 60,
    })
  }

  const total_amount = meal_cost + guide_fee + ticket_fee
  return { meal_cost, guide_fee, ticket_fee, total_amount, details }
}

export function generate(
  booking_id: string,
  user_id: string,
  user_name: string,
): SettlementDetail {
  const existing = db
    .prepare('SELECT * FROM settlements WHERE booking_id = ?')
    .get(booking_id) as Settlement | undefined

  if (existing?.status === 'confirmed') {
    throw new AppError(ERROR_CODES.SETTLEMENT_CONFIRMED, '结算单已确认，无法重新生成', 400)
  }

  const calc = calculateSettlement(booking_id)
  const now = new Date().toISOString()

  let id: string
  if (existing) {
    id = existing.id
    db.prepare(
      `UPDATE settlements SET
        meal_cost = ?, guide_fee = ?, ticket_fee = ?, total_amount = ?,
        details_json = ?, status = 'draft',
        confirmed_by = NULL, confirmed_at = NULL,
        updated_at = ?
       WHERE booking_id = ?`,
    ).run(
      calc.meal_cost,
      calc.guide_fee,
      calc.ticket_fee,
      calc.total_amount,
      JSON.stringify(calc.details),
      now,
      booking_id,
    )
  } else {
    id = crypto.randomUUID()
    db.prepare(
      `INSERT INTO settlements (
        id, booking_id, meal_cost, guide_fee, ticket_fee, total_amount,
        details_json, status, confirmed_by, confirmed_at,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, ?, ?, ?)`,
    ).run(
      id,
      booking_id,
      calc.meal_cost,
      calc.guide_fee,
      calc.ticket_fee,
      calc.total_amount,
      JSON.stringify(calc.details),
      user_id,
      now,
      now,
    )
  }

  updateBookingStatus(booking_id, 'settled')

  const result = getSettlement(id)!
  log({
    target_type: 'settlement',
    target_id: id,
    action: existing ? 'regenerate' : 'create',
    user_id,
    user_name,
    before: existing,
    after: result,
  })
  return result
}

export function recalculate(booking_id: string): SettlementDetail | null {
  const existing = db
    .prepare('SELECT * FROM settlements WHERE booking_id = ?')
    .get(booking_id) as Settlement | undefined
  if (!existing) return null
  if (existing.status === 'confirmed') return null

  const calc = calculateSettlement(booking_id)
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE settlements SET
      meal_cost = ?, guide_fee = ?, ticket_fee = ?, total_amount = ?,
      details_json = ?, updated_at = ?
     WHERE booking_id = ?`,
  ).run(
    calc.meal_cost,
    calc.guide_fee,
    calc.ticket_fee,
    calc.total_amount,
    JSON.stringify(calc.details),
    now,
    booking_id,
  )
  return getSettlement(existing.id)
}

export function confirm(id: string, user_id: string, user_name: string): SettlementDetail {
  const before = db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as
    | Settlement
    | undefined
  if (!before) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '结算单不存在', 404)
  }
  if (before.status === 'confirmed') {
    return buildDetail(before)
  }
  const now = new Date().toISOString()
  db.prepare(
    "UPDATE settlements SET status = 'confirmed', confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?",
  ).run(user_id, now, now, id)

  updateBookingStatus(before.booking_id, 'settlement_confirmed')

  const after = getSettlement(id)!
  log({
    target_type: 'settlement',
    target_id: id,
    action: 'confirm',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

function buildDetail(s: Settlement): SettlementDetail {
  let details: SettlementDetailItem[] = []
  try {
    details = JSON.parse(s.details_json || '[]')
  } catch {
    details = []
  }
  return { ...s, details }
}

export function getSettlement(id: string): SettlementDetail | null {
  const row = db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as
    | Settlement
    | undefined
  return row ? buildDetail(row) : null
}

export function listSettlements(
  filter: SettlementFilter = {},
): { list: SettlementDetail[]; total: number } {
  const { status, booking_id, page = 1, page_size = 20 } = filter
  const conditions: string[] = []
  const params: unknown[] = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (booking_id) {
    conditions.push('booking_id = ?')
    params.push(booking_id)
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM settlements ${where}`)
  const total = (countStmt.get(...params) as { count: number }).count

  const offset = (page - 1) * page_size
  const listStmt = db.prepare(
    `SELECT * FROM settlements ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
  const rows = listStmt.all(...params, page_size, offset) as Settlement[]
  const list = rows.map(buildDetail)

  return { list, total }
}
