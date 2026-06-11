import bcrypt from 'bcryptjs'
import db, { runTransaction } from './database.js'
import type { Role } from '../../shared/types.js'

function generateId(): string {
  return crypto.randomUUID()
}

interface SeedUser {
  username: string
  password: string
  real_name: string
  role: Role
}

const SEED_USERS: SeedUser[] = [
  { username: 'sales', password: '123456', real_name: '研学销售', role: 'sales' },
  { username: 'dispatcher', password: '123456', real_name: '接待调度', role: 'dispatcher' },
  { username: 'guide1', password: '123456', real_name: '讲解员张老师', role: 'guide' },
  { username: 'guide2', password: '123456', real_name: '讲解员李老师', role: 'guide' },
  { username: 'catering', password: '123456', real_name: '餐饮管理员', role: 'catering_admin' },
  { username: 'finance', password: '123456', real_name: '财务结算', role: 'finance' },
]

const SEED_SCHOOLS = [
  { name: '第一实验小学', contact: '王主任', contact_phone: '13800000001', address: '北京市朝阳区建国路88号' },
  { name: '阳光中学', contact: '李校长', contact_phone: '13800000002', address: '北京市海淀区中关村大街1号' },
  { name: '育才小学', contact: '赵老师', contact_phone: '13800000003', address: '北京市西城区西单北大街100号' },
]

const SEED_TIME_SLOTS = [
  { name: '上午场', start_time: '08:30', end_time: '11:30', capacity: 100 },
  { name: '下午场', start_time: '13:00', end_time: '16:00', capacity: 100 },
  { name: '晚间场', start_time: '18:00', end_time: '20:30', capacity: 80 },
]

export function seed(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) {
    console.log('[seed] 数据库已初始化，跳过种子数据')
    return
  }

  runTransaction(() => {
    const insertUser = db.prepare(
      'INSERT INTO users (id, username, password_hash, real_name, role) VALUES (?, ?, ?, ?, ?)'
    )
    for (const u of SEED_USERS) {
      const passwordHash = bcrypt.hashSync(u.password, 10)
      insertUser.run(generateId(), u.username, passwordHash, u.real_name, u.role)
    }
    console.log(`[seed] 已创建 ${SEED_USERS.length} 个用户`)

    const insertSchool = db.prepare(
      'INSERT INTO schools (id, name, contact, contact_phone, address, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
    )
    for (const s of SEED_SCHOOLS) {
      insertSchool.run(generateId(), s.name, s.contact, s.contact_phone, s.address)
    }
    console.log(`[seed] 已创建 ${SEED_SCHOOLS.length} 个学校`)

    const insertTimeSlot = db.prepare(
      'INSERT INTO time_slots (id, name, start_time, end_time, capacity) VALUES (?, ?, ?, ?, ?)'
    )
    for (const t of SEED_TIME_SLOTS) {
      insertTimeSlot.run(generateId(), t.name, t.start_time, t.end_time, t.capacity)
    }
    console.log(`[seed] 已创建 ${SEED_TIME_SLOTS.length} 个讲解时段`)
  })

  console.log('[seed] 种子数据初始化完成')
}

export default seed
