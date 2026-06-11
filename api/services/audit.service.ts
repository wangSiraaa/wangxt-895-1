import db from '../db/database.js'

interface LogPayload {
  target_type: string
  target_id: string
  action: string
  user_id: string
  user_name: string
  before?: unknown
  after?: unknown
}

interface AuditLogFilter {
  target_type?: string
  target_id?: string
  user_id?: string
  action?: string
  page?: number
  page_size?: number
}

let insertAuditLog: ReturnType<typeof db.prepare> | null = null
function getInsertAuditLog() {
  if (!insertAuditLog) {
    insertAuditLog = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, before_json, after_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
  }
  return insertAuditLog
}

export function log(payload: LogPayload): void {
  const id = crypto.randomUUID()
  const beforeJson = payload.before !== undefined ? JSON.stringify(payload.before) : null
  const afterJson = payload.after !== undefined ? JSON.stringify(payload.after) : null

  getInsertAuditLog().run(
    id,
    payload.user_id,
    payload.user_name,
    payload.action,
    payload.target_type,
    payload.target_id,
    beforeJson,
    afterJson,
  )
}

export function queryAuditLogs(filter: AuditLogFilter = {}): { list: unknown[]; total: number } {
  const { target_type, target_id, user_id, action, page = 1, page_size = 20 } = filter
  const conditions: string[] = []
  const params: unknown[] = []

  if (target_type) {
    conditions.push('target_type = ?')
    params.push(target_type)
  }
  if (target_id) {
    conditions.push('target_id = ?')
    params.push(target_id)
  }
  if (user_id) {
    conditions.push('user_id = ?')
    params.push(user_id)
  }
  if (action) {
    conditions.push('action = ?')
    params.push(action)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`)
  const total = (countStmt.get(...params) as { count: number }).count

  const offset = (page - 1) * page_size
  const listStmt = db.prepare(`
    SELECT * FROM audit_logs ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const list = listStmt.all(...params, page_size, offset)

  return { list, total }
}

export default { log, queryAuditLogs }
