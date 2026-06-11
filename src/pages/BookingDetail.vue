<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Upload,
  Edit3,
  Printer,
  Users,
  Calendar,
  Utensils,
  AlertTriangle,
  Clock,
} from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import DataTable from '@/components/DataTable.vue'
import type { Column } from '@/components/DataTable.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { useToast } from '@/composables/useToast'
import type { BookingDetail } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const bookingId = computed(() => route.params.id as string)

const loading = ref(false)
const booking = ref<BookingDetail | null>(null)

const studentList = ref<
  Array<{ id: string; name: string; grade?: string; class_name?: string }>
>([])
const teacherList = ref<
  Array<{ id: string; name: string; phone?: string }>
>([])

const timeline = computed(() => {
  if (!booking.value) return []
  const steps = [
    { key: 'draft', title: '创建预约', desc: `销售 ${booking.value.created_by_name} 创建预约单`, done: true },
    { key: 'list_uploaded', title: '上传名单', desc: '学生和老师名单已上传', done: false },
    { key: 'scheduled', title: '分配排班', desc: '讲解员已安排', done: false },
    { key: 'catering_confirmed', title: '餐饮确认', desc: '餐饮需求已确认', done: false },
    { key: 'risk_confirmed', title: '风险告知', desc: '风险告知书已签署', done: false },
    { key: 'checked_in', title: '签到接待', desc: '到访日现场签到', done: false },
    { key: 'settled', title: '生成结算', desc: '结算单已生成', done: false },
    { key: 'settlement_confirmed', title: '结算确认', desc: '财务已确认结算', done: false },
    { key: 'completed', title: '接待完成', desc: '全部流程已完成', done: false },
  ]
  const order = [
    'draft',
    'list_uploaded',
    'scheduled',
    'catering_confirmed',
    'risk_confirmed',
    'checked_in',
    'settled',
    'settlement_confirmed',
    'completed',
  ]
  const currentIdx = order.indexOf(booking.value.status)
  return steps.map((s, i) => ({
    ...s,
    done: i <= currentIdx,
    current: i === currentIdx,
  }))
})

const listColumns: Column[] = [
  { key: 'name', label: '姓名' },
  { key: 'grade', label: '年级' },
  { key: 'class_name', label: '班级' },
]

const teacherColumns: Column[] = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '联系电话' },
]

function goBack() {
  router.back()
}

function goEdit() {
  router.push(`/bookings/${bookingId.value}/edit`)
}

