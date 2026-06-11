import { Router, type Response } from 'express'
import { z } from 'zod'
import db from '../db/database.js'
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import { log } from '../services/audit.service.js'
import type { School } from '../../shared/types.js'

const router = Router()

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  contact: z.string().optional(),
  contact_phone: z.string().optional(),
})

router.get(
  '/schools',
  authenticate,
  (_req: AuthRequest, res: Response): void => {
    const stmt = db.prepare('SELECT * FROM schools ORDER BY created_at DESC')
    const data = stmt.all() as School[]
    res.json({ success: true, data: { list: data, total: data.length } })
  },
)

router.post(
  '/schools',
  authenticate,
  requireRole('sales', 'dispatcher', 'admin'),
  (req: AuthRequest, res: Response): void => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, '参数校验失败', 400, parsed.error.errors)
    }
    if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED, '未登录', 401)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO schools (id, name, address, contact, contact_phone, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      id,
      parsed.data.name,
      parsed.data.address || null,
      parsed.data.contact || null,
      parsed.data.contact_phone || null,
      now,
    )
    const stmt = db.prepare('SELECT * FROM schools WHERE id = ?')
    const data = stmt.get(id) as School
    log({
      target_type: 'school',
      target_id: id,
      action: 'create',
      user_id: req.user.id,
      user_name: req.user.real_name,
      after: data,
    })
    res.status(201).json({ success: true, data })
  },
)

export default router
