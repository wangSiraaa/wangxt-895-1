<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Filter, RefreshCw } from 'lucide-vue-next'
import DataTable from '@/components/DataTable.vue'
import type { Column } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { useToast } from '@/composables/useToast'
import type { BookingDetail } from '../../../shared/types'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const loading = ref(false)
const list = ref<BookingDetail[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

const columns: Column[] = [
  { key: 'id', label: '预约单号', width: '200px' },
  { key: 'school_name', label: '学校/单位', width: '200px' },
  {
    key: 'expected_student_count',
    label: '学生人数',
    width: '100px',
    render: (row: BookingDetail) =>
      h('span', `${row.expected_student_count}人`),
  },
  {
    key: 'expected_teacher_count',
    label: '老师人数',
    width: '100px',
    render: (row: BookingDetail) =>
      h('span', `${row.expected_teacher_count}人`),
  },
  { key: 'visit_date', label: '到访日期', width: '120px' },
  {
    key: 'status',
    label: '业务状态',
    width: '120px',
    render: (row: BookingDetail) => h(StatusBadge, { status: row.status }),
  },
  {
    key: 'audit_status',
    label: '审核状态',
    width: '120px',
    render: (row: BookingDetail) =>
      h(StatusBadge, { status: row.audit_status, type: 'audit' }),
  },
  { key: 'created_by_name', label: '负责销售' },
  {
    key: 'action',
    label: '操作',
    width: '100px',
    render: (row: BookingDetail) =>
      h(
        'button',
        {
          class:
            'text-teal-600 hover:text-teal-800 text-sm font-medium',
          onClick: () => router.push(`/app/bookings/${row.id}`),
        },
        '查看详情',
      ),
  },
]

async function loadList() {
  loading.value = true
  try {
    const res = (await api.get('/bookings', {
      params: {
        page: page.value,
        page_size: pageSize.value,
      },
    })) as { list: BookingDetail[]; total: number }
    list.value = res.list
    total.value = res.total
  } catch (err) {
    showToast('加载预约列表失败', 'error')
    console.error(err)
  } finally {
    loading.value = false
  }
}

function createNew() {
  router.push('/app/bookings/new')
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">预约管理</h1>
        <p class="text-sm text-slate-500 mt-1">
          共 {{ total }} 条预约记录
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="loadList"
          :disabled="loading"
          class="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw
            class="w-4 h-4"
            :class="{ 'animate-spin': loading }"
          />
          刷新
        </button>
        <button
          v-if="authStore.isSales || authStore.isDispatcher"
          @click="createNew"
          class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus class="w-4 h-4" />
          新建预约
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-64">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索单号、学校名称..."
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            @keyup.enter="loadList"
          />
        </div>
        <button
          class="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
        >
          <Filter class="w-4 h-4" />
          筛选
        </button>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="list"
      :loading="loading"
      empty-text="暂无预约记录"
    />
  </div>
</template>
