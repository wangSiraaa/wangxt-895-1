<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  CalendarCheck,
  UtensilsCrossed,
  ClipboardList,
  UserCheck,
  Receipt,
  FileText,
  LogOut,
  Search,
  Building2,
} from 'lucide-vue-next'
import { useAuthStore, type UserRole } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

interface MenuItem {
  path: string
  label: string
  icon: any
  roles?: UserRole[]
}

const allMenus: MenuItem[] = [
  { path: '/app/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/app/bookings', label: '预约管理', icon: ClipboardList, roles: ['sales', 'dispatcher', 'finance'] },
  { path: '/app/schedules', label: '排班管理', icon: CalendarCheck, roles: ['dispatcher', 'guide'] },
  { path: '/app/catering', label: '餐饮管理', icon: UtensilsCrossed, roles: ['catering_admin', 'dispatcher'] },
  { path: '/app/checkin', label: '签到接待', icon: UserCheck, roles: ['guide', 'dispatcher'] },
  { path: '/app/settlements', label: '结算管理', icon: Receipt, roles: ['finance'] },
  { path: '/app/audit', label: '审计日志', icon: FileText },
]

const visibleMenus = computed(() => {
  const userRole = authStore.user?.role
  if (!userRole) return allMenus.filter(m => !m.roles)
  return allMenus.filter(m => !m.roles || m.roles.includes(userRole))
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50">
    <aside class="w-60 bg-teal-700 text-white flex flex-col flex-shrink-0">
      <div class="h-16 flex items-center px-5 border-b border-teal-600/50">
        <Building2 class="w-7 h-7 mr-3 flex-shrink-0" />
        <span class="text-base font-bold tracking-wide leading-tight">研学接待管理系统</span>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="menu in visibleMenus"
          :key="menu.path"
          :to="menu.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="isActive(menu.path)
            ? 'bg-teal-600 text-white shadow-inner'
            : 'text-teal-50 hover:bg-teal-600/60'"
        >
          <component :is="menu.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ menu.label }}</span>
        </router-link>
      </nav>

      <div class="p-3 border-t border-teal-600/50 text-xs text-teal-100/70 text-center">
        v1.0.0
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-40">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索功能..."
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors"
          />
        </div>

        <div class="flex items-center gap-3 ml-auto">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div class="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium">
              {{ authStore.user?.real_name?.charAt(0) || 'U' }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-slate-800">{{ authStore.user?.real_name }}</span>
              <span class="text-xs text-slate-500">{{ authStore.roleLabel }}</span>
            </div>
          </div>

          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">退出</span>
          </button>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
