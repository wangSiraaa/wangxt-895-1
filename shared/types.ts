export type Role = 'sales' | 'dispatcher' | 'guide' | 'catering_admin' | 'finance' | 'admin'

export type BookingStatus =
  | 'draft'
  | 'list_uploaded'
  | 'scheduled'
  | 'catering_confirmed'
  | 'risk_confirmed'
  | 'checked_in'
  | 'settled'
  | 'settlement_confirmed'
  | 'completed'
  | 'cancelled'

export interface User {
  id: string
  username: string
  password_hash?: string
  real_name: string
  role: Role
  phone?: string
  created_at: string
}

export interface JwtUserPayload {
  id: string
  username: string
  real_name: string
  role: Role
}

export interface School {
  id: string
  name: string
  address?: string
  contact?: string
  contact_phone?: string
  created_at: string
}

export interface Booking {
  id: string
  school_id: string
  visit_date: string
  expected_student_count: number
  expected_teacher_count: number
  actual_student_count?: number
  actual_teacher_count?: number
  status: BookingStatus
  contact_name?: string
  contact_phone?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface BookingDetail extends Booking {
  school_name: string
  school_address?: string
  created_by_name: string
}

export interface Student {
  id: string
  booking_id: string
  name: string
  grade?: string
  class_name?: string
  id_card?: string
  created_at: string
}

export interface Teacher {
  id: string
  booking_id: string
  name: string
  phone?: string
  id_card?: string
  created_at: string
}

export interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  capacity: number
}

export interface Schedule {
  id: string
  booking_id: string
  guide_id: string
  start_time: string
  end_time: string
  notes?: string
  created_by: string
  created_at: string
}

export interface ScheduleDetail extends Schedule {
  guide_name: string
  booking_visit_date: string
  school_name: string
}

export interface Catering {
  id: string
  booking_id: string
  meal_standard: number
  meal_type: 'lunch' | 'dinner' | 'both'
  extra_requirements?: string
  student_count: number
  teacher_count: number
  student_meal_cost: number
  teacher_meal_cost: number
  total_meal_cost: number
  confirmed: number
  confirmed_by?: string
  confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface RiskNotice {
  id: string
  booking_id: string
  signatory: string
  notes?: string
  confirmed_by: string
  confirmed_at: string
}

export interface Settlement {
  id: string
  booking_id: string
  meal_cost: number
  guide_fee: number
  ticket_fee: number
  total_amount: number
  details_json: string
  status: 'draft' | 'confirmed'
  confirmed_by?: string
  confirmed_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface SettlementDetail extends Settlement {
  details: SettlementDetailItem[]
}

export interface SettlementDetailItem {
  type: 'meal' | 'guide' | 'ticket'
  name: string
  unit_price: number
  quantity: number
  amount: number
  remark?: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  target_type: string
  target_id: string
  before_json?: string
  after_json?: string
  created_at: string
}

export interface BookingFilter {
  visit_date_from?: string
  visit_date_to?: string
  status?: BookingStatus
  school_id?: string
  page?: number
  page_size?: number
}

export interface ScheduleFilter {
  guide_id?: string
  date_from?: string
  date_to?: string
  booking_id?: string
}

export interface SettlementFilter {
  status?: 'draft' | 'confirmed'
  booking_id?: string
  page?: number
  page_size?: number
}

export interface CreateBookingPayload {
  school_id: string
  visit_date: string
  expected_student_count: number
  expected_teacher_count: number
  contact_name?: string
  contact_phone?: string
  notes?: string
}

export interface UpdateBookingPayload {
  school_id?: string
  visit_date?: string
  expected_student_count?: number
  expected_teacher_count?: number
  contact_name?: string
  contact_phone?: string
  notes?: string
}

export interface UpdateStudentListPayload {
  students: Array<{ name: string; grade?: string; class_name?: string; id_card?: string }>
  teachers: Array<{ name: string; phone?: string; id_card?: string }>
}

export interface CreateSchedulePayload {
  booking_id: string
  guide_id: string
  start_time: string
  end_time: string
  notes?: string
}

export interface UpsertCateringPayload {
  meal_standard: number
  meal_type: 'lunch' | 'dinner' | 'both'
  extra_requirements?: string
}

export interface ConfirmRiskPayload {
  signatory: string
  notes?: string
}

export interface CheckinPayload {
  actual_student_count: number
  actual_teacher_count: number
}

export interface ApiResponse<T = unknown> {
  code?: string
  message?: string
  success?: boolean
  data?: T
  error?: unknown
  errors?: unknown
}

export enum ErrorCode {
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  DUPLICATE_SUBMIT = 'DUPLICATE_SUBMIT',
  NO_STUDENT_LIST = 'NO_STUDENT_LIST',
  RISK_NOT_CONFIRMED = 'RISK_NOT_CONFIRMED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  AUTH_FAILED = 'AUTH_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}
