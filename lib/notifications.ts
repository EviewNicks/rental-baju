/**
 * Simple Toast Notification System
 * Provides success, error, and info notifications
 */

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

type ToastListener = (toast: Toast) => void

class ToastManager {
  private listeners: ToastListener[] = []
  private toasts: Toast[] = []

  addListener(listener: ToastListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify(toast: Toast) {
    this.toasts.push(toast)
    this.listeners.forEach(listener => listener(toast))

    // Auto remove after duration
    setTimeout(() => {
      this.remove(toast.id)
    }, toast.duration || 5000)
  }

  private remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id)
  }

  success(title: string, message?: string, duration?: number) {
    this.notify({
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      duration,
    })
  }

  error(title: string, message?: string, duration?: number) {
    this.notify({
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      duration: duration || 7000, // Longer for errors
    })
  }

  info(title: string, message?: string, duration?: number) {
    this.notify({
      id: Date.now().toString(),
      type: 'info',
      title,
      message,
      duration,
    })
  }

  warning(title: string, message?: string, duration?: number) {
    this.notify({
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      duration,
    })
  }
}

export const toast = new ToastManager()

// Convenience functions
export const showSuccess = (title: string, message?: string) => toast.success(title, message)
export const showError = (title: string, message?: string) => toast.error(title, message)
export const showInfo = (title: string, message?: string) => toast.info(title, message)
export const showWarning = (title: string, message?: string) => toast.warning(title, message)