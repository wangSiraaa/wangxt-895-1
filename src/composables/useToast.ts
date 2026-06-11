import type { ToastType } from '@/components/AppToast'

export function useToast() {
  function showToast(message: string, type: ToastType = 'info', duration = 3000) {
    const event = new CustomEvent('app-toast-show', {
      detail: { message, type, duration }
    })
    window.dispatchEvent(event)
  }

  function removeToast(id: number) {
    const event = new CustomEvent('app-toast-remove', {
      detail: { id }
    })
    window.dispatchEvent(event)
  }

  return {
    showToast,
    removeToast,
  }
}
