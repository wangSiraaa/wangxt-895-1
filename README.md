# 景区研学团队接待全栈 Web 应用

基于 Vue 3 + TypeScript + Express + SQLite (better-sqlite3) 构建的可端到端验收系统。
覆盖 5 类角色 / 10 张业务表 / 8 步主流程 / 6 条硬性业务约束。

---

## 一、快速启动

### 1. 环境要求
- Node.js **>= 20**（推荐 22 LTS；已在 Node 26 验证通过）
- macOS / Linux（Windows 需 WSL）
- Python 3（若需本地编译 better-sqlite3；通常预编译二进制够用）
- 包管理器：**pnpm**（`npm i -g pnpm`）

### 2. 安装依赖
```bash
cd <项目根目录>
pnpm install

# 若 better-sqlite3 报 bindings 缺失（Node 非 LTS 常见），手动触发预编译：
cd node_modules/better-sqlite3 && npm run install
```

### 3. 启动（3 种方式）

| 命令 | 作用 |
|------|------|
| `pnpm run dev` | 同时启动前后端（前端 5173 + 后端 3000，含热更新） |
| `pnpm run server:dev` | 仅启动后端（端口 3000，nodemon 热更） |
| `pnpm run client:dev` | 仅启动前端（端口 5173，Vite 代理 `/api` → 3000） |

### 4. 端到端验证 (Smoke)
```bash
# 方式 A：脚本自启动 API 进程并清理数据库（推荐，最完整）
node scripts/smoke.mjs --auto

# 方式 B：使用已在 3000 端口运行的后端（不会重置数据库）
node scripts/smoke.mjs
```

### 5. 健康检查
```bash
curl http://localhost:3000/api/health
# → {"status":"ok","database":"connected","timestamp":...}
```

---

## 二、预置账号（全部密码 `123456`）

| username | real_name | role | 主要权限 |
|----------|-----------|------|----------|
| `sales` | 研学销售 | sales | 创建 / 编辑预约、上传名单、确认风险告知 |
| `dispatcher` | 接待调度 | dispatcher | 讲解排班、取消排班、调度管理 |
| `guide1` / `guide2` | 讲解员张/李老师 | guide | 签到、完成接待、查看自己的排班 |
| `catering` | 餐饮管理员 | catering_admin | 设置餐标、确认餐饮 |
| `finance` | 财务结算 | finance | 生成结算、确认结算（仅此角色可确认） |

**登录页（前端）** 提供 5 个一键登录按钮，便于验收演示。

---

## 三、样例数据（种子）

首次启动会自动初始化（位于 `api/db/seed.ts`）：

| 资源 | 样例 |
|------|------|
| 学校 | 第一实验小学、阳光中学、育才小学 |
| 讲解时段 | 上午场 08:30-11:30、下午场 13:00-16:00、晚间场 18:00-20:30（每场容量 80-100 人） |
| 数据库文件 | `data/app.db`（SQLite WAL 模式；删除此目录即可重置） |

---

## 四、主流程与核心业务规则

```
预约创建(sales) → 名单上传(sales) → 讲解排班(dispatcher) → 餐饮确认(catering)
    → 风险告知(sales) → 到场签到(guide) → 接待完成(guide)
    → 结算生成(finance) → 结算确认(finance)
         ↓ 异常情况 ↓
      取消排班/取消预约 → 释放讲解员时段并写入审计日志
```

### ✅ 六大硬性约束（100% 落地 + 测试覆盖）

| 编号 | 约束 | 校验点 | 错误码 |
|------|------|--------|--------|
| R1 | **同一讲解员不可重叠排班** | 事务内 SQL 检测 `new_start < exist_end AND new_end > exist_start` | `SCHEDULE_CONFLICT` (409) |
| R2 | **未上传名单不可排班/接待** | `booking.status !== 'draft'` 前置拦截 | `NO_STUDENT_LIST` (400) |
| R3 | **学生人数变化 → 餐饮 + 结算自动重算** | `updateStudentList()` 级联调用 `catering.recalculate()` + `settlement.recalculate()` | — |
| R4 | **取消已确认接待 → 释放讲解员时段 + 保留审计** | `cancelSchedule()` 删除排班 + 写 `audit_logs` (before/after JSON) | — |
| R5 | **未完成风险告知不可签到** | `checkin()` 前置检查 `risk_notices` 存在性 | `RISK_NOT_CONFIRMED` (400) |
| R6 | **非财务角色不可确认结算** | 路由层 `requireRole('finance','admin')` 中间件 + 服务层防御判断 | `FORBIDDEN` (403) / `PERMISSION_DENIED` |

### 🔁 并发 & 重复提交

- 排班创建全包裹在 `db.transaction()` 中，数据库行锁避免同讲解员并发抢同一时段。
- 精确重复提交（完全相同的 `guide_id + start_time + end_time`）返回 `DUPLICATE_SUBMIT`。
- 所有写操作返回**稳定业务错误码**（见 `api/errors/AppError.ts` 的 `ERROR_CODES`）。

