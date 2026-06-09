/**
 * Toast Helper
 *
 * Helper functions for displaying Sonner toasts based on API error responses.
 * Integrates with ErrorService backend (Task 1) for consistent error handling.
 *
 * Maps API error responses to appropriate toast types and durations.
 */

import { toast } from 'sonner'

/**
 * API Error Response Structure
 * Matches ErrorService.createErrorResponse() output from Task 1
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    context?: Record<string, unknown>
    category: 'CRITICAL' | 'WARNING' | 'INFO'
    actions?: string[]
    timestamp: string
  }
}

/**
 * Show API error as Sonner toast
 *
 * @param errorResponse - API error response from backend or unknown error
 *
 * Example:
 * ```typescript
 * try {
 *   await submitTransaction()
 * } catch (error) {
 *   showApiError(error)
 * }
 * ```
 */
export function showApiError(errorResponse: ApiErrorResponse | unknown): void {
  // Handle unknown errors
  if (!errorResponse || typeof errorResponse !== 'object') {
    toast.error('Terjadi kesalahan tidak terduga. Silakan coba lagi.', {
      duration: 10000,
    })
    return
  }

  // Check if it's an ApiErrorResponse
  if ('success' in errorResponse && errorResponse.success === false && 'error' in errorResponse) {
    const apiError = errorResponse as ApiErrorResponse
    const { error } = apiError

    // Map category to toast type
    const toastType =
      error.category === 'CRITICAL' ? 'error' : error.category === 'WARNING' ? 'warning' : 'info'

    // Build description from actions if available
    const description = error.actions?.length ? error.actions.join('\n') : undefined

    // Call toast with appropriate type and duration
    toast[toastType](error.message, {
      description,
      duration: error.category === 'CRITICAL' ? 10000 : 7000, // 10s for critical, 7s for warning/info
    })
    return
  }

  // Handle KasirApiError or other error objects
  if ('message' in errorResponse) {
    const errorMessage = String(errorResponse.message)

    // ✅ FIX: Check if this is a KasirApiError with category and actions
    const error = errorResponse as any

    // ✅ NEW: Use category from KasirApiError if available
    const category = error.category || 'CRITICAL' // Default to CRITICAL for safety
    const toastType =
      category === 'CRITICAL' ? 'error' : category === 'WARNING' ? 'warning' : 'info'

    // ✅ NEW: Use actions from KasirApiError if available
    let description: string | undefined

    if (error.actions && Array.isArray(error.actions) && error.actions.length > 0) {
      // Use actions from backend error response
      description = error.actions.join('\n')
    } else if (error.details) {
      // Fallback: Extract additional error details for better UX
      if (typeof error.details === 'string') {
        description = error.details
      } else if (error.details.errorDetails) {
        description = error.details.errorDetails
      } else if (Array.isArray(error.validationErrors)) {
        // Validation errors array
        description = error.validationErrors
          .map((e: { field: string; message: string }) => `• ${e.field}: ${e.message}`)
          .join('\n')
      } else if (error.details.context) {
        description = error.details.context
      }
    } else if (error.context) {
      description = error.context
    }

    // ✅ FIX: Use appropriate toast type based on category
    // ✅ FIX: Use Infinity duration for manual close - toast stays until user clicks close
    // ✅ FIX: Add action button for manual dismissal
    toast[toastType](errorMessage, {
      description: description || 'Klik tombol tutup untuk menutup pesan ini',
      duration: Infinity, // Toast stays visible until manually closed
      action: {
        label: 'Tutup',
        onClick: () => {}, // Dismiss toast when clicked
      },
    })
    return
  }

  // Fallback for completely unknown errors
  toast.error('Terjadi kesalahan tidak terduga. Silakan coba lagi.', {
    duration: 10000,
  })
}

/**
 * Show success toast
 *
 * @param message - Success message to display
 * @param duration - Duration in milliseconds (default: 4000)
 */
export function showSuccess(message: string, duration: number = 4000): void {
  toast.success(message, {
    duration,
  })
}

/**
 * Show info toast
 *
 * @param message - Info message to display
 * @param duration - Duration in milliseconds (default: 5000)
 */
export function showInfo(message: string, duration: number = 5000): void {
  toast.info(message, {
    duration,
  })
}

/**
 * Show warning toast
 *
 * @param message - Warning message to display
 * @param duration - Duration in milliseconds (default: 7000)
 */
export function showWarning(message: string, duration: number = 7000): void {
  toast.warning(message, {
    duration,
  })
}

/**
 * Show loading toast
 *
 * Returns a toast ID that can be used to dismiss or update the toast later.
 *
 * @param message - Loading message to display
 * @returns Toast ID for later updates/dismissal
 *
 * Example:
 * ```typescript
 * const toastId = showLoading('Memproses...')
 * // Later:
 * toast.success('Selesai!', { id: toastId })
 * ```
 */
export function showLoading(message: string = 'Memproses...'): string | number {
  return toast.loading(message)
}

/**
 * Wrap an async operation with toast.promise
 *
 * Automatically shows loading, success, or error toasts based on promise result.
 *
 * @param promise - Promise to wrap
 * @param messages - Messages for each state
 * @returns Toast ID for manual control
 *
 * Example:
 * ```typescript
 * showPromiseToast(
 *   submitTransaction(),
 *   {
 *     loading: 'Memproses transaksi...',
 *     success: 'Transaksi berhasil dibuat!',
 *     error: 'Gagal membuat transaksi'
 *   }
 * )
 * ```
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  },
): void {
  toast.promise(promise, messages)
}
