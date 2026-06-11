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
}>()

const isEmpty = computed(() => !props.data || props.data.length === 0)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
      <tbody v-if="!isEmpty" class="divide-y divide-slate-100">
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
      v-if="isEmpty"
      class="flex flex-col items-center justify-center py-16 px-4 text-slate-400"
    >
      <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm">{{ emptyText || '暂无数据' }}</p>
    </div>
  </div>
</template>
