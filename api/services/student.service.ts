import db from '../db/database.js'
import { log } from './audit.service.js'
import { AppError, ERROR_CODES } from '../errors/AppError.js'
import { updateBookingStatus, getBookingRaw } from './booking.service.js'
import { recalculate as recalculateCatering } from './catering.service.js'
import { recalculate as recalculateSettlement } from './settlement.service.js'
import type {
  Student,
  Teacher,
  UpdateStudentListPayload,
} from '../../shared/types.js'

export function updateStudentList(
  booking_id: string,
  payload: UpdateStudentListPayload,
  user_id: string,
  user_name: string,
): { students: Student[]; teachers: Teacher[]; student_count: number; teacher_count: number } {
  const { students, teachers } = payload
  const beforeBooking = getBookingRaw(booking_id)
  const before = getStudentList(booking_id)

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM students WHERE booking_id = ?').run(booking_id)
    db.prepare('DELETE FROM teachers WHERE booking_id = ?').run(booking_id)

    const now = new Date().toISOString()

    if (students.length > 0) {
      const insertStudent = db.prepare(
        'INSERT INTO students (id, booking_id, name, grade, class_name, id_card, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      for (const s of students) {
        insertStudent.run(
          crypto.randomUUID(),
          booking_id,
          s.name,
          s.grade || null,
          s.class_name || null,
          s.id_card || null,
          now,
        )
      }
    }

    if (teachers.length > 0) {
      const insertTeacher = db.prepare(
        'INSERT INTO teachers (id, booking_id, name, phone, id_card, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      for (const t of teachers) {
        insertTeacher.run(
          crypto.randomUUID(),
          booking_id,
          t.name,
          t.phone || null,
          t.id_card || null,
          now,
        )
      }
    }

    db.prepare(
      'UPDATE bookings SET expected_student_count = ?, expected_teacher_count = ?, updated_at = ? WHERE id = ?',
    ).run(students.length, teachers.length, now, booking_id)

    updateBookingStatus(booking_id, 'list_uploaded')
  })
  tx()

  const cateringExists = db
    .prepare('SELECT 1 FROM catering WHERE booking_id = ? LIMIT 1')
    .get(booking_id)
  if (cateringExists) {
    recalculateCatering(booking_id)
  }

  const settlementExists = db
    .prepare('SELECT 1 FROM settlements WHERE booking_id = ? LIMIT 1')
    .get(booking_id)
  if (settlementExists) {
    recalculateSettlement(booking_id)
  }

  const after = getStudentList(booking_id)
  log({
    target_type: 'student_list',
    target_id: booking_id,
    action: 'update',
    user_id,
    user_name,
    before,
    after,
  })

  return after
}

export function getStudentList(
  booking_id: string,
): { students: Student[]; teachers: Teacher[]; student_count: number; teacher_count: number } {
  const studentsStmt = db.prepare('SELECT * FROM students WHERE booking_id = ? ORDER BY created_at')
  const teachersStmt = db.prepare('SELECT * FROM teachers WHERE booking_id = ? ORDER BY created_at')
  const students = studentsStmt.all(booking_id) as Student[]
  const teachers = teachersStmt.all(booking_id) as Teacher[]
  return {
    students,
    teachers,
    student_count: students.length,
    teacher_count: teachers.length,
  }
}
