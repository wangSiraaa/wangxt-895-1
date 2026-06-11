<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Search, Filter } from 'lucide-vue-next'
import DataTable from '@/components/DataTable.vue'
import type { Column } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const data = ref([
  { id: 'BK20240128001', school: '市第一中学', grade: '初二年级', count: 120, date: '2024-02-01', status: 'scheduled', sales: '张三' },
  { id: 'BK20240128002', school: '实验二小', grade: '五年级', count: 85, date: '2024-02-02', status: 'list_uploaded', sales: '张三' },
  { id: 'BK20240128003', school: '少年宫活动中心', grade: '混合', count: 45, date: '2024-02-03', status: 'draft', sales: '李四' },
  { id: 'BK20240127005', school: '育才中学', grade: '高一年级', count: 156, date: '2024-01-31', status: 'completed', sales: '张三' },
  { id: 'BK20240126002', school: '阳光小学', grade: '三年级', count: 68, date: '2024-01-30', status: 'settled', sales: '李四' },
])

const columns: Column[] = [
  { key: 'id', label: '预约单号', width: '160px' },
  { key: 'school', label: '学校/单位', width: '180px' },
  { key: 'grade', label: '年级' },
  { key: 'count', label: '人数', width: '80px' },
  { key: 'date', label: '到访日期', width: '120px' },
  {
    key: 'status',
    label: '状态',
    width: '120px',
    render: (row) => h(StatusBadge, { status: row.status })
  },
  { key: 'sales', label: '负责销售' },
  {
    key: 'action',
    label: '操作',
    width: '100px',
    render: (row) => h('button', {
      class: 'text-teal-600 hover:text-teal-800 text-sm font-medium',
      onClick: () => router.push(`/bookings/${row.id}`)
    }, '查看详情')
  }
]

function createNew() {
  router.push('/bookings/new')
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">预约管理</h1>
        <p class="text-sm text-slate-500 mt-1">管理所有研学团队预约订单</p>
      </div>
      <button
        v-if="authStore.isSales || authStore.isDispatcher"
        @click="createNew"
        class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        新建预约
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索单号、学校名称..."
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <button class="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors">
          <Filter class="w-4 h-4" />
          筛选
        </button>
      </div>
    </div>

    <DataTable :columns="columns" :data="data" />
  </div>
</template>
