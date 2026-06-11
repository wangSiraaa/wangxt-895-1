import { Router, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as scheduleService from '../services/schedule.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type { ScheduleFilter, CreateSchedulePayload } from '../../shared/types.js'

const router = Router()

const createSchema = z.object({
  booking_id: z.string().min(1),
  guide_id: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  notes: z.string().optional(),
})

function parseFilter(req: AuthRequest): ScheduleFilter {
  const q = req.query
  const user = req.user
  let guide_id: string | undefined =
    typeof q.guide_id === 'string' ? q.guide_id : undefined
  if (!guide_id && user?.role === 'guide') {
    guide_id = user.id
  }
  return {
    guide_id,
    date_from: typeof q.date_from === 'string' ? q.date_from : undefined,
    date_to: typeof q.date_to === 'string' ? q.date_to : undefined,
    booking_id: typeof q.booking_id === 'string' ? q.booking_id : undefined,
  }
}

router.get(
  '/schedules',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const user = req.user
    if (user?.role === 'guide' && req.query.guide_id && req.query.guide_id !== user.id) {
      throw new AppError(ERROR_CODES.FORBIDDEN, '讲解员只能查询自己的排班', 403)
    }
    const filter = parseFilter(req)
    const data = scheduleService.listSchedules(filter)
    res.json({ success: true, data })
  },
)

router.post(
  '/schedules',
  authenticate,
  requireRole('dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = scheduleService.createSchedule(
      parsed.data as CreateSchedulePayload,
      req.user.id,
      req.user.real_name,
    )
    res.status(201).json({ success: true, data })
  },
)

router.delete(
  '/schedules/:id',
  authenticate,
  requireRole('dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = scheduleService.cancelSchedule(req.params.id, req.user.id, req.user.real_name)
    res.json({ success: true, data })
  },
)

export default router
