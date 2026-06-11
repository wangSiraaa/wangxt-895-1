import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import BookingList from '@/pages/BookingList.vue'
import BookingEdit from '@/pages/BookingEdit.vue'
import BookingDetail from '@/pages/BookingDetail.vue'
import ScheduleList from '@/pages/ScheduleList.vue'
import CateringList from '@/pages/CateringList.vue'
import CheckinList from '@/pages/CheckinList.vue'
import SettlementList from '@/pages/SettlementList.vue'
import AuditLogList from '@/pages/AuditLogList.vue'
import NotFound from '@/pages/NotFound.vue'
import { useAuthStore, type UserRole } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

type RouteMeta = {
  title?: string
  roles?: UserRole[]
  public?: boolean
}

declare module 'vue-router' {
  interface RouteMeta extends RouteMeta {}
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘' },
      },
      {
        path: 'bookings',
        name: 'BookingList',
        component: BookingList,
        meta: { title: '预约管理', roles: ['sales', 'dispatcher', 'finance'] },
      },
      {
        path: 'bookings/new',
        name: 'BookingNew',
        component: BookingEdit,
        meta: { title: '新建预约', roles: ['sales', 'dispatcher'] },
      },
      {
        path: 'bookings/:id',
        name: 'BookingDetail',
        component: BookingDetail,
        meta: { title: '预约详情' },
      },
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: ScheduleList,
        meta: { title: '排班管理', roles: ['dispatcher', 'guide'] },
      },
      {
        path: 'catering',
        name: 'CateringList',
        component: CateringList,
        meta: { title: '餐饮管理', roles: ['catering_admin', 'dispatcher'] },
      },
      {
        path: 'checkin',
        name: 'CheckinList',
        component: CheckinList,
        meta: { title: '签到接待', roles: ['guide', 'dispatcher'] },
      },
      {
        path: 'settlements',
        name: 'SettlementList',
        component: SettlementList,
        meta: { title: '结算管理', roles: ['finance'] },
      },
      {
        path: 'audit',
        name: 'AuditLogList',
        component: AuditLogList,
        meta: { title: '审计日志' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '404 页面不存在', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const { showToast } = useToast()

  if (to.meta.title) {
    document.title = `${to.meta.title} - 研学接待管理系统`
  } else {
    document.title = '研学接待管理系统'
  }

  if (to.meta.public) {
    if (to.path === '/login' && authStore.isLoggedIn) {
      return next('/dashboard')
    }
    return next()
  }

  if (!authStore.isLoggedIn) {
    showToast('请先登录系统', 'warning')
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = authStore.user?.role
    if (!userRole || !to.meta.roles.includes(userRole)) {
      showToast('您没有访问该页面的权限', 'error')
      return next('/dashboard')
    }
  }

  next()
})

export default router
