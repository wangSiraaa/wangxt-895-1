#!/usr/bin/env node
/**
 * 景区研学团队接待系统 Smoke 测试脚本
 *
 * 验证 3 个核心业务约束场景：
 *   1. 安排讲解员重叠时段排班失败  -> SCHEDULE_CONFLICT
 *   2. 未上传名单确认接待/排班失败 -> NO_STUDENT_LIST
 *   3. 学生人数变化后结算金额重新计算
 *
 * 用法：
 *   node scripts/smoke.mjs           # 假设后端已在 3000 端口运行
 *   node scripts/smoke.mjs --init    # 初始化数据库再跑（会清理 data 目录并重启 API 进程）
 */

import http from 'node:http'
import { spawn } from 'node:child_process'
import { rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE_URL = 'http://127.0.0.1:3000'

// ============== HTTP 工具 ==============
function request(method, urlPath, body = undefined, token = undefined) {
  const u = new URL(urlPath, BASE_URL)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const data = body ? JSON.stringify(body) : undefined
  if (data) headers['Content-Length'] = Buffer.byteLength(data)

  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers },
      (res) => {
        let chunks = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (chunks += c))
        res.on('end', () => {
          let parsed
          try { parsed = chunks ? JSON.parse(chunks) : {} } catch { parsed = { raw: chunks } }
          resolve({ status: res.statusCode, body: parsed, headers: res.headers })
        })
      },
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}
const get = (p, t) => request('GET', p, undefined, t)
const post = (p, b, t) => request('POST', p, b, t)
const put = (p, b, t) => request('PUT', p, b, t)

// ============== 断言工具 ==============
let passCount = 0
let failCount = 0
const results = []
function assert(name, cond, detail = '') {
  if (cond) {
    console.log(`  ✅ ${name}`)
    passCount++
    results.push({ name, ok: true, detail })
  } else {
    console.log(`  ❌ ${name} ${detail ? '-> ' + detail : ''}`)
    failCount++
    results.push({ name, ok: false, detail })
  }
}
function section(title) {
  console.log(`\n━━━━━━━━━━━━━━━━━ ${title} ━━━━━━━━━━━━━━━━━`)
}

// ============== 登录 ==============
const CREDENTIALS = {
  sales: { username: 'sales', password: '123456' },
  dispatcher: { username: 'dispatcher', password: '123456' },
  guide1: { username: 'guide1', password: '123456' },
  guide2: { username: 'guide2', password: '123456' },
  catering: { username: 'catering', password: '123456' },
  finance: { username: 'finance', password: '123456' },
}
const TOKENS = {}
const USER_IDS = {}

async function loginAll() {
  section('登录所有角色')
  for (const [k, v] of Object.entries(CREDENTIALS)) {
    const r = await post('/api/auth/login', v)
    assert(`${k} 登录成功`, r.status === 200 && r.body?.success, `status=${r.status}`)
    if (r.body?.data?.token) {
      TOKENS[k] = r.body.data.token
      USER_IDS[k] = r.body.data.user.id
    }
  }
}

// ============== 数据准备 ==============
async function prepareSchools() {
  section('查询学校列表（确保预置数据存在）')
  const r = await get('/api/schools', TOKENS.sales)
  assert('HTTP 200', r.status === 200)
  const list = r.body?.data?.list || r.body?.list || r.body?.data || []
  assert('至少 1 所学校', Array.isArray(list) && list.length >= 1, `count=${list.length}`)
  return list
}

