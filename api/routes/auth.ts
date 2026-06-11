import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/database.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import type { ApiResponse, JwtUserPayload, User } from '../../shared/types.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_EXPIRES_IN = '24h'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

interface LoginData {
  token: string
  user: JwtUserPayload
}

router.post('/login', (req: Request, res: Response): void => {
  try {
    const validated = loginSchema.parse(req.body)

    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(validated.username) as (User & { password_hash: string }) | undefined

    if (!user) {
      const response: ApiResponse = {
        code: ERROR_CODES.UNAUTHORIZED,
        message: '用户名或密码错误',
        success: false,
      }
      res.status(401).json(response)
      return
    }

    const passwordValid = bcrypt.compareSync(validated.password, user.password_hash)
    if (!passwordValid) {
      const response: ApiResponse = {
        code: ERROR_CODES.UNAUTHORIZED,
        message: '用户名或密码错误',
        success: false,
      }
      res.status(401).json(response)
      return
    }

    const payload: JwtUserPayload = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    const response: ApiResponse<LoginData> = {
      success: true,
      code: 'SUCCESS',
      message: '登录成功',
      data: {
        token,
        user: payload,
      },
    }
    res.status(200).json(response)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const response: ApiResponse = {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: err.errors.map(e => e.message).join(', '),
        success: false,
        errors: err.errors,
      }
      res.status(400).json(response)
      return
    }
    if (err instanceof AppError) {
      const response: ApiResponse = {
        code: err.code,
        message: err.message,
        success: false,
        errors: err.details,
      }
      res.status(err.statusCode).json(response)
      return
    }
    throw err
  }
})

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const response: ApiResponse<JwtUserPayload> = {
    success: true,
    code: 'SUCCESS',
    message: '获取成功',
    data: req.user,
  }
  res.status(200).json(response)
})

export default router
