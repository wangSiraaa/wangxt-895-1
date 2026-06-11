<script lang="ts">
export const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: { label: '草稿', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
  list_uploaded: { label: '名单已上传', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  scheduled: { label: '已排班', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  catering_confirmed: { label: '餐饮已确认', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  risk_confirmed: { label: '风险已告知', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  checked_in: { label: '已签到', classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  settled: { label: '已结算', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  settlement_confirmed: { label: '结算已确认', classes: 'bg-green-100 text-green-700 border-green-200' },
  completed: { label: '已完成', classes: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: '已取消', classes: 'bg-red-100 text-red-700 border-red-200' },
}

export const auditStatusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: '待审核', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
  approved: { label: '审核通过', classes: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '审核驳回', classes: 'bg-red-100 text-red-700 border-red-200' },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type?: 'booking' | 'audit'
}>()

const config = computed(() => {
  const cfg = props.type === 'audit' ? auditStatusConfig : statusConfig
  return cfg[props.status] || { label: props.status, classes: 'bg-slate-100 text-slate-700 border-slate-200' }
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="config.classes"
  >
    {{ config.label }}
  </span>
</template>
