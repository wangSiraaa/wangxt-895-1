import { Router, type Response } from 'express'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { queryAuditLogs } from '../services/audit.service.js'

const router = Router()

router.get(
  '/audit-logs',
  authenticate,
  (req: AuthRequest, res: Response): void => {
    const q = req.query
    const filter = {
      target_type: typeof q.target_type === 'string' ? q.target_type : undefined,
      target_id: typeof q.target_id === 'string' ? q.target_id : undefined,
      user_id: typeof q.user_id === 'string' ? q.user_id : undefined,
      action: typeof q.action === 'string' ? q.action : undefined,
      page: q.page ? Number(q.page) : undefined,
      page_size: q.page_size ? Number(q.page_size) : undefined,
    }
    const result = queryAuditLogs(filter)
    res.json({ success: true, data: result })
  },
)

export default router
