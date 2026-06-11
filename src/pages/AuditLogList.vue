<script setup lang="ts">
import { ref } from 'vue'
import { FileText, User, Calendar, Clock } from 'lucide-vue-next'
import DataTable from '@/components/DataTable.vue'
import type { Column } from '@/components/DataTable.vue'
import { h } from 'vue'

const logs = ref([
  { id: 1, time: '2024-01-30 14:32:18', user: '张三', role: '研学销售', action: '创建预约', target: 'BK20240130005', detail: '创建了新预约单（育才中学，120人）' },
  { id: 2, time: '2024-01-30 13:15:42', user: '调度小李', role: '接待调度', action: '分配排班', target: 'BK20240128001', detail: '分配讲解员：李讲解；车辆：2辆50座' },
  { id: 3, time: '2024-01-30 11:08:05', user: '王老师', role: '客户', action: '上传名单', target: 'BK20240128001', detail: '上传学生花名册（120人）' },
  { id: 4, time: '2024-01-30 10:45:22', user: '财务小王', role: '财务结算', action: '审核结算', target: 'ST20240129002', detail: '结算审核通过，金额 ¥46,800' },
  { id: 5, time: '2024-01-30 09:22:10', user: '餐饮管理', role: '餐饮管理员', action: '确认餐饮', target: 'BK20240128001', detail: '确认午餐：12桌套餐A，含3份素食' },
  { id: 6, time: '2024-01-30 08:58:33', user: '李讲解', role: '讲解员', action: '签到完成', target: 'BK20240126010', detail: '团队完成签到：60人全部到场' },
])

const actionColors: Record<string, string> = {
  '创建预约': 'bg-blue-100 text-blue-700',
  '分配排班': 'bg-indigo-100 text-indigo-700',
  '上传名单': 'bg-sky-100 text-sky-700',
  '审核结算': 'bg-emerald-100 text-emerald-700',
  '确认餐饮': 'bg-purple-100 text-purple-700',
  '签到完成': 'bg-teal-100 text-teal-700',
}

const columns: Column[] = [
  {
    key: 'time',
    label: '时间',
    width: '180px',
    render: (row) => h('div', { class: 'flex items-center gap-1.5 text-sm text-slate-600' }, [
      h(Clock, { class: 'w-3.5 h-3.5 text-slate-400' }),
      row.time
    ])
  },
  {
    key: 'user',
    label: '操作人',
    width: '160px',
    render: (row) => h('div', {}, [
      h('div', { class: 'flex items-center gap-1.5 text-sm font-medium text-slate-800' }, [
        h(User, { class: 'w-3.5 h-3.5 text-slate-400' }),
        row.user
      ]),
      h('div', { class: 'text-xs text-slate-400 mt-0.5 ml-5' }, row.role)
    ])
  },
  {
    key: 'action',
    label: '操作类型',
    width: '120px',
    render: (row) => h('span', {
      class: `inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionColors[row.action] || 'bg-slate-100 text-slate-700'}`
    }, row.action)
  },
  {
    key: 'target',
    label: '关联单号',
    width: '150px',
    render: (row) => h('span', { class: 'text-sm font-mono text-teal-600' }, row.target)
  },
  { key: 'detail', label: '操作详情' },
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">审计日志</h1>
        <p class="text-sm text-slate-500 mt-1">系统所有操作记录</p>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
        <Calendar class="w-4 h-4 text-slate-500" />
        <span class="text-sm text-slate-600">今日</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
        <div class="flex items-center gap-2 mb-2">
          <FileText class="w-4 h-4 text-blue-600" />
          <span class="text-sm font-medium text-blue-700">总操作数</span>
        </div>
        <p class="text-2xl font-bold text-blue-800">{{ logs.length }}</p>
      </div>
      <div class="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4 border border-teal-200/50">
        <div class="flex items-center gap-2 mb-2">
          <User class="w-4 h-4 text-teal-600" />
          <span class="text-sm font-medium text-teal-700">活跃用户</span>
        </div>
        <p class="text-2xl font-bold text-teal-800">6</p>
      </div>
    </div>

    <DataTable :columns="columns" :data="logs" />
  </div>
</template>