async function loadBooking() {
  loading.value = true
  try {
    const data = (await api.get(`/bookings/${bookingId.value}`)) as BookingDetail
    booking.value = data
  } catch (err) {
    showToast('加载预约详情失败', 'error')
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBooking()
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="flex items-center gap-1 text-slate-500 hover:text-teal-600 text-sm transition-colors"
        >
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
          @click="goEdit"
          class="flex items-center gap-2 px-3 py-2 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-sm transition-colors"
        >
          <Edit3 class="w-4 h-4" />
          编辑
        </button>
        <button
          v-if="authStore.isSales"
          class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Upload class="w-4 h-4" />
          上传名单
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20 text-slate-500">
      加载中...
    </div>

    <template v-else-if="booking">
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

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p class="text-slate-400 text-xs">学校</p>
                <p class="text-slate-800 font-medium mt-1">{{ booking.school_name }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">到访日期</p>
                <p class="text-slate-800 font-medium mt-1">{{ booking.visit_date }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-xs">负责销售</p>
                <p class="text-slate-800 font-medium mt-1">{{ booking.created_by_name }}</p>
              </div>
              <div class="flex items-center gap-2">
                <Users class="w-4 h-4 text-teal-500" />
                <div>
                  <p class="text-slate-400 text-xs">学生人数</p>
                  <p class="text-slate-800 font-semibold mt-0.5">
                    {{ booking.expected_student_count }} 人
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-amber-500" />
                <div>
                  <p class="text-slate-400 text-xs">带队老师</p>
                  <p class="text-slate-800 font-semibold mt-0.5">
                    {{ booking.expected_teacher_count }} 人
                  </p>
                </div>
              </div>
            </div>

            <div v-if="booking.contact_name || booking.contact_phone" class="mt-4 pt-4 border-t border-slate-100">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div v-if="booking.contact_name">
                  <p class="text-slate-400 text-xs">联系人</p>
                  <p class="text-slate-700 mt-1">{{ booking.contact_name }}</p>
                </div>
                <div v-if="booking.contact_phone">
                  <p class="text-slate-400 text-xs">联系电话</p>
                  <p class="text-slate-700 mt-1">{{ booking.contact_phone }}</p>
                </div>
              </div>
            </div>

            <div v-if="booking.notes" class="mt-4 pt-4 border-t border-slate-100">
              <p class="text-slate-400 text-xs">备注</p>
              <p class="text-slate-600 text-sm mt-1 leading-relaxed">{{ booking.notes }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <div class="flex items-center gap-2 mb-2">
                <Calendar class="w-4 h-4 text-indigo-500" />
                <p class="text-xs text-indigo-600 font-medium">讲解排班</p>
              </div>
              <p class="text-slate-800 font-semibold">待安排</p>
              <p class="text-xs text-slate-500 mt-1">暂无讲解员分配</p>
            </div>
            <div class="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
              <div class="flex items-center gap-2 mb-2">
                <Utensils class="w-4 h-4 text-amber-500" />
                <p class="text-xs text-amber-700 font-medium">餐饮安排</p>
              </div>
              <p class="text-slate-800 font-semibold">待确认</p>
              <p class="text-xs text-slate-500 mt-1">餐标：¥30/人</p>
            </div>
            <div class="p-4 bg-red-50/50 rounded-lg border border-red-100">
              <div class="flex items-center gap-2 mb-2">
                <AlertTriangle class="w-4 h-4 text-red-500" />
                <p class="text-xs text-red-600 font-medium">风险告知</p>
              </div>
              <p class="text-slate-800 font-semibold">未签署</p>
              <p class="text-xs text-slate-500 mt-1">到访前需确认</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-slate-800">学生名单</h2>
              <button
                v-if="authStore.isSales"
                class="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
              >
                <Upload class="w-4 h-4" />
                上传名单
              </button>
            </div>
            <DataTable
              :columns="listColumns"
              :data="studentList"
              empty-text="暂无名单，请上传学生花名册"
            />
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-base font-semibold text-slate-800 mb-4">带队老师</h2>
            <DataTable
              :columns="teacherColumns"
              :data="teacherList"
              empty-text="暂无带队老师信息"
            />
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <Clock class="w-4 h-4 text-teal-600" />
              <h2 class="text-base font-semibold text-slate-800">操作进度</h2>
            </div>
            <div class="space-y-0">
              <div
                v-for="(item, idx) in timeline"
                :key="item.key"
                class="relative pl-7 pb-5 last:pb-0"
              >
                <div
                  class="absolute left-0 top-1 w-4 h-4 rounded-full border-2"
                  :class="[
                    item.done ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-300',
                    item.current ? 'ring-2 ring-teal-200 ring-offset-1' : '',
                  ]"
                ></div>
                <div
                  v-if="idx < timeline.length - 1"
                  class="absolute left-[7px] top-5 bottom-0 w-px"
                  :class="item.done ? 'bg-teal-200' : 'bg-slate-200'"
                ></div>
                <p class="text-xs text-slate-400">{{ item.done ? '已完成' : '待执行' }}</p>
                <p
                  class="text-sm font-medium mt-0.5"
                  :class="item.done ? 'text-slate-800' : 'text-slate-400'"
                >
                  {{ item.title }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-base font-semibold text-slate-800 mb-3">创建信息</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">创建人</span>
                <span class="text-slate-700 font-medium">{{ booking.created_by_name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">创建时间</span>
                <span class="text-slate-700">
                  {{ new Date(booking.created_at).toLocaleString('zh-CN') }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">更新时间</span>
                <span class="text-slate-700">
                  {{ new Date(booking.updated_at).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
