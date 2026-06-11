import db from '../db/database.js'
import { log } from './audit.service.js'
import { getBookingRaw, updateBookingStatus } from './booking.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type { Catering, UpsertCateringPayload } from '../../shared/types.js'

interface CateringCounts {
  student_count: number
  teacher_count: number
}

function getCounts(booking_id: string): CateringCounts {
  const sc = (
    db.prepare('SELECT COUNT(*) as count FROM students WHERE booking_id = ?').get(booking_id) as {
      count: number
    }
  ).count
  const tc = (
    db.prepare('SELECT COUNT(*) as count FROM teachers WHERE booking_id = ?').get(booking_id) as {
      count: number
    }
  ).count
  return { student_count: sc, teacher_count: tc }
}

function calculateCost(
  meal_standard: number,
  meal_type: 'lunch' | 'dinner' | 'both',
  student_count: number,
  teacher_count: number,
) {
  const multiplier = meal_type === 'both' ? 2 : 1
  const student_meal_cost = student_count * meal_standard * multiplier
  const teacher_meal_cost = teacher_count * meal_standard * 1.5 * multiplier
  const total_meal_cost = student_meal_cost + teacher_meal_cost
  return { student_meal_cost, teacher_meal_cost, total_meal_cost }
}

export function upsert(
  booking_id: string,
  payload: UpsertCateringPayload,
  user_id: string,
  user_name: string,
): Catering {
  getBookingRaw(booking_id)
  const counts = getCounts(booking_id)
  const costs = calculateCost(
    payload.meal_standard,
    payload.meal_type,
    counts.student_count,
    counts.teacher_count,
  )

  const now = new Date().toISOString()
  const existing = db
    .prepare('SELECT * FROM catering WHERE booking_id = ?')
    .get(booking_id) as Catering | undefined

  let id: string
  if (existing) {
    id = existing.id
    db.prepare(
      `UPDATE catering SET
        meal_standard = ?, meal_type = ?, extra_requirements = ?,
        student_count = ?, teacher_count = ?,
        student_meal_cost = ?, teacher_meal_cost = ?, total_meal_cost = ?,
        confirmed = 0, confirmed_by = NULL, confirmed_at = NULL,
        updated_at = ?
       WHERE booking_id = ?`,
    ).run(
      payload.meal_standard,
      payload.meal_type,
      payload.extra_requirements || null,
      counts.student_count,
      counts.teacher_count,
      costs.student_meal_cost,
      costs.teacher_meal_cost,
      costs.total_meal_cost,
      now,
      booking_id,
    )
  } else {
    id = crypto.randomUUID()
    db.prepare(
      `INSERT INTO catering (
        id, booking_id, meal_standard, meal_type, extra_requirements,
        student_count, teacher_count,
        student_meal_cost, teacher_meal_cost, total_meal_cost,
        confirmed, confirmed_by, confirmed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
    ).run(
      id,
      booking_id,
      payload.meal_standard,
      payload.meal_type,
      payload.extra_requirements || null,
      counts.student_count,
      counts.teacher_count,
      costs.student_meal_cost,
      costs.teacher_meal_cost,
      costs.total_meal_cost,
      now,
      now,
    )
  }

  const result = getCatering(booking_id)!
  log({
    target_type: 'catering',
    target_id: id,
    action: existing ? 'update' : 'create',
    user_id,
    user_name,
    before: existing,
    after: result,
  })
  return result
}

export function recalculate(booking_id: string): Catering | null {
  const existing = db
    .prepare('SELECT * FROM catering WHERE booking_id = ?')
    .get(booking_id) as Catering | undefined
  if (!existing) return null

  const counts = getCounts(booking_id)
  const costs = calculateCost(
    existing.meal_standard,
    existing.meal_type,
    counts.student_count,
    counts.teacher_count,
  )
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE catering SET
      student_count = ?, teacher_count = ?,
      student_meal_cost = ?, teacher_meal_cost = ?, total_meal_cost = ?,
      updated_at = ?
     WHERE booking_id = ?`,
  ).run(
    counts.student_count,
    counts.teacher_count,
    costs.student_meal_cost,
    costs.teacher_meal_cost,
    costs.total_meal_cost,
    now,
    booking_id,
  )
  return getCatering(booking_id)
}

export function confirm(booking_id: string, user_id: string, user_name: string): Catering {
  const before = db
    .prepare('SELECT * FROM catering WHERE booking_id = ?')
    .get(booking_id) as Catering | undefined
  if (!before) {
    throw new AppError(ERROR_CODES.NOT_FOUND, '餐饮记录不存在，请先设置餐饮', 404)
  }
  if (before.confirmed === 1) {
    return before
  }
  const now = new Date().toISOString()
  db.prepare(
    'UPDATE catering SET confirmed = 1, confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE booking_id = ?',
  ).run(user_id, now, now, booking_id)

  updateBookingStatus(booking_id, 'catering_confirmed')

  const after = getCatering(booking_id)!
  log({
    target_type: 'catering',
    target_id: before.id,
    action: 'confirm',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export function getCatering(booking_id: string): Catering | null {
  const stmt = db.prepare('SELECT * FROM catering WHERE booking_id = ?')
  return (stmt.get(booking_id) as Catering) || null
}
