<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, RefreshCw, Users, Calendar, FileText, LogIn } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import api from '@/lib/api'
import { useToast } from '@/composables/useToast'
import type { BookingDetail } from '../../shared/types'

const { showToast } = useToast()

const loading = ref(false)
const list = ref<BookingDetail[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateFrom = ref('')
const dateTo = ref('')

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (dateFrom.value) params.visit_date_from = dateFrom.value
    if (dateTo.value) params.visit_date_to = dateTo.value
    const res = (await api.get('/public/results', { params })) as {
      list: BookingDetail[]
      total: number
    }
    list.value = res.list
    total.value = res.total
  } catch (err) {
    showToast('加载公示结果失败', 'error')
    console.error(err)
  } finally {
    loading.value = false
  }
}

const approvedCount = computed(() =>
  list.value.filter((b) => b.audit_status === 'approved').length,
)
const rejectedCount = computed(() =>
  list.value.filter((b) => b.audit_status === 'rejected').length,
)

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
    <header class="bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-5">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText class="w-6 h-6 text-teal-600" />
              研学团队预约结果公示
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              景区研学团队接待预约审核结果公开查询
            </p>
          </div>
          <div class="flex items-center gap-2">
            <router-link
              to="/login"
              class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <LogIn class="w-4 h-4" />
              登录后台
            </router-link>
            <button
              @click="loadList"
              :disabled="loading"
              class="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw
                class="w-4 h-4"
                :class="{ 'animate-spin': loading }"
              />
              刷新
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <FileText class="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p class="text-sm text-slate-500">公示总数</p>
              <p class="text-2xl font-bold text-slate-800">{{ total }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-slate-500">审核通过</p>
              <p class="text-2xl font-bold text-green-600">{{ approvedCount }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Calendar class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-slate-500">审核驳回</p>
              <p class="text-2xl font-bold text-red-600">{{ rejectedCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <span class="text-sm text-slate-600">到访日期</span>
          </div>
          <input
            v-model="dateFrom"
            type="date"
            class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
          <span class="text-slate-400">至</span>
          <input
            v-model="dateTo"
            type="date"
            class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
          <button
            @click="loadList"
            class="flex items-center gap-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Search class="w-4 h-4" />
            查询
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div v-if="loading" class="text-center py-20 text-slate-500">
          加载中...
        </div>
        <div v-else-if="list.length === 0" class="text-center py-20 text-slate-500">
          <FileText class="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>暂无公示记录</p>
        </div>
        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="item in list"
            :key="item.id"
            class="p-5 hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-base font-semibold text-slate-800 truncate">
                    {{ item.school_name }}
                  </h3>
                  <StatusBadge :status="item.audit_status" type="audit" />
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    到访日期：{{ item.visit_date }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Users class="w-3.5 h-3.5 text-slate-400" />
                    学生 {{ item.expected_student_count }} 人 / 老师 {{ item.expected_teacher_count }} 人
                  </span>
                </div>
                <div v-if="item.audit_remark" class="mt-3">
                  <div
                    class="rounded-lg px-4 py-3 text-sm"
                    :class="
                      item.audit_status === 'approved'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    "
                  >
                    <span class="font-medium">
                      {{ item.audit_status === 'approved' ? '通过说明：' : '驳回原因：' }}
                    </span>
                    {{ item.audit_remark }}
                  </div>
                </div>
                <div class="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>预约单号：{{ item.id }}</span>
                  <span v-if="item.audit_by_name">审核人：{{ item.audit_by_name }}</span>
                  <span v-if="item.audit_at">
                    审核时间：{{ new Date(item.audit_at).toLocaleString('zh-CN') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-400">
      <p>景区研学团队接待管理系统 · 结果公示平台</p>
    </footer>
  </div>
</template>
