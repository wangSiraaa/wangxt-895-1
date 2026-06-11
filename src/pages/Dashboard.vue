<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  ClipboardList,
  CalendarClock,
  Wallet,
  ChevronRight,
  AlertCircle,
  Bell,
  ClipboardCheck,
  CalendarDays,
  UtensilsCrossed,
  UserCheck,
  Receipt,
  Sparkles,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

interface StatCard {
  label: string
  value: string
  sub: string
  icon: any
  bg: string
  iconBg: string
  path?: string
}

const stats: StatCard[] = [
  {
    label: '今日到访',
    value: '3',
    sub: '共 186 人',
    icon: Users,
    bg: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-400/30',
  },
  {
    label: '待签到',
    value: '2',
    sub: '下午 14:00 开始',
    icon: ClipboardCheck,
    bg: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-400/30',
    path: '/app/checkin',
  },
  {
    label: '待排班',
    value: '5',
    sub: '需本周内完成',
    icon: CalendarClock,
    bg: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-400/30',
    path: '/app/schedules',
  },
  {
    label: '本月结算',
    value: '¥ 48,600',
    sub: '8 笔待审核',
    icon: Wallet,
    bg: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-400/30',
    path: '/app/settlements',
  },
]

interface TodoItem {
  title: string
  desc: string
  time: string
  tag: string
  type: 'info' | 'warning' | 'success'
}

const commonTodos: TodoItem[] = [
  { title: '明日"科技创新营"团队签到准备', desc: '1号车 · 45人 · 市一中', time: '08:30 集合', tag: '签到', type: 'info' },
  { title: '"文化探索"团队名单已上传待排班', desc: '订单号 BK20240128003', time: '请今日完成', tag: '排班', type: 'warning' },
]

const roleTodosMap: Record<string, TodoItem[]> = {
  sales: [
    { title: '市二中研学意向跟进', desc: '预计 2/15 成行 · 120人', time: '3天前', tag: '跟进', type: 'warning' },
    { title: '确认合同盖章回传', desc: '少年宫 · 3月春季研学', time: '今天', tag: '合同', type: 'info' },
    ...commonTodos,
  ],
  dispatcher: [
    { title: '新订单待分配讲解员', desc: 'BK20240128005 · 自然探索', time: '紧急', tag: '排班', type: 'warning' },
    { title: '今日3场行程确认', desc: '与各点位负责人对接', time: '09:00前', tag: '确认', type: 'info' },
    ...commonTodos,
  ],
  guide: [
    { title: '02-03 上午场讲解准备', desc: 'A 线路 · 历史文化主题', time: '明天 09:00', tag: '准备', type: 'info' },
    { title: '前日讲解记录待提交', desc: '安全告知签字确认', time: '尽快', tag: '记录', type: 'warning' },
  ],
  catering_admin: [
    { title: '今日午餐确认', desc: '3团 · 186人 · 2桌备用', time: '10:00 截止', tag: '餐饮', type: 'warning' },
    { title: '下周菜单更新', desc: '提交春季新菜单审核', time: '本周五', tag: '菜单', type: 'info' },
  ],
  finance: [
    { title: '8笔结算单待审核', desc: '合计 ¥48,600', time: '优先处理', tag: '结算', type: 'warning' },
    { title: '2月对账单生成', desc: '导出 Excel 存档', time: '月底前', tag: '对账', type: 'info' },
    ...commonTodos,
  ],
}

const todoList = computed(() => {
  const role = authStore.user?.role || 'dispatcher'
  return roleTodosMap[role] || commonTodos
})

interface QuickAction {
  label: string
  icon: any
  path: string
  roles: string[]
  color: string
}

const quickActions: QuickAction[] = [
  { label: '新建预约', icon: ClipboardList, path: '/app/bookings/new', roles: ['sales', 'dispatcher'], color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200' },
  { label: '排班管理', icon: CalendarDays, path: '/app/schedules', roles: ['dispatcher', 'guide'], color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: '餐饮确认', icon: UtensilsCrossed, path: '/app/catering', roles: ['catering_admin', 'dispatcher'], color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' },
  { label: '签到接待', icon: UserCheck, path: '/app/checkin', roles: ['guide', 'dispatcher'], color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
  { label: '结算审核', icon: Receipt, path: '/app/settlements', roles: ['finance'], color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' },
]

const visibleActions = computed(() => {
  const role = authStore.user?.role
  if (!role) return quickActions.slice(0, 2)
  return quickActions.filter(a => a.roles.includes(role))
})

function goTo(path: string | undefined) {
  if (path) router.push(path)
}

const tagColorMap: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          {{ authStore.isGuide ? '我的工作台' : '运营概览' }}
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          欢迎回来，{{ authStore.user?.real_name }} · {{ authStore.roleLabel }}
        </p>
      </div>
      <div class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-50 to-slate-50 rounded-lg border border-teal-100">
        <Sparkles class="w-4 h-4 text-teal-600" />
        <span class="text-xs text-teal-700 font-medium">今日运行正常</span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        @click="goTo(stat.path)"
        class="relative overflow-hidden rounded-xl p-5 text-white cursor-pointer shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
        :class="`bg-gradient-to-br ${stat.bg}`"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-white/80 text-sm font-medium">{{ stat.label }}</p>
            <p class="text-3xl font-bold mt-2 tracking-tight">{{ stat.value }}</p>
            <p class="text-white/70 text-xs mt-1">{{ stat.sub }}</p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center"
            :class="stat.iconBg"
          >
            <component :is="stat.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <Bell class="w-5 h-5 text-teal-600" />
            <h2 class="text-lg font-semibold text-slate-800">待办事项</h2>
          </div>
          <span class="text-xs text-slate-400">{{ todoList.length }} 条待处理</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="(todo, idx) in todoList"
            :key="idx"
            class="group flex items-start gap-3 p-3.5 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-colors cursor-pointer"
          >
            <AlertCircle
              class="w-5 h-5 mt-0.5 flex-shrink-0"
              :class="todo.type === 'warning' ? 'text-amber-500' : 'text-slate-400 group-hover:text-teal-500'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-medium text-slate-800 text-sm">{{ todo.title }}</p>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="tagColorMap[todo.type]"
                >
                  {{ todo.tag }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ todo.desc }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-xs text-slate-500">{{ todo.time }}</p>
              <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-teal-500 ml-auto mt-1 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <ChevronRight class="w-5 h-5 text-teal-600" />
          快捷入口
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="action in visibleActions"
            :key="action.label"
            @click="goTo(action.path)"
            class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-sm"
            :class="action.color"
          >
            <component :is="action.icon" class="w-6 h-6" />
            <span class="text-sm font-medium">{{ action.label }}</span>
          </button>
        </div>

        <div class="mt-6 p-4 bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-xl border border-slate-100">
          <h3 class="text-sm font-semibold text-slate-700 mb-2">温馨提示</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            请在接待前 24 小时完成所有行程确认，确保各环节衔接顺畅。
            遇到紧急情况请第一时间联系调度中心。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
