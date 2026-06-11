import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'app.db')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('sales', 'dispatcher', 'guide', 'catering_admin', 'finance', 'admin')),
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    contact_phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    visit_date TEXT NOT NULL,
    expected_student_count INTEGER NOT NULL DEFAULT 0,
    expected_teacher_count INTEGER NOT NULL DEFAULT 0,
    actual_student_count INTEGER,
    actual_teacher_count INTEGER,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','list_uploaded','scheduled','catering_confirmed','risk_confirmed','checked_in','settled','settlement_confirmed','completed','cancelled')),
    contact_name TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_visit_date ON bookings(visit_date)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`,
  `CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    class_name TEXT,
    id_card TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_students_booking ON students(booking_id)`,
  `CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    id_card TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS time_slots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    capacity INTEGER DEFAULT 50
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    guide_id TEXT NOT NULL REFERENCES users(id),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_schedules_guide_time ON schedules(guide_id, start_time, end_time)`,
  `CREATE TABLE IF NOT EXISTS catering (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id),
    meal_standard REAL NOT NULL DEFAULT 0,
    meal_type TEXT DEFAULT 'lunch',
    extra_requirements TEXT,
    student_count INTEGER DEFAULT 0,
    teacher_count INTEGER DEFAULT 0,
    student_meal_cost REAL DEFAULT 0,
    teacher_meal_cost REAL DEFAULT 0,
    total_meal_cost REAL DEFAULT 0,
    confirmed INTEGER DEFAULT 0,
    confirmed_by TEXT REFERENCES users(id),
    confirmed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS risk_notices (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id),
    signatory TEXT NOT NULL,
    notes TEXT,
    confirmed_by TEXT NOT NULL REFERENCES users(id),
    confirmed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id),
    meal_cost REAL DEFAULT 0,
    guide_fee REAL DEFAULT 0,
    ticket_fee REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    details_json TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
    confirmed_by TEXT REFERENCES users(id),
    confirmed_at TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(target_type, target_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`,
]

export function initializeDatabase(): void {
  const transaction = db.transaction(() => {
    for (const ddl of DDL_STATEMENTS) {
      db.exec(ddl)
    }
  })
  transaction()
}

export function runTransaction<T>(fn: () => T): T {
  const transaction = db.transaction(fn)
  return transaction()
}

export { db }
export default db
