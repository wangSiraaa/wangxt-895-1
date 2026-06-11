<script setup lang="ts">
import { ref } from 'vue'
import { UserCheck, Search, QrCode, Users } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'

const todayList = ref([
  { id: 1, booking: 'BK20240128001', school: '市第一中学', count: 120, checkin: 0, time: '08:30', guide: '李讲解', meet: '北门', status: 'scheduled' },
  { id: 2, booking: 'BK20240126010', school: '科技实验小学', count: 60, checkin: 60, time: '09:15', guide: '张讲解', meet: '南门', status: 'checked_in' },
])
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">签到接待</h1>
      <p class="text-sm text-slate-500 mt-1">团队到访签到与接待登记</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <Users class="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">今日计划到访</p>
            <p class="text-xl font-bold text-slate-800">{{ todayList.reduce((s, i) => s + i.count, 0) }} 人</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <UserCheck class="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">已签到</p>
            <p class="text-xl font-bold text-slate-800">{{ todayList.reduce((s, i) => s + i.checkin, 0) }} 人</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <QrCode class="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p class="text-xs text-slate-500">待签到团队</p>
            <p class="text-xl font-bold text-slate-800">{{ todayList.filter(t => t.status !== 'checked_in').length }} 队</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索学校名称、预约单号..."
          class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        />
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="item in todayList"
        :key="item.id"
        class="bg-white rounded-xl border border-slate-200 p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <StatusBadge :status="item.status" />
              <h3 class="text-lg font-semibold text-slate-800">{{ item.school }}</h3>
              <span class="text-xs text-slate-400">{{ item.booking }}</span>
            </div>

            <div class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p class="text-slate-400 text-xs">预计时间</p>
                <p class="text-slate-800 font-medium mt-1">{{ item.time }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">集合地点</p>
                <p class="text-slate-800 font-medium mt-1">{{ item.meet }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">讲解员</p>
                <p class="text-slate-800 font-medium mt-1">{{ item.guide }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">总人数</p>
                <p class="text-slate-800 font-medium mt-1">{{ item.count }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">签到进度</p>
                <p class="text-teal-700 font-bold mt-1">{{ item.checkin }} / {{ item.count }}</p>
              </div>
            </div>

            <div class="mt-3">
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all bg-gradient-to-r from-teal-500 to-teal-600"
                  :style="{ width: `${(item.checkin / item.count) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
              <QrCode class="w-4 h-4" />
              扫码签到
            </button>
            <button class="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm transition-colors">
              查看名单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
