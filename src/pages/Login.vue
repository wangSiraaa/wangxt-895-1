<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Building2, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import { useAuthStore, type UserRole } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

interface QuickLogin {
  username: string
  password: string
  label: string
  role: UserRole
  desc: string
}

const quickLogins: QuickLogin[] = [
  { username: 'sales', password: '123456', label: '研学销售', role: 'sales', desc: '预约录入、名单上传' },
  { username: 'dispatcher', password: '123456', label: '接待调度', role: 'dispatcher', desc: '排班调度、全流程管理' },
  { username: 'guide1', password: '123456', label: '讲解员一', role: 'guide', desc: '查看排班、签到接待' },
  { username: 'catering', password: '123456', label: '餐饮管理员', role: 'catering_admin', desc: '餐饮安排确认' },
  { username: 'finance', password: '123456', label: '财务结算', role: 'finance', desc: '结算审核、财务对账' },
]

function fillAccount(item: QuickLogin) {
  username.value = item.username
  password.value = item.password
}

async function handleLogin() {
  if (!username.value.trim()) {
    showToast('请输入账号', 'warning')
    return
  }
  if (!password.value) {
    showToast('请输入密码', 'warning')
    return
  }

  loading.value = true
  try {
    await authStore.login(username.value.trim(), password.value)
    showToast('登录成功', 'success')
    router.push('/app/dashboard')
  } catch (err: any) {
    showToast(err?.message || '登录失败，请检查账号密码', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div class="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-10 text-center">
          <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Building2 class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">景区研学团队接待系统</h1>
          <p class="text-teal-100 text-sm mt-2">高效协同 · 精细化管理</p>
        </div>

        <div class="p-8 space-y-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
              <input
                v-model="username"
                type="text"
                placeholder="请输入账号"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                @keyup.enter="handleLogin"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  class="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="loading">登录中...</span>
            <template v-else>
              <span>登录系统</span>
              <ArrowRight class="w-4 h-4" />
            </template>
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-3 bg-white text-slate-400">快捷登录（演示账号）</span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="item in quickLogins"
              :key="item.username"
              @click="fillAccount(item)"
              class="group flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg text-left transition-all"
            >
              <div>
                <div class="text-sm font-medium text-slate-800 group-hover:text-teal-700">{{ item.label }}</div>
                <div class="text-xs text-slate-500">{{ item.desc }}（{{ item.username }} / {{ item.password }}）</div>
              </div>
              <ArrowRight class="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-slate-400 mt-6">
        <router-link to="/" class="hover:text-teal-600 inline-flex items-center gap-1">
          <ArrowLeft class="w-3 h-3" /> 返回结果公示
        </router-link>
        <span class="mx-2">·</span>
        © 2024 研学接待管理系统 · 演示版本
      </p>
    </div>
  </div>
</template>
