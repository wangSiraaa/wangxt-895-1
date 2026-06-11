<script setup lang="ts">
import { computed } from 'vue'

export interface Column<T = any> {
  key: string
  label: string
  width?: string
  render?: (row: T, index: number) => any
}

const props = defineProps<{
  columns: Column[]
  data: any[]
  emptyText?: string
  loading?: boolean
}>()

const isEmpty = computed(() => !props.data || props.data.length === 0)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white relative">
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"
    >
      <div class="flex items-center gap-2 text-slate-500 text-sm">
        <svg class="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        加载中...
      </div>
    </div>
    <table class="min-w-full divide-y divide-slate-200">
      <thead class="bg-slate-50">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
            :style="{ width: col.width }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="!isEmpty && !loading" class="divide-y divide-slate-100">
        <tr
          v-for="(row, idx) in data"
          :key="idx"
          class="transition-colors hover:bg-teal-50/40"
          :class="idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-sm text-slate-700"
          >
            <component
              v-if="col.render"
              :is="col.render(row, idx)"
            />
            <span v-else>{{ row[col.key] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="isEmpty && !loading"
      class="flex flex-col items-center justify-center py-16 px-4 text-slate-400"
    >
      <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm">{{ emptyText || '暂无数据' }}</p>
    </div>
  </div>
</template>