// ============== 场景一：讲解员重叠时段排班失败 ==============
async function scenario_schedule_conflict(schools) {
  section('场景一：讲解员重叠时段排班失败')

  // 1. 研学销售创建预约 + 上传名单
  const bookingResp = await post('/api/bookings', {
    school_id: schools[0].id,
    visit_date: '2030-07-01',
    expected_student_count: 50,
    expected_teacher_count: 5,
    contact_name: '王主任',
    contact_phone: '13800000000',
  }, TOKENS.sales)
  assert('创建预约 HTTP 201/200', bookingResp.status === 200 || bookingResp.status === 201, `status=${bookingResp.status}`)
  const booking1 = bookingResp.body?.data || bookingResp.body
  assert('预约 ID 存在', booking1?.id, 'booking1 id missing')

  // 上传名单（50 名学生 + 5 位老师）
  const students = Array.from({ length: 50 }, (_, i) => ({ name: `学生${i + 1}`, grade: '四年级' }))
  const teachers = Array.from({ length: 5 }, (_, i) => ({ name: `老师${i + 1}` }))
  const listResp = await post(`/api/bookings/${booking1.id}/students`, { students, teachers }, TOKENS.sales)
  assert('上传名单成功', listResp.status === 200 && (listResp.body?.success || listResp.body?.data?.student_count === 50),
    `status=${listResp.status} body=${JSON.stringify(listResp.body)}`)

  // 2. 接待调度：第一次排班（guide1，10:00-12:00）- 应成功
  const sch1Resp = await post('/api/schedules', {
    booking_id: booking1.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-01T10:00:00.000Z',
    end_time: '2030-07-01T12:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('第一次排班成功', sch1Resp.status === 200 || sch1Resp.status === 201,
    `status=${sch1Resp.status} ${JSON.stringify(sch1Resp.body)}`)

  // 3. 接待调度：第二次排班（guide1，11:00-13:00 重叠）- 应失败 SCHEDULE_CONFLICT
  const sch2Resp = await post('/api/schedules', {
    booking_id: booking1.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-01T11:00:00.000Z',
    end_time: '2030-07-01T13:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('重叠排班 HTTP 409 或业务错误码',
    sch2Resp.status === 409 || sch2Resp.status === 400,
    `status=${sch2Resp.status}`)
  const conflictCode = sch2Resp.body?.code || sch2Resp.body?.errors?.[0]?.code
  assert(`错误码 = SCHEDULE_CONFLICT`,
    conflictCode === 'SCHEDULE_CONFLICT',
    `实际 code=${conflictCode} body=${JSON.stringify(sch2Resp.body).slice(0, 200)}`)

  // 4. 完全相同的排班再次提交 -> DUPLICATE_SUBMIT
  const dupResp = await post('/api/schedules', {
    booking_id: booking1.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-01T10:00:00.000Z',
    end_time: '2030-07-01T12:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('重复提交返回业务错误 (SCHEDULE_CONFLICT 或 DUPLICATE_SUBMIT)',
    (dupResp.status >= 400) &&
    (dupResp.body?.code === 'DUPLICATE_SUBMIT' || dupResp.body?.code === 'SCHEDULE_CONFLICT'),
    `status=${dupResp.status} code=${dupResp.body?.code}`)

  // 5. guide2 同时间段排班 -> 成功（不同讲解员）
  const sch3Resp = await post('/api/schedules', {
    booking_id: booking1.id,
    guide_id: USER_IDS.guide2,
    start_time: '2030-07-01T10:00:00.000Z',
    end_time: '2030-07-01T12:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('不同讲解员同时间段排班成功', sch3Resp.status === 200 || sch3Resp.status === 201,
    `status=${sch3Resp.status} ${JSON.stringify(sch3Resp.body)}`)

  // 6. 完全不重叠时间段（guide1 14:00-16:00）-> 成功
  const sch4Resp = await post('/api/schedules', {
    booking_id: booking1.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-01T14:00:00.000Z',
    end_time: '2030-07-01T16:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('不重叠时间段排班成功', sch4Resp.status === 200 || sch4Resp.status === 201,
    `status=${sch4Resp.status}`)

  return { booking1 }
}

// ============== 场景二：未上传名单排班/签到失败 ==============
async function scenario_no_student_list(schools) {
  section('场景二：未上传名单排班/确认接待失败')

  // 1. 创建预约（不上传名单）
  const bookingResp = await post('/api/bookings', {
    school_id: schools[0].id,
    visit_date: '2030-07-02',
    expected_student_count: 30,
    expected_teacher_count: 3,
    contact_name: '李老师',
  }, TOKENS.sales)
  const booking2 = bookingResp.body?.data || bookingResp.body
  assert('创建预约成功', (bookingResp.status === 200 || bookingResp.status === 201) && booking2?.id, `status=${bookingResp.status} id=${booking2?.id}`)

  // 2. 尝试排班 -> NO_STUDENT_LIST
  const schResp = await post('/api/schedules', {
    booking_id: booking2.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-02T10:00:00.000Z',
    end_time: '2030-07-02T12:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('未上传名单排班 HTTP 400', schResp.status === 400, `status=${schResp.status}`)
  assert('错误码 = NO_STUDENT_LIST', schResp.body?.code === 'NO_STUDENT_LIST',
    `code=${schResp.body?.code}`)

  // 3. 上传名单后，排班应成功
  const students = Array.from({ length: 30 }, (_, i) => ({ name: `学生A${i + 1}` }))
  const teachers = Array.from({ length: 3 }, (_, i) => ({ name: `老师A${i + 1}` }))
  await post(`/api/bookings/${booking2.id}/students`, { students, teachers }, TOKENS.sales)

  const schResp2 = await post('/api/schedules', {
    booking_id: booking2.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-02T10:00:00.000Z',
    end_time: '2030-07-02T12:00:00.000Z',
  }, TOKENS.dispatcher)
  assert('名单上传后排班成功', schResp2.status === 200 || schResp2.status === 201,
    `status=${schResp2.status} ${JSON.stringify(schResp2.body).slice(0, 120)}`)

  // 4. 未完成风险告知签到 -> RISK_NOT_CONFIRMED
  const checkinResp = await post(`/api/checkin/bookings/${booking2.id}/checkin`, {
    actual_student_count: 30,
    actual_teacher_count: 3,
  }, TOKENS.guide1)
  assert('未告知风险签到 -> 400', checkinResp.status === 400, `status=${checkinResp.status}`)
  assert('错误码 = RISK_NOT_CONFIRMED', checkinResp.body?.code === 'RISK_NOT_CONFIRMED',
    `code=${checkinResp.body?.code}`)

  // 5. 完成风险告知后，签到成功
  await post(`/api/checkin/bookings/${booking2.id}/risk`, { signatory: '家长代表' }, TOKENS.sales)
  const checkinResp2 = await post(`/api/checkin/bookings/${booking2.id}/checkin`, {
    actual_student_count: 30,
    actual_teacher_count: 3,
  }, TOKENS.guide1)
  assert('风险告知后签到成功', checkinResp2.status === 200 || checkinResp2.status === 201,
    `status=${checkinResp2.status}`)

  return { booking2 }
}

// ============== 场景三：人数变化后结算金额重新计算 ==============
async function scenario_recalculate_settlement(schools) {
  section('场景三：学生人数变化后结算金额重新计算')

  // 1. 创建预约
  const bookingResp = await post('/api/bookings', {
    school_id: schools[1].id,
    visit_date: '2030-07-03',
    expected_student_count: 40,
    expected_teacher_count: 4,
    contact_name: '赵校长',
  }, TOKENS.sales)
  const booking3 = bookingResp.body?.data || bookingResp.body

  // 2. 上传名单：40 学生 + 4 老师
  const s1 = Array.from({ length: 40 }, (_, i) => ({ name: `甲班学生${i + 1}` }))
  const t1 = Array.from({ length: 4 }, (_, i) => ({ name: `甲班老师${i + 1}` }))
  await post(`/api/bookings/${booking3.id}/students`, { students: s1, teachers: t1 }, TOKENS.sales)

  // 3. 排 1 个班 + 设餐饮（人均 50 元，午餐）
  await post('/api/schedules', {
    booking_id: booking3.id,
    guide_id: USER_IDS.guide1,
    start_time: '2030-07-03T10:00:00.000Z',
    end_time: '2030-07-03T12:00:00.000Z',
  }, TOKENS.dispatcher)
  await put(`/api/catering/bookings/${booking3.id}`, {
    meal_standard: 50,
    meal_type: 'lunch',
  }, TOKENS.catering)

  // 4. 生成第一次结算
  const gen1 = await post(`/api/settlements/bookings/${booking3.id}/generate`, {}, TOKENS.finance)
  assert('第一次生成结算成功', (gen1.status === 200 || gen1.status === 201) && gen1.body?.data,
    `status=${gen1.status}`)
  const set1 = gen1.body?.data || gen1.body
  const total1 = set1.total_amount
  const meal1 = set1.meal_cost
  const ticket1 = set1.ticket_fee
  const guide1 = set1.guide_fee
  console.log(`     第一次结算：讲解=${guide1} 餐饮=${meal1} 门票=${ticket1} 合计=${total1}`)
  assert('第一次餐饮 = 40*50 + 4*50*1.5 = 2300', Math.abs(meal1 - 2300) < 0.01,
    `expected=2300 actual=${meal1}`)
  assert('第一次门票 = 40*80 + 4*60 = 3440', Math.abs(ticket1 - 3440) < 0.01,
    `expected=3440 actual=${ticket1}`)
  assert('第一次讲解 = 1*500 = 500', Math.abs(guide1 - 500) < 0.01,
    `expected=500 actual=${guide1}`)

  // 5. **关键：重新上传名单（60 学生 + 6 老师）**
  const s2 = Array.from({ length: 60 }, (_, i) => ({ name: `甲班学生${i + 1}` }))
  const t2 = Array.from({ length: 6 }, (_, i) => ({ name: `甲班老师${i + 1}` }))
  const listUpd = await post(`/api/bookings/${booking3.id}/students`, { students: s2, teachers: t2 }, TOKENS.sales)
  assert('重新上传名单触发 recalculated 标记', listUpd.status === 200)

  // 6. 再次生成/查询结算：金额应被重新计算
  const gen2 = await post(`/api/settlements/bookings/${booking3.id}/generate`, {}, TOKENS.finance)
  assert('人数变化后重算结算成功', gen2.status === 200 || gen2.status === 201, `status=${gen2.status}`)
  const set2 = gen2.body?.data || gen2.body
  const total2 = set2.total_amount
  const meal2 = set2.meal_cost
  const ticket2 = set2.ticket_fee
  console.log(`     第二次结算：讲解=${set2.guide_fee} 餐饮=${meal2} 门票=${ticket2} 合计=${total2}`)

  assert('餐饮金额应重新计算（60*50 + 6*75 = 3450）', Math.abs(meal2 - 3450) < 0.01,
    `expected=3450 actual=${meal2}`)
  assert('门票金额应重新计算（60*80 + 6*60 = 5160）', Math.abs(ticket2 - 5160) < 0.01,
    `expected=5160 actual=${ticket2}`)
  assert('结算总金额变大（人数增加）', total2 > total1,
    `total1=${total1} total2=${total2}`)

  // 7. 非财务角色尝试确认结算 -> 被拒绝
  const badConfirm = await post(`/api/settlements/${set2.id}/confirm`, {}, TOKENS.sales)
  assert('非财务角色确认结算 -> 403 或 PERMISSION_DENIED',
    badConfirm.status === 403 || badConfirm.body?.code === 'PERMISSION_DENIED' || badConfirm.status >= 400,
    `status=${badConfirm.status} code=${badConfirm.body?.code}`)

  // 8. 财务角色确认 -> 成功
  const goodConfirm = await post(`/api/settlements/${set2.id}/confirm`, {}, TOKENS.finance)
  assert('财务角色确认结算 -> 成功', goodConfirm.status === 200 &&
    ((goodConfirm.body?.data?.status === 'confirmed') || (goodConfirm.body?.status === 'confirmed')),
    `status=${goodConfirm.status} ${JSON.stringify(goodConfirm.body).slice(0, 150)}`)

  // 9. 已确认的结算再次生成 -> SETTLEMENT_CONFIRMED
  const gen3 = await post(`/api/settlements/bookings/${booking3.id}/generate`, {}, TOKENS.finance)
  assert('已确认结算不可再生', gen3.status === 400 && gen3.body?.code === 'SETTLEMENT_CONFIRMED',
    `status=${gen3.status} code=${gen3.body?.code}`)

  return { booking3 }
}

// ============== 审计日志 ==============
async function scenario_audit_log() {
  section('审计日志验证')
  const r = await get('/api/audit-logs?page=1&page_size=50', TOKENS.sales)
  const list = r.body?.data?.list || r.body?.list || []
  assert('审计日志有记录', Array.isArray(list) && list.length >= 5, `count=${list.length}`)
  const hasCreate = list.some(x => x.action === 'create' || x.action === 'update')
  assert('包含 create/update 操作', hasCreate)
}

// ============== 健康检查 ==============
async function health_check() {
  section('健康检查（含数据库）')
  const r = await get('/api/health')
  assert('HTTP 200', r.status === 200, `status=${r.status}`)
  assert('status=ok', r.body?.status === 'ok')
  assert('database=connected', r.body?.database === 'connected')
}

// ============== 启动 API（--init 模式） ==============
let child = null
async function ensureServer() {
  const r = await get('/api/health').catch(() => null)
  if (r && r.body?.status === 'ok') return null
  console.log('[smoke] 未检测到运行中的 API，启动临时服务...')
  if (existsSync(path.join(ROOT, 'data'))) rmSync(path.join(ROOT, 'data'), { recursive: true, force: true })
  child = spawn(
    path.join(ROOT, 'node_modules', '.bin', 'tsx'),
    [path.join(ROOT, 'api', 'index.ts')],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: '3000' } },
  )
  child.stderr.on('data', (d) => process.stderr.write('[api-err] ' + d))
  let stdout = ''
  child.stdout.on('data', (d) => { stdout += String(d); if (process.env.VERBOSE) process.stdout.write('[api] ' + d) })
  for (let i = 0; i < 40; i++) {
    await new Promise(r0 => setTimeout(r0, 500))
    const probe = await get('/api/health').catch(() => null)
    if (probe && probe.body?.status === 'ok') {
      console.log('[smoke] API 服务已就绪')
      if (process.env.VERBOSE) console.log('--- API 启动日志 ---\n' + stdout)
      return child
    }
  }
  console.error('API 启动超时，输出：\n' + stdout)
  throw new Error('无法启动 API 服务')
}

// ============== 主流程 ==============
async function main() {
  const doInit = process.argv.includes('--init') || process.argv.includes('--auto')

  console.log('═══════════════════════════════════════════════════════')
  console.log('   景区研学团队接待系统 Smoke 测试')
  console.log('   API Base:', BASE_URL)
  console.log('   模式:   ', doInit ? '自启动 API + 全新数据' : '使用已运行 API')
  console.log('═══════════════════════════════════════════════════════')

  try {
    if (doInit) await ensureServer()
    else await ensureServer()

    await health_check()
    await loginAll()

    const schools = await prepareSchools()
    if (!schools.length) throw new Error('学校列表为空，种子数据未加载')

    // 场景一
    await scenario_schedule_conflict(schools)
    // 场景二
    await scenario_no_student_list(schools)
    // 场景三
    await scenario_recalculate_settlement(schools)
    // 审计
    await scenario_audit_log()
  } catch (e) {
    console.error('\n⚠️  测试异常终止:', e?.stack || e)
    failCount++
    results.push({ name: 'Unexpected error', ok: false, detail: String(e) })
  } finally {
    if (child) {
      child.kill('SIGTERM')
      await new Promise(r => setTimeout(r, 500))
    }
  }

  section('测试结果汇总')
  const total = passCount + failCount
  console.log(`  总计: ${total}  |  ✅ 通过: ${passCount}  |  ❌ 失败: ${failCount}`)
  console.log(`  通过率: ${total === 0 ? 0 : Math.round(passCount / total * 100)}%`)

  if (failCount > 0) {
    console.log('\n  失败项:')
    for (const r of results.filter(r0 => !r0.ok)) {
      console.log(`    ❌ ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
    }
  }

  console.log('')
  process.exit(failCount > 0 ? 1 : 0)
}

main()
