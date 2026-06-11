import { Router, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import * as bookingService from '../services/booking.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import type {
  CreateBookingPayload,
  UpdateBookingPayload,
  BookingFilter,
} from '../../shared/types.js'

const router = Router()

const createSchema = z.object({
  school_id: z.string().min(1),
  visit_date: z.string().min(1),
  expected_student_count: z.number().int().nonnegative(),
  expected_teacher_count: z.number().int().nonnegative(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
})

const updateSchema = createSchema.partial()

function parseQueryFilter(req: AuthRequest): BookingFilter {
  const q = req.query
  return {
    visit_date_from: typeof q.visit_date_from === 'string' ? q.visit_date_from : undefined,
    visit_date_to: typeof q.visit_date_to === 'string' ? q.visit_date_to : undefined,
    status: typeof q.status === 'string' ? (q.status as BookingFilter['status']) : undefined,
    school_id: typeof q.school_id === 'string' ? q.school_id : undefined,
    page: q.page ? Number(q.page) : undefined,
    page_size: q.page_size ? Number(q.page_size) : undefined,
  }
}

router.get(
  '/bookings',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const filter = parseQueryFilter(req)
    const result = bookingService.getBookings(filter)
    res.json({ success: true, data: result })
  },
)

router.get(
  '/bookings/:id',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const data = bookingService.getBookingDetail(req.params.id)
    res.json({ success: true, data })
  },
)

router.post(
  '/bookings',
  authenticate,
  requireRole('sales', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = bookingService.createBooking(
      parsed.data as CreateBookingPayload,
      req.user.id,
      req.user.real_name,
    )
    res.status(201).json({ success: true, data })
  },
)

router.put(
  '/bookings/:id',
  authenticate,
  requireRole('sales', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = bookingService.updateBooking(
      req.params.id,
      parsed.data as UpdateBookingPayload,
      req.user.id,
      req.user.real_name,
    )
    res.json({ success: true, data })
  },
)

router.post(
  '/bookings/:id/cancel',
  authenticate,
  requireRole('sales', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const data = bookingService.cancelBooking(req.params.id, req.user.id, req.user.real_name)
    res.json({ success: true, data })
  },
)

export default router
