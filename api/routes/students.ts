import { Router, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as studentService from '../services/student.service.js'
import type { UpdateStudentListPayload } from '../../shared/types.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'

const router = Router()

const updateSchema = z.object({
  students: z.array(
    z.object({
      name: z.string().min(1),
      grade: z.string().optional(),
      class_name: z.string().optional(),
      id_card: z.string().optional(),
    }),
  ),
  teachers: z.array(
    z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      id_card: z.string().optional(),
    }),
  ),
})

router.get(
  '/bookings/:bookingId/students',
  authenticate,
  requireRole('sales', 'dispatcher', 'guide', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const data = studentService.getStudentList(req.params.bookingId)
    res.json({ success: true, data })
  },
)

router.post(
  '/bookings/:bookingId/students',
  authenticate,
  requireRole('sales', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = studentService.updateStudentList(
      req.params.bookingId,
      parsed.data as UpdateStudentListPayload,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

export default router
