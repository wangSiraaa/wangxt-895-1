export class AppError extends Error {
  public code: string
  public statusCode: number
  public details?: unknown

  constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export const ERROR_CODES = {
  NO_STUDENT_LIST: 'NO_STUDENT_LIST',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  DUPLICATE_SUBMIT: 'DUPLICATE_SUBMIT',
  RISK_NOT_CONFIRMED: 'RISK_NOT_CONFIRMED',
  INVALID_STATUS: 'INVALID_STATUS',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SETTLEMENT_CONFIRMED: 'SETTLEMENT_CONFIRMED',
} as const
