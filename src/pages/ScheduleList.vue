<script setup lang="ts">
import { ref } from 'vue'
import { Calendar, Clock, Users, MapPin } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'

const dateGroups = ref([
  {
    date: '2024-02-01',
    weekday: '周四',
    schedules: [
      { id: 1, time: '08:30-14:30', booking: 'BK20240128001', school: '市第一中学', count: 120, guide: '李讲解', line: 'A线', status: 'scheduled', meet: '景区北门' },
    ]
  },
  {
    date: '2024-02-02',
    weekday: '周五',
    schedules: [
      { id: 2, time: '09:00-15:00', booking: 'BK20240128002', school: '实验二小', count: 85, guide: '王讲解', line: 'B线', status: 'scheduled', meet: '景区南门' },
      { id: 3, time: '13:00-18:00', booking: 'BK20240127003', school: '少年宫活动中心', count: 45, guide: '待分配', line: 'C线', status: 'list_uploaded', meet: '待定' },
    ]
  }
])
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">排班管理</h1>
      <p class="text-sm text-slate-500 mt-1">查看和管理讲解排班安排</p>
    </div>

    <div class="flex items-center gap-2 p-4 bg-white rounded-xl border border-slate-200">
      <Calendar class="w-5 h-5 text-teal-600" />
      <span class="text-sm font-medium text-slate-700">2024年2月</span>
    </div>

    <div class="space-y-6">
      <div v-for="group in dateGroups" :key="group.date">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-slate-800">{{ group.date.slice(5) }}</span>
            <span class="text-sm text-slate-500">{{ group.weekday }}</span>
          </div>
          <span class="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">
            {{ group.schedules.length }} 场
          </span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div
            v-for="item in group.schedules"
            :key="item.id"
            class="p-5 hover:bg-slate-50/50 transition-colors"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                  <StatusBadge :status="item.status" />
                  <span class="text-sm font-semibold text-slate-800">{{ item.school }}</span>
                  <span class="text-xs text-slate-400">{{ item.booking }}</span>
                </div>

                <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div class="flex items-center gap-2 text-slate-600">
                    <Clock class="w-4 h-4 text-slate-400" />
                    <span>{{ item.time }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <Users class="w-4 h-4 text-slate-400" />
                    <span>{{ item.count }} 人</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <MapPin class="w-4 h-4 text-slate-400" />
                    <span>{{ item.meet }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <span class="text-slate-400">讲解员：</span>
                    <span :class="item.guide === '待分配' ? 'text-amber-600 font-medium' : 'text-slate-800 font-medium'">{{ item.guide }}</span>
                  </div>
                </div>

                <div class="mt-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                    {{ item.line }}
                  </span>
                </div>
              </div>

              <button class="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 rounded text-sm transition-colors">
                详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
