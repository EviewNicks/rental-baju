/**
 * Transaction Error Detection Utility
 *
 * Centralized error type detection logic to eliminate duplication
 * across error handling in transaction components
 *
 * Extracted from: features/kasir/components/detail/TransactionDetailPage.tsx
 * Lines 29-99 (error detection patterns)
 */

export interface TransactionErrorDetails {
  title: string
  description: string
  suggestions: string[]
  canRetry: boolean
}

export type TransactionErrorType =
  | 'not_found'
  | 'network_error'
  | 'server_error'
  | 'permission_error'
  | 'validation_error'
  | 'general_error'

/**
 * Detect transaction error type and generate appropriate error details
 *
 * This function centralizes the repetitive error type detection logic
 * that was previously present in TransactionDetailPage components
 *
 * @param error - Error object or error message
 * @returns Formatted error details with suggestions
 */
export function detectTransactionError(error: unknown): TransactionErrorDetails {
  // Extract error message from various error types
  const errorMessage =
    error && typeof error === 'object' && 'message' in error
      ? (error as { message: string }).message
      : typeof error === 'string'
        ? error
        : 'Unknown error'

  // Enhanced error detection with multiple pattern matching
  const isNotFound =
    errorMessage.includes('tidak ditemukan') ||
    errorMessage.includes('Not Found') ||
    errorMessage.includes('Tidak ditemukan')

  const isNetworkError =
    errorMessage.includes('fetch') ||
    errorMessage.includes('Network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')

  const isServerError =
    errorMessage.includes('Internal Server Error') ||
    errorMessage.includes('500') ||
    errorMessage.includes('Service Unavailable') ||
    errorMessage.includes('503')

  const isPermissionError =
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('403') ||
    errorMessage.includes('Forbidden') ||
    errorMessage.includes('Access denied')

  const isValidationError =
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')

  // Return appropriate error details based on detected type
  if (isNotFound) {
    return {
      title: 'Transaksi Tidak Ditemukan',
      description: 'Transaksi yang Anda cari tidak dapat ditemukan dalam sistem.',
      suggestions: [
        'Periksa kembali kode transaksi',
        'Cari transaksi di daftar transaksi',
        'Pastikan transaksi belum dihapus',
        'Gunakan kode transaksi yang benar (contoh: TXN-20250726-001)'
      ],
      canRetry: false,
    }
  }

  if (isNetworkError) {
    return {
      title: 'Masalah Koneksi',
      description: 'Koneksi internet bermasalah. Periksa koneksi dan coba lagi.',
      suggestions: [
        'Periksa koneksi internet',
        'Coba refresh halaman',
        'Tunggu beberapa saat lalu coba lagi',
        'Periksa koneksi ke server'
      ],
      canRetry: true,
    }
  }

  if (isServerError) {
    return {
      title: 'Server Bermasalah',
      description: 'Terjadi gangguan pada server. Tim kami sedang menangani masalah ini.',
      suggestions: [
        'Tunggu beberapa menit lalu coba lagi',
        'Hubungi support jika masalah berlanjut',
        'Coba akses fitur lain terlebih dahulu',
        'Periksa status server'
      ],
      canRetry: true,
    }
  }

  if (isPermissionError) {
    return {
      title: 'Akses Ditolak',
      description: 'Anda tidak memiliki izin untuk mengakses transaksi ini.',
      suggestions: [
        'Login ulang dengan akun yang benar',
        'Hubungi admin untuk mendapatkan akses',
        'Periksa role dan permissions akun Anda',
        'Pastikan Anda memiliki hak akses yang cukup'
      ],
      canRetry: false,
    }
  }

  if (isValidationError) {
    return {
      title: 'Data Tidak Valid',
      description: 'Data yang dimasukkan tidak sesuai format yang diharapkan.',
      suggestions: [
        'Periksa kembali input data',
        'Pastikan semua field wajib diisi',
        'Gunakan format yang benar',
        'Lihat panduan input data'
      ],
      canRetry: true,
    }
  }

  // Default/general error case
  return {
    title: 'Terjadi Kesalahan',
    description: 'Gagal memuat detail transaksi. Silakan coba lagi.',
    suggestions: [
      'Refresh halaman',
      'Coba lagi dalam beberapa saat',
      'Hubungi support jika masalah berlanjut',
      'Restart aplikasi jika perlu'
    ],
    canRetry: true,
  }
}

/**
 * Get transaction error type for programmatic handling
 *
 * @param error - Error object or error message
 * @returns Error type enum value
 */
export function getTransactionErrorType(error: unknown): TransactionErrorType {
  const details = detectTransactionError(error)

  // Map error details to type enum
  switch (details.title) {
    case 'Transaksi Tidak Ditemukan':
      return 'not_found'
    case 'Masalah Koneksi':
      return 'network_error'
    case 'Server Bermasalah':
      return 'server_error'
    case 'Akses Ditolak':
      return 'permission_error'
    case 'Data Tidak Valid':
      return 'validation_error'
    default:
      return 'general_error'
  }
}

/**
 * Check if error is retryable
 *
 * @param error - Error object or error message
 * @returns Whether the error can be retried
 */
export function isRetryableError(error: unknown): boolean {
  const details = detectTransactionError(error)
  return details.canRetry
}

/**
 * Get user-friendly error message
 *
 * @param error - Error object or error message
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const details = detectTransactionError(error)
  return `${details.title}: ${details.description}`
}