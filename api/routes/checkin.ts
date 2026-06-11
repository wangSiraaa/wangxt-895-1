import { Router, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as checkinService from '../services/checkin.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type { ConfirmRiskPayload, CheckinPayload } from '../../shared/types.js'

const router = Router()

const riskSchema = z.object({
  signatory: z.string().min(1),
  notes: z.string().optional(),
})

const checkinSchema = z.object({
  actual_student_count: z.number().int().nonnegative(),
  actual_teacher_count: z.number().int().nonnegative(),
})

router.get(
  '/checkin/bookings/:bookingId/risk',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const data = checkinService.getRiskNotice(req.params.bookingId)
    res.json({ success: true, data })
  },
)

router.post(
  '/checkin/bookings/:bookingId/risk',
  authenticate,
  requireRole('sales', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = riskSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = checkinService.confirmRiskNotice(
      req.params.bookingId,
      parsed.data as ConfirmRiskPayload,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

router.post(
  '/checkin/bookings/:bookingId/checkin',
  authenticate,
  requireRole('guide', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = checkinSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = checkinService.checkin(
      req.params.bookingId,
      parsed.data as CheckinPayload,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

router.post(
  '/checkin/bookings/:bookingId/complete',
  authenticate,
  requireRole('guide', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = checkinService.completeBooking(
      req.params.bookingId,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

export default router
