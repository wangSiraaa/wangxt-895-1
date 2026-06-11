<script setup lang="ts">
import { ref } from 'vue'
import { UtensilsCrossed, CheckCircle2, Clock } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'

const cateringList = ref([
  { id: 1, date: '2024-02-01', booking: 'BK20240128001', school: '市第一中学', count: 120, teachers: 8, mealType: '套餐A', tables: 12, time: '11:45', status: 'catering_confirmed', note: '3人素食' },
  { id: 2, date: '2024-02-02', booking: 'BK20240128002', school: '实验二小', count: 85, teachers: 5, mealType: '套餐B', tables: 9, time: '12:00', status: 'scheduled', note: '' },
  { id: 3, date: '2024-02-03', booking: 'BK20240128003', school: '少年宫活动中心', count: 45, teachers: 3, mealType: '套餐A', tables: 5, time: '11:30', status: 'list_uploaded', note: '1人过敏体质' },
])
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">餐饮管理</h1>
      <p class="text-sm text-slate-500 mt-1">确认和管理团队用餐安排</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle2 class="w-5 h-5" />
          <span class="text-sm opacity-90">已确认</span>
        </div>
        <p class="text-3xl font-bold">1</p>
        <p class="text-xs opacity-80 mt-1">128 人需用餐</p>
      </div>
      <div class="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Clock class="w-5 h-5" />
          <span class="text-sm opacity-90">待确认</span>
        </div>
        <p class="text-3xl font-bold">2</p>
        <p class="text-xs opacity-80 mt-1">133 人待确认</p>
      </div>
      <div class="bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <UtensilsCrossed class="w-5 h-5" />
          <span class="text-sm opacity-90">餐桌合计</span>
        </div>
        <p class="text-3xl font-bold">26</p>
        <p class="text-xs opacity-80 mt-1">桌 · 10人/桌标准</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">日期</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">学校</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">人数/老师</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">用餐时间</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">套餐/桌数</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">备注</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in cateringList" :key="item.id" class="hover:bg-slate-50/50">
            <td class="px-4 py-4 text-sm text-slate-700 font-medium">{{ item.date }}</td>
            <td class="px-4 py-4">
              <p class="text-sm text-slate-800 font-medium">{{ item.school }}</p>
              <p class="text-xs text-slate-400">{{ item.booking }}</p>
            </td>
            <td class="px-4 py-4 text-sm text-slate-700">{{ item.count }} / {{ item.teachers }}</td>
            <td class="px-4 py-4 text-sm text-slate-700">{{ item.time }}</td>
            <td class="px-4 py-4">
              <p class="text-sm text-slate-800 font-medium">{{ item.mealType }}</p>
              <p class="text-xs text-slate-500">{{ item.tables }} 桌</p>
            </td>
            <td class="px-4 py-4 text-xs text-amber-600">{{ item.note || '-' }}</td>
            <td class="px-4 py-4">
              <StatusBadge :status="item.status" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
