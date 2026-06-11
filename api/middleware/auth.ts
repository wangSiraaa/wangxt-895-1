import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtUserPayload, Role, ApiResponse } from '../../shared/types.js'
import { ErrorCode } from '../../shared/types.js'
import { ERROR_CODES } from '../errors/AppError.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export interface AuthRequest extends Request {
  user?: JwtUserPayload
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse = {
      code: ERROR_CODES.UNAUTHORIZED,
      message: '认证失败',
      success: false,
    }
    res.status(401).json(response)
    return
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload
    req.user = {
      id: decoded.id,
      username: decoded.username,
      real_name: decoded.real_name,
      role: decoded.role,
    }
    next()
  } catch (err) {
    const response: ApiResponse = {
      code: ERROR_CODES.UNAUTHORIZED,
      message: '认证失败',
      success: false,
    }
    res.status(401).json(response)
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        code: ERROR_CODES.UNAUTHORIZED,
        message: '认证失败',
        success: false,
      }
      res.status(401).json(response)
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      const response: ApiResponse = {
        code: ERROR_CODES.FORBIDDEN,
        message: '权限不足',
        success: false,
      }
      res.status(403).json(response)
      return
    }

    next()
  }
}

export default authenticate
