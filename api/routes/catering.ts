import { Router, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as cateringService from '../services/catering.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type { UpsertCateringPayload } from '../../shared/types.js'

const router = Router()

const upsertSchema = z.object({
  meal_standard: z.number().positive(),
  meal_type: z.enum(['lunch', 'dinner', 'both']),
  extra_requirements: z.string().optional(),
})

router.get(
  '/catering/bookings/:bookingId',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const data = cateringService.getCatering(req.params.bookingId)
    res.json({ success: true, data })
  },
)

router.put(
  '/catering/bookings/:bookingId',
  authenticate,
  requireRole('catering_admin', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = upsertSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = cateringService.upsert(
      req.params.bookingId,
      parsed.data as UpsertCateringPayload,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

router.post(
  '/catering/bookings/:bookingId/recalculate',
  authenticate,
  requireRole('catering_admin', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const data = cateringService.recalculate(req.params.bookingId)
    res.json({ success: true, data })
  },
)

router.post(
  '/catering/bookings/:bookingId/confirm',
  authenticate,
  requireRole('catering_admin', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = cateringService.confirm(
      req.params.bookingId,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

export default router
