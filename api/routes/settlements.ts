import { Router, type Response } from 'express'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as settlementService from '../services/settlement.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type { SettlementFilter } from '../../shared/types.js'

const router = Router()

function parseFilter(req: AuthRequest): SettlementFilter {
  const q = req.query
  return {
    status: typeof q.status === 'string' ? (q.status as 'draft' | 'confirmed') : undefined,
    booking_id: typeof q.booking_id === 'string' ? q.booking_id : undefined,
    page: q.page ? Number(q.page) : undefined,
    page_size: q.page_size ? Number(q.page_size) : undefined,
  }
}

router.get(
  '/settlements',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const filter = parseFilter(req)
    const result = settlementService.listSettlements(filter)
    res.json({ success: true, data: result })
  },
)

router.get(
  '/settlements/:id',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const data = settlementService.getSettlement(req.params.id)
    if (!data) {
      throw new AppError(ERROR_CODES.NOT_FOUND, '结算单不存在', 404)
    }
    res.json({ success: true, data })
  },
)

router.post(
  '/settlements/bookings/:bookingId/generate',
  authenticate,
  requireRole('finance', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = settlementService.generate(
      req.params.bookingId,
      req.user.id,
      req.user.real_name,
    )
    res.status(201).json({ success: true, data })
  },
)

router.post(
  '/settlements/:id/confirm',
  authenticate,
  requireRole('finance', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = settlementService.confirm(req.params.id, req.user.id, req.user.real_name)
    res.json({ success: true, data })
  },
)

export default router