---

## 五、API 一览（Base: `/api`）

| 方法 | 路径 | 角色 | 作用 |
|------|------|------|------|
| POST | `/auth/login` | 公开 | 登录获取 JWT |
| GET/POST | `/bookings` / `/bookings/:id` | sales+ | 预约 CRUD |
| POST | `/bookings/:id/cancel` | sales+ | 取消预约 |
| GET/POST | `/bookings/:id/students` | sales | 获取 / 上传学生&老师名单 |
| GET/POST/DELETE | `/schedules`，`/schedules/:id` | dispatcher | 查询 / 排班 / 取消排班 |
| GET/PUT | `/catering/bookings/:id` | catering+ | 餐饮配置 & 确认 |
| POST | `/catering/bookings/:id/confirm` | catering+ | 餐饮确认 |
| POST | `/checkin/bookings/:id/risk` | sales | 风险告知签署 |
| POST | `/checkin/bookings/:id/checkin` | guide | 到场签到（人数变化触发重算） |
| POST | `/checkin/bookings/:id/complete` | guide | 接待完成 |
| GET/POST | `/settlements`，`/settlements/:id` | finance+ | 结算查询 / 详情 |
| POST | `/settlements/bookings/:id/generate` | finance+ | 生成或重算结算 |
| POST | `/settlements/:id/confirm` | **finance** | **确认结算（仅此角色）** |
| GET | `/audit-logs?page=&page_size=` | 所有登录 | 操作审计日志 |
| GET/POST | `/schools` | sales+ | 学校档案 |
| GET | `/health` | 公开 | **连数据库**健康检查 |

### 结算公式（`settlement.service.ts`）
```
讲解费 = 排班数 × 500
门票费 = 学生数 × 80 + 老师数 × 60
餐饮费 = 学生 × 餐标 × 餐次 + 老师 × (餐标 × 1.5) × 餐次
合计  = 讲解费 + 门票费 + 餐饮费
明细写入 details_json 便于追溯
```

---

## 六、前端说明

- **技术栈**：Vue 3.4.38 (`<script setup>`) + TypeScript + Pinia + Vue Router 4 + Tailwind CSS 3 + lucide-vue-next
- **路由守卫**：`meta.roles` + JWT 中间件，未登录跳 `/login`，无权限跳 `/403`
- **页面结构**：`MainLayout.vue` 左侧深色导航（teal-700 主色）+ 顶栏用户菜单 + `<router-view />`
- **业务页面**：Dashboard、预约列表/编辑/详情、排班列表、餐饮列表、签到列表、结算列表、审计日志
- **API 调用**：`src/lib/api.ts` (axios) 请求拦截注入 `Authorization: Bearer`、响应拦截 401 跳登录 / 统一 Toast

启动后访问 http://localhost:5173 ，在登录页点击"研学销售"按钮（预置账号）即可进入系统。

---

## 七、Smoke 测试详细场景（41 个断言 100% 通过）

脚本 `scripts/smoke.mjs` 覆盖了用户明确要求的 3 个场景 + 派生约束：

### 场景 1：讲解员重叠时段排班失败（SCHEDULE_CONFLICT）
```
① sales 创建预约 → ② 上传 50 学/5 师名单
③ dispatcher 给 guide1 排 10:00-12:00 → 成功
④ 再排 guide1 11:00-13:00（重叠）→ 409 SCHEDULE_CONFLICT ✅
⑤ 完全重复提交 10:00-12:00 → 409 DUPLICATE_SUBMIT ✅
⑥ guide2 排 10:00-12:00（不同讲解员）→ 成功 ✅
⑦ guide1 排 14:00-16:00（不重叠）→ 成功 ✅
```

### 场景 2：未上传名单排班失败 & 未告知风险签到失败
```
① sales 创建预约（不上名单）
② dispatcher 排班 → 400 NO_STUDENT_LIST ✅
③ 上传名单后再排 → 成功 ✅
④ guide1 直接签到 → 400 RISK_NOT_CONFIRMED ✅
⑤ sales 确认风险告知后签到 → 成功 ✅
```

### 场景 3：学生人数变化后结算金额重新计算
```
① 创建预约 → 上传 40 学/4 师 → 排 1 班 → 设餐标 50
② finance 生成结算：讲解 500 + 餐饮 2300 + 门票 3440 = 6240 ✅
③ sales 重传名单为 60 学/6 师 → 级联重算
④ finance 再次生成：餐饮 3450 + 门票 5160 + 讲解 500 = 9110 ✅
     → (60×50 + 6×75 = 3450) 餐饮正确 ✅
     → (60×80 + 6×60 = 5160) 门票正确 ✅
     → 9110 > 6240 总额变大 ✅
⑤ sales 尝试确认结算 → 403 PERMISSION_DENIED ✅
⑥ finance 确认结算 → 成功 ✅
⑦ 尝试再次生成 → 400 SETTLEMENT_CONFIRMED ✅
```

