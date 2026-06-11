<script setup lang="ts">
import { reactive, onMounted, onUnmounted } from 'vue'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  message: string
  type: ToastType
  visible: boolean
}

const toasts = reactive<ToastItem[]>([])
let idCounter = 0

const typeConfig: Record<ToastType, { bg: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-teal-50 border-teal-200 text-teal-800', icon: CheckCircle },
  error: { bg: 'bg-red-50 border-red-200 text-red-800', icon: XCircle },
  info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info },
  warning: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle },
}

function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = ++idCounter
  const toast: ToastItem = {
    id,
    message,
    type,
    visible: true,
  }
  toasts.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

function removeToast(id: number) {
  const idx = toasts.findIndex(t => t.id === id)
  if (idx > -1) {
    toasts[idx].visible = false
    setTimeout(() => {
      toasts.splice(idx, 1)
    }, 200)
  }
}

function onShowEvent(e: Event) {
  const ev = e as CustomEvent
  showToast(ev.detail.message, ev.detail.type, ev.detail.duration)
}

function onRemoveEvent(e: Event) {
  const ev = e as CustomEvent
  removeToast(ev.detail.id)
}

onMounted(() => {
  window.addEventListener('app-toast-show', onShowEvent)
  window.addEventListener('app-toast-remove', onRemoveEvent)
})

onUnmounted(() => {
  window.removeEventListener('app-toast-show', onShowEvent)
  window.removeEventListener('app-toast-remove', onRemoveEvent)
})

defineExpose({
  showToast,
  removeToast,
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="border rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 backdrop-blur-sm transition-all duration-200"
          :class="[
            typeConfig[toast.type].bg,
            toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          ]"
        >
          <component :is="typeConfig[toast.type].icon" class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p class="text-sm flex-1 leading-relaxed">{{ toast.message }}</p>
          <button
            class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            @click="removeToast(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.2s ease;
}
</style>
