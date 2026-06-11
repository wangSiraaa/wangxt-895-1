import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import db from './db/database.js'
import { AppError, ERROR_CODES } from './errors/AppError.js'
import type { ApiResponse } from '../shared/types.js'

import authRoutes from './routes/auth.js'
import bookingRoutes, { bookingPublicRouter } from './routes/bookings.js'
import studentRoutes from './routes/students.js'
import scheduleRoutes from './routes/schedules.js'
import cateringRoutes from './routes/catering.js'
import checkinRoutes from './routes/checkin.js'
import settlementRoutes from './routes/settlements.js'
import auditRoutes from './routes/audit.js'
import schoolRoutes from './routes/schools.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api', bookingPublicRouter)
app.use('/api', bookingRoutes)
app.use('/api', studentRoutes)
app.use('/api', scheduleRoutes)
app.use('/api', cateringRoutes)
app.use('/api', checkinRoutes)
app.use('/api', settlementRoutes)
app.use('/api', auditRoutes)
app.use('/api', schoolRoutes)

app.get('/api/health', (_req: Request, res: Response): void => {
  let databaseStatus: 'connected' | 'disconnected' = 'disconnected'
  let overallStatus: 'ok' | 'error' = 'error'
  try {
    db.prepare('SELECT 1').get()
    databaseStatus = 'connected'
    overallStatus = 'ok'
  } catch (_err) {
    databaseStatus = 'disconnected'
    overallStatus = 'error'
  }
  res.status(200).json({
    status: overallStatus,
    database: databaseStatus,
    timestamp: Date.now(),
  })
})

app.use((_req: Request, res: Response): void => {
  const response: ApiResponse = {
    code: ERROR_CODES.NOT_FOUND,
    message: 'API 路由不存在',
    success: false,
  }
  res.status(404).json(response)
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof z.ZodError) {
    const response: ApiResponse = {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: error.errors.map(e => e.message).join(', '),
      success: false,
      errors: error.errors,
    }
    res.status(400).json(response)
    return
  }
  if (error instanceof AppError) {
    const response: ApiResponse = {
      code: error.code,
      message: error.message,
      success: false,
      errors: error.details,
    }
    res.status(error.statusCode).json(response)
    return
  }
  console.error('[Server Error]', error)
  const response: ApiResponse = {
    code: 'SERVER_ERROR',
    message: error.message || '服务器内部错误',
    success: false,
  }
  res.status(500).json(response)
})

export default app
