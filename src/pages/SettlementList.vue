<script setup lang="ts">
import { ref, computed } from 'vue'
import { Receipt, FileCheck2, FileX2, Wallet } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'

const settlements = ref([
  { id: 1, code: 'ST20240130001', booking: 'BK20240126002', school: '阳光小学', date: '2024-01-30', amount: 20400, status: 'settled', operator: '财务小王', paidAt: '2024-01-31' },
  { id: 2, code: 'ST20240129002', booking: 'BK20240125008', school: '育才中学', date: '2024-01-29', amount: 46800, status: 'settled', operator: '财务小王', paidAt: '2024-01-30' },
  { id: 3, code: 'ST20240127005', booking: 'BK20240127005', school: '少年宫活动中心', date: '2024-01-27', amount: 13500, status: 'completed', operator: '-', paidAt: '-' },
  { id: 4, code: 'ST20240131008', booking: 'BK20240128009', school: '育英学校', date: '2024-01-31', amount: 38200, status: 'completed', operator: '-', paidAt: '-' },
])

const stats = computed(() => ({
  pending: settlements.value.filter(s => s.status !== 'settled').length,
  pendingAmount: settlements.value.filter(s => s.status !== 'settled').reduce((a, b) => a + b.amount, 0),
  settled: settlements.value.filter(s => s.status === 'settled').length,
  settledAmount: settlements.value.filter(s => s.status === 'settled').reduce((a, b) => a + b.amount, 0),
}))
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">结算管理</h1>
      <p class="text-sm text-slate-500 mt-1">审核和完成团队费用结算</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Receipt class="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">待审核</p>
            <p class="text-xl font-bold text-slate-800">{{ stats.pending }} 笔</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Wallet class="w-5 h-5 text-red-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">待结算金额</p>
            <p class="text-xl font-bold text-slate-800">¥ {{ stats.pendingAmount.toLocaleString() }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <FileCheck2 class="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">已结算</p>
            <p class="text-xl font-bold text-slate-800">{{ stats.settled }} 笔</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FileX2 class="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">已结算金额</p>
            <p class="text-xl font-bold text-slate-800">¥ {{ stats.settledAmount.toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">结算单号</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">关联预约</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">学校</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">到访日期</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">金额</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">状态</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in settlements" :key="item.id" class="hover:bg-slate-50/50">
            <td class="px-4 py-4 text-sm font-mono text-slate-700">{{ item.code }}</td>
            <td class="px-4 py-4 text-sm text-slate-500">{{ item.booking }}</td>
            <td class="px-4 py-4 text-sm text-slate-800 font-medium">{{ item.school }}</td>
            <td class="px-4 py-4 text-sm text-slate-600">{{ item.date }}</td>
            <td class="px-4 py-4 text-sm font-bold text-teal-700">¥ {{ item.amount.toLocaleString() }}</td>
            <td class="px-4 py-4">
              <StatusBadge :status="item.status" />
            </td>
            <td class="px-4 py-4">
              <button
                v-if="item.status !== 'settled'"
                class="text-teal-600 hover:text-teal-800 text-sm font-medium"
              >
                审核
              </button>
              <button
                v-else
                class="text-slate-500 hover:text-slate-700 text-sm"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
