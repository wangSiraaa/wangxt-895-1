<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Upload, Edit3, Printer } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import DataTable from '@/components/DataTable.vue'
import type { Column } from '@/components/DataTable.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const bookingId = computed(() => route.params.id as string)

const booking = computed(() => ({
  id: bookingId.value,
  school: '市第一中学',
  grade: '初二年级',
  count: 120,
  date: '2024-02-01',
  status: 'scheduled',
  sales: '张三',
  contact: '王老师',
  phone: '138****5678',
  line: 'A线 - 历史文化探索',
  amount: '¥ 36,000',
  guide: '李讲解',
  bus: '2辆 50座',
  lunch: '12桌 套餐A',
  createTime: '2024-01-28 10:23',
}))

const studentList = [
  { no: 1, name: '班级花名册.xlsx', uploadedAt: '2024-01-29 09:15', size: '28KB', status: '已上传' }
]

const listColumns: Column[] = [
  { key: 'no', label: '序号', width: '60px' },
  { key: 'name', label: '文件名' },
  { key: 'uploadedAt', label: '上传时间', width: '140px' },
  { key: 'size', label: '大小', width: '80px' },
  { key: 'status', label: '状态', width: '80px' },
]

const timeline = [
  { time: '10:23', title: '创建预约', desc: '销售 张三 创建预约单' },
  { time: '09:15', title: '上传名单', desc: '王老师 上传学生花名册' },
  { time: '14:30', title: '分配排班', desc: '调度 分配讲解员、车辆' },
  { time: '待执行', title: '签到接待', desc: '到访日现场签到' },
]

function goBack() {
  router.back()
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="flex items-center gap-1 text-slate-500 hover:text-teal-600 text-sm transition-colors">
          <ArrowLeft class="w-4 h-4" />
          返回
        </button>
        <h1 class="text-2xl font-bold text-slate-800">预约详情</h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="authStore.isSales || authStore.isDispatcher"
          class="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm transition-colors"
        >
          <Printer class="w-4 h-4" />
          打印
        </button>
        <button
          v-if="authStore.isSales || authStore.isDispatcher"
          class="flex items-center gap-2 px-3 py-2 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-sm transition-colors"
        >
          <Edit3 class="w-4 h-4" />
          编辑
        </button>
        <button
          v-if="authStore.isSales || authStore.isDispatcher"
          class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Upload class="w-4 h-4" />
          上传名单
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-5">
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-start justify-between mb-5">
            <div>
              <p class="text-xs text-slate-400">预约单号</p>
              <p class="text-lg font-bold text-slate-800 mt-1">{{ booking.id }}</p>
            </div>
            <StatusBadge :status="booking.status" />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-slate-400 text-xs">学校</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.school }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">年级</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.grade }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">人数</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.count }} 人</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">到访日期</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.date }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">联系人</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.contact }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">电话</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.phone }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">负责销售</p>
              <p class="text-slate-800 font-medium mt-1">{{ booking.sales }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-xs">金额</p>
              <p class="text-teal-700 font-bold mt-1">{{ booking.amount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-4">排班安排</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <p class="text-xs text-indigo-600 font-medium">讲解员</p>
              <p class="text-slate-800 font-semibold mt-1">{{ booking.guide }}</p>
            </div>
            <div class="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
              <p class="text-xs text-amber-700 font-medium">车辆安排</p>
              <p class="text-slate-800 font-semibold mt-1">{{ booking.bus }}</p>
            </div>
            <div class="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <p class="text-xs text-purple-700 font-medium">餐饮安排</p>
              <p class="text-slate-800 font-semibold mt-1">{{ booking.lunch }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-slate-800">名单上传</h2>
            <button
              v-if="authStore.isSales"
              class="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
            >
              <Upload class="w-4 h-4" />
              新增
            </button>
          </div>
          <DataTable :columns="listColumns" :data="studentList" empty-text="暂无名单，请上传" />
        </div>
      </div>

      <div class="space-y-5">
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-4">操作进度</h2>
          <div class="space-y-0">
            <div
              v-for="(item, idx) in timeline"
              :key="idx"
              class="relative pl-7 pb-5 last:pb-0"
            >
              <div
                class="absolute left-0 top-1 w-4 h-4 rounded-full border-2"
                :class="idx < 3 ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-300'"
              ></div>
              <div
                v-if="idx < timeline.length - 1"
                class="absolute left-[7px] top-5 bottom-0 w-px"
                :class="idx < 3 ? 'bg-teal-200' : 'bg-slate-200'"
              ></div>
              <p class="text-xs text-slate-400">{{ item.time }}</p>
              <p class="text-sm font-medium text-slate-800 mt-0.5">{{ item.title }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-3">研学线路</h2>
          <div class="p-4 bg-gradient-to-br from-teal-50 to-slate-50 rounded-lg">
            <p class="text-sm font-semibold text-teal-800">{{ booking.line }}</p>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              含：博物馆参观 + 非遗体验 + 午餐 + 讲解服务。全程约6小时。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
