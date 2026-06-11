import db from '../db/database.js'
import { log } from './audit.service.js'
import { getBookingRaw, getBookingDetail, updateBookingStatus } from './booking.service.js'
import { recalculate as recalculateCatering } from './catering.service.js'
import { recalculate as recalculateSettlement } from './settlement.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type {
  RiskNotice,
  ConfirmRiskPayload,
  CheckinPayload,
  BookingDetail,
} from '../../shared/types.js'

export function confirmRiskNotice(
  booking_id: string,
  payload: ConfirmRiskPayload,
  user_id: string,
  user_name: string,
): RiskNotice {
  getBookingRaw(booking_id)
  const now = new Date().toISOString()
  const existing = db
    .prepare('SELECT * FROM risk_notices WHERE booking_id = ?')
    .get(booking_id) as RiskNotice | undefined

  let id: string
  if (existing) {
    id = existing.id
    db.prepare(
      'UPDATE risk_notices SET signatory = ?, notes = ?, confirmed_by = ?, confirmed_at = ? WHERE booking_id = ?',
    ).run(payload.signatory, payload.notes || null, user_id, now, booking_id)
  } else {
    id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO risk_notices (id, booking_id, signatory, notes, confirmed_by, confirmed_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, booking_id, payload.signatory, payload.notes || null, user_id, now)
  }

  updateBookingStatus(booking_id, 'risk_confirmed')

  const result = db
    .prepare('SELECT * FROM risk_notices WHERE booking_id = ?')
    .get(booking_id) as RiskNotice
  log({
    target_type: 'risk_notice',
    target_id: booking_id,
    action: 'confirm',
    user_id,
    user_name,
    before: existing,
    after: result,
  })
  return result
}

export function checkin(
  booking_id: string,
  payload: CheckinPayload,
  user_id: string,
  user_name: string,
): BookingDetail {
  const before = getBookingRaw(booking_id)
  const riskExists = db
    .prepare('SELECT 1 FROM risk_notices WHERE booking_id = ? LIMIT 1')
    .get(booking_id)
  if (!riskExists) {
    throw new AppError(ERROR_CODES.RISK_NOT_CONFIRMED, '请先确认风险告知书', 400)
  }

  updateBookingStatus(booking_id, 'checked_in', {
    actual_student_count: payload.actual_student_count,
    actual_teacher_count: payload.actual_teacher_count,
  })

  const cateringExists = db
    .prepare('SELECT 1 FROM catering WHERE booking_id = ? LIMIT 1')
    .get(booking_id)
  if (cateringExists) {
    recalculateCatering(booking_id)
  }

  const settlementExists = db
    .prepare('SELECT 1 FROM settlements WHERE booking_id = ? LIMIT 1')
    .get(booking_id)
  if (settlementExists) {
    recalculateSettlement(booking_id)
  }

  const after = getBookingDetail(booking_id)
  log({
    target_type: 'booking',
    target_id: booking_id,
    action: 'checkin',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export function completeBooking(
  booking_id: string,
  user_id: string,
  user_name: string,
): BookingDetail {
  const before = getBookingRaw(booking_id)
  updateBookingStatus(booking_id, 'completed')
  const after = getBookingDetail(booking_id)
  log({
    target_type: 'booking',
    target_id: booking_id,
    action: 'complete',
    user_id,
    user_name,
    before,
    after,
  })
  return after
}

export function getRiskNotice(booking_id: string): RiskNotice | null {
  const stmt = db.prepare('SELECT * FROM risk_notices WHERE booking_id = ?')
  return (stmt.get(booking_id) as RiskNotice) || null
}
