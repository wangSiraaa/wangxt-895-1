import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

export type UserRole = 'sales' | 'dispatcher' | 'guide' | 'catering_admin' | 'finance'

export interface User {
  id: string
  username: string
  real_name: string
  role: UserRole
}

export const roleLabelMap: Record<UserRole, string> = {
  sales: '研学销售',
  dispatcher: '接待调度',
  guide: '讲解员',
  catering_admin: '餐饮管理员',
  finance: '财务结算',
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  try {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser) as User
    }
  } catch {
    user.value = null
  }

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const roleLabel = computed(() => {
    if (!user.value?.role) return ''
    return roleLabelMap[user.value.role] || user.value.role
  })

  const isSales = computed(() => user.value?.role === 'sales')
  const isDispatcher = computed(() => user.value?.role === 'dispatcher')
  const isGuide = computed(() => user.value?.role === 'guide')
  const isCatering = computed(() => user.value?.role === 'catering_admin')
  const isFinance = computed(() => user.value?.role === 'finance')

  async function login(username: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchMe() {
    try {
      const data = await api.get<User>('/auth/me')
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch {
      logout()
      throw new Error('获取用户信息失败')
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    roleLabelMap,
    roleLabel,
    isSales,
    isDispatcher,
    isGuide,
    isCatering,
    isFinance,
    login,
    logout,
    fetchMe,
  }
})