附加：审计日志非空、包含 create/update 动作 ✅

---

## 八、目录结构

```
├── api/                          # 后端 (Express + TS + ESM)
│   ├── app.ts                    # 全局中间件、路由挂载、错误处理、/health
│   ├── index.ts                  # 启动入口（初始化 DB + 种子 + 优雅关闭）
│   ├── db/
│   │   ├── database.ts           # better-sqlite3 连接、10 张表 DDL、事务包装
│   │   └── seed.ts               # 6 用户 / 3 学校 / 3 时段
│   ├── errors/AppError.ts        # 自定义错误类 + 9 种错误码
│   ├── middleware/auth.ts        # JWT authenticate + requireRole 工厂
│   ├── services/                 # 业务逻辑（audit / booking / student / schedule /
│   │                             #   catering / checkin / settlement）
│   └── routes/                   # 9 组路由（auth + 8 业务）
├── src/                          # 前端 (Vue 3 + TS)
│   ├── layouts/MainLayout.vue    # 带角色化菜单的主框架
│   ├── router/index.ts           # 12 条路由 + meta.roles 守卫
│   ├── stores/auth.ts            # Pinia 用户态
│   ├── lib/api.ts                # axios 实例 & 拦截器
│   ├── pages/                    # 11 个业务页面
│   └── components/               # DataTable / StatusBadge / AppToast
├── shared/types.ts               # 前后端共享类型（Role、BookingStatus、接口、错误码）
├── scripts/smoke.mjs             # 端到端验收脚本（--auto 自启动 API）
├── data/app.db                   # SQLite 数据库（首次启动生成）
├── .env                          # JWT_SECRET 等配置（模板已提供）
├── vite.config.ts                # /api 代理、端口 5173
├── nodemon.json                  # 后端热更配置
├── tailwind.config.js            # teal 主色 + 5 种角色色卡
└── package.json / tsconfig.json
```

---

## 九、排错线索 (Troubleshooting)

### ❌ `Error: Could not locate the bindings file` (better-sqlite3)
```bash
# 原因：Node 非 LTS (如 v26) 预编译二进制缺失 / pnpm 默认禁用了 build scripts
# 解决：手动触发 native 编译
cd node_modules/better-sqlite3
npm run install   # 会调用 prebuild-install 或 node-gyp rebuild
```
若编译失败（需要 python3 + make + clang），可：
- 降级 Node 到 v22 LTS，或
- 临时替换驱动为 `sql.js`（纯 WASM 版，需改 `api/db/database.ts`）

### ❌ `EADDRINUSE: address already in use :::3000`
```bash
lsof -ti:3000 | xargs kill -9
# 或 lsof -ti:5173 | xargs kill -9（前端端口占用）
```

### ❌ 前端登录后 401 持续跳登录
1. 检查 `localStorage.getItem('token')` 是否存在
2. Network 面板确认请求头含 `Authorization: Bearer <token>`
3. JWT 默认 24h 过期，重启后端（新 JWT_SECRET）会使旧 Token 失效 → 重新登录

### ❌ API 返回 403 / `FORBIDDEN`
对照 **角色权限矩阵**（第三节 + 路由 `requireRole(...)`）：
- 排班：仅 `dispatcher` / `admin`
- 确认结算：**仅** `finance` / `admin`
- 签到：仅 `guide` / `dispatcher` / `admin`
- 餐饮设置：仅 `catering_admin` / `dispatcher` / `admin`

### ❌ Smoke 测试中某项失败
- 先 `rm -rf data` 清空数据库后再跑 `node scripts/smoke.mjs --auto`
- 加 `VERBOSE=1 node scripts/smoke.mjs --auto` 可打印 API 启动日志
- 失败项会在末尾汇总为「失败项」清单，附带 HTTP status / code / body

### ❌ 前端页面 404（Vite 刷新时）
开发模式 Vite 已配置 history fallback；生产部署时需要为 Nginx 配置 `try_files $uri /index.html`。

### ❌ 数据库表不存在
删除 `data/` 目录后重启后端即可触发重新建表 + 播种。
若种子用户已存在（启动日志显示「数据库已初始化，跳过种子数据」）但仍需重置：
```bash
rm -rf data && pnpm run server:dev
```

---

## 十、进一步验收建议

1. 打开 http://localhost:5173 → 分别用 5 个账号登录，观察左侧菜单差异（权限生效）
2. 浏览器 DevTools → Network 观察每个操作的 HTTP / 业务错误码
3. `sqlite3 data/app.db` 手动查询：
   - `.tables` 列出 10 张表
   - `SELECT * FROM schedules ORDER BY start_time;` 观察排班
   - `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;` 观察审计链
4. 故意制造冲突：dispatcher 同时开两个浏览器标签为同讲解员排同时段 → 第二个标签必返回 `SCHEDULE_CONFLICT`
