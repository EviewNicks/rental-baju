/**
 * Error Message Templates
 *
 * Indonesian error message templates with dynamic variable substitution.
 * All messages use formal Indonesian language as per requirements.
 *
 * Requirements: 1.1, 1.2, 9.2, 9.3
 */

import { ErrorCode, ErrorCategory, ErrorContext } from './errorTypes'

/**
 * Error Template Definition
 */
export interface ErrorTemplate {
  message: (context: ErrorContext) => string
  actions: (context: ErrorContext) => string[]
  category: ErrorCategory
}

/**
 * Message Template Functions
 *
 * Each template uses dynamic variable substitution for contextual messages
 * Requirement: 9.3 - Dynamic context variables
 */
const MESSAGE_TEMPLATES: Record<ErrorCode, ErrorTemplate> = {
  // Validation Errors

  /**
   * ERR_VAL_001: Field validation failed
   * Scenario: SC-008
   */
  [ErrorCode.ERR_VAL_001]: {
    message: (ctx: ErrorContext) => {
      if (ctx.field) {
        return `Validasi gagal untuk field: ${ctx.field}. Silakan periksa kembali input Anda.`
      }
      if (ctx.fields && ctx.fields.length > 0) {
        return `Validasi gagal untuk field: ${ctx.fields.join(', ')}. Silakan periksa kembali input Anda.`
      }
      return 'Validasi data gagal. Silakan periksa kembali input Anda.'
    },
    actions: (ctx: ErrorContext) => {
      const suggestions = ['Periksa kembali input data', 'Pastikan format data sesuai']
      if (ctx.field) {
        suggestions.push(`Perbaiki nilai untuk field: ${ctx.field}`)
      }
      return suggestions
    },
    category: 'WARNING',
  },

  /**
   * ERR_VAL_002: Required field missing
   * Scenario: SC-008
   */
  [ErrorCode.ERR_VAL_002]: {
    message: (ctx: ErrorContext) => {
      if (ctx.field) {
        return `Field wajib belum diisi: ${ctx.field}. Silakan lengkapi data tersebut.`
      }
      if (ctx.fields && ctx.fields.length > 0) {
        return `Field wajib belum diisi: ${ctx.fields.join(', ')}. Silakan lengkapi data tersebut.`
      }
      return 'Terdapat field wajib yang belum diisi. Silakan lengkapi semua data yang diperlukan.'
    },
    actions: () => ['Lengkapi semua field wajib', 'Periksa formulir dengan teliti'],
    category: 'WARNING',
  },

  // Stock Errors

  /**
   * ERR_STK_001: Insufficient stock for requested quantity
   * Scenario: SC-001
   * Requirement: 3.2 - Include specific stock details
   *
   * ✅ SIMPLIFIED: User-friendly message format
   */
  [ErrorCode.ERR_STK_001]: {
    message: (ctx: ErrorContext) => {
      const productName = ctx.productName || 'Produk'
      const size = ctx.size ? ` ukuran ${ctx.size}` : ''

      return `Stok ${productName}${size} tidak mencukupi di tanggal tersebut.`
    },
    actions: (ctx: ErrorContext) => {
      const available = ctx.available ?? 0
      const suggestions = []

      if (available > 0) {
        suggestions.push(`Kurangi jumlah menjadi ${available}`)
      }

      suggestions.push('Pilih produk lain')
      suggestions.push('Pilih tanggal lain')
      suggestions.push('Hubungi admin untuk penambahan stok')

      return suggestions
    },
    category: 'CRITICAL',
  },

  /**
   * ERR_STK_002: Product out of stock
   * Scenario: SC-001
   */
  [ErrorCode.ERR_STK_002]: {
    message: (ctx: ErrorContext) => {
      const productName = ctx.productName || 'Produk'
      const size = ctx.size ? ` (Ukuran: ${ctx.size})` : ''
      return `${productName}${size} sedang tidak tersedia (stok habis).`
    },
    actions: () => [
      'Pilih produk lain',
      'Hubungi admin untuk ketersediaan stok',
      'Cek kembali stok dalam beberapa hari',
    ],
    category: 'CRITICAL',
  },

  // Customer Errors

  /**
   * ERR_CUST_001: Customer not found
   * Scenario: SC-002
   */
  [ErrorCode.ERR_CUST_001]: {
    message: () => 'Data pelanggan tidak ditemukan. Silakan pilih pelanggan yang valid.',
    actions: () => [
      'Pilih pelanggan dari dropdown',
      'Tambahkan pelanggan baru jika belum terdaftar',
      'Periksa kembali data pelanggan',
    ],
    category: 'CRITICAL',
  },

  // Product Errors

  /**
   * ERR_PROD_001: Product not found or inactive
   * Scenario: SC-003
   */
  [ErrorCode.ERR_PROD_001]: {
    message: (ctx: ErrorContext) => {
      const productName = ctx.productName || 'Produk'
      return `${productName} tidak ditemukan atau sudah tidak aktif.`
    },
    actions: () => [
      'Pilih produk lain yang tersedia',
      'Periksa katalog produk untuk memastikan ketersediaan',
    ],
    category: 'CRITICAL',
  },

  /**
   * ERR_SIZE_001: Product size not found or inactive
   * Scenario: SC-003
   */
  [ErrorCode.ERR_SIZE_001]: {
    message: (ctx: ErrorContext) => {
      const size = ctx.size || 'Ukuran yang dipilih'
      const productName = ctx.productName || 'produk'
      return `${size} untuk ${productName} tidak ditemukan atau sudah tidak aktif.`
    },
    actions: () => ['Pilih ukuran lain yang tersedia', 'Periksa ketersediaan ukuran produk'],
    category: 'CRITICAL',
  },

  // Date Errors

  /**
   * ERR_DATE_001: Invalid date selected
   * Scenario: SC-004
   */
  [ErrorCode.ERR_DATE_001]: {
    message: (ctx: ErrorContext) => {
      if (ctx.minDate) {
        return `Tanggal sewa tidak valid. Tanggal minimum: ${ctx.minDate}.`
      }
      return 'Tanggal sewa tidak valid. Silakan pilih tanggal yang benar.'
    },
    actions: () => [
      'Pilih tanggal sewa yang valid',
      'Pastikan tanggal sewa tidak di masa lalu',
      'Periksa kembali input tanggal',
    ],
    category: 'WARNING',
  },

  /**
   * ERR_DATE_002: Date conflict with existing transaction
   * Scenario: SC-004
   */
  [ErrorCode.ERR_DATE_002]: {
    message: (ctx: ErrorContext) => {
      const transactionCode = ctx.transactionCode || 'transaksi lain'
      const startDate = ctx.startDate || 'tanggal'
      const endDate = ctx.endDate || 'tanggal'
      return `Konflik tanggal dengan ${transactionCode}. Periode: ${startDate} s/d ${endDate} sudah dipesan.`
    },
    actions: () => [
      'Pilih tanggal lain',
      'Periksa ketersediaan pada tanggal yang berbeda',
      'Hubungi pelanggan terkait untuk konfirmasi',
    ],
    category: 'WARNING',
  },

  // Pairing Errors

  /**
   * ERR_PAIR_001: Jas-Sarung pairing validation failed
   * Scenario: SC-009
   */
  [ErrorCode.ERR_PAIR_001]: {
    message: (ctx: ErrorContext) => {
      const jasName = ctx.jasName || 'Jas'
      const sarungName = ctx.sarungName || 'Sarung'
      return `Kombinasi ${jasName} dengan ${sarungName} tidak valid. Pastikan pasangan jas dan sarung sesuai.`
    },
    actions: () => [
      'Pilih sarung yang sesuai dengan jas',
      'Periksa kembali kombinasi produk',
      'Hapus pasangan jika tidak diperlukan',
    ],
    category: 'WARNING',
  },

  // Database Errors

  /**
   * ERR_DB_001: Database connection timeout
   * Scenario: SC-005
   */
  [ErrorCode.ERR_DB_001]: {
    message: (ctx: ErrorContext) => {
      if (ctx.operation && ctx.duration) {
        return `Koneksi database timeout selama ${ctx.duration}ms pada operasi: ${ctx.operation}. Silakan coba lagi.`
      }
      return 'Koneksi database timeout. Silakan coba lagi.'
    },
    actions: () => [
      'Coba kirim ulang transaksi',
      'Tunggu beberapa saat lalu coba lagi',
      'Hubungi admin jika masalah berlanjut',
    ],
    category: 'CRITICAL',
  },

  /**
   * ERR_DB_002: Database query failed
   * Scenario: SC-005
   */
  [ErrorCode.ERR_DB_002]: {
    message: () => 'Terjadi kesalahan pada database. Silakan coba lagi.',
    actions: () => [
      'Coba kirim ulang transaksi',
      'Tunggu beberapa saat lalu coba lagi',
      'Hubungi admin jika masalah berlanjut',
    ],
    category: 'CRITICAL',
  },

  // Payment Errors

  /**
   * ERR_PAY_001: Payment processing failed
   * Scenario: SC-006
   */
  [ErrorCode.ERR_PAY_001]: {
    message: (ctx: ErrorContext) => {
      const reason = ctx.reason || 'tidak diketahui'
      return `Pembayaran gagal: ${reason}. Transaksi dibatalkan secara otomatis.`
    },
    actions: () => [
      'Coba proses pembayaran ulang',
      'Periksa metode pembayaran',
      'Hubungi payment provider jika masalah berlanjut',
    ],
    category: 'CRITICAL',
  },

  // System Errors

  /**
   * ERR_SYS_001: Internal system error
   * Scenario: SC-007
   */
  [ErrorCode.ERR_SYS_001]: {
    message: () =>
      'Terjadi kesalahan sistem internal. Tim kami telah diberitahu dan sedang menanganinya.',
    actions: () => [
      'Coba lagi dalam beberapa saat',
      'Hubungi admin jika masalah berlanjut',
      'Refresh halaman dan coba lagi',
    ],
    category: 'CRITICAL',
  },

  // Network Errors

  /**
   * ERR_NET_001: Network request failed
   * Scenario: SC-007
   */
  [ErrorCode.ERR_NET_001]: {
    message: () => 'Koneksi jaringan gagal. Periksa koneksi internet Anda dan coba lagi.',
    actions: () => [
      'Periksa koneksi internet',
      'Coba kirim ulang transaksi',
      'Tunggu beberapa saat lalu coba lagi',
    ],
    category: 'CRITICAL',
  },

  // Authentication Errors

  /**
   * ERR_AUTH_001: Authentication or authorization failed
   * Scenario: SC-010
   */
  [ErrorCode.ERR_AUTH_001]: {
    message: () =>
      'Autentikasi atau otorisasi gagal. Anda tidak memiliki izin untuk melakukan operasi ini.',
    actions: () => [
      'Login ulang dengan akun yang benar',
      'Hubungi admin untuk mendapatkan akses',
      'Periksa role dan permissions akun Anda',
    ],
    category: 'CRITICAL',
  },
}

/**
 * Get error template by code
 */
export function getErrorTemplate(code: ErrorCode): ErrorTemplate {
  return MESSAGE_TEMPLATES[code]
}

/**
 * Generate error message with context
 */
export function generateErrorMessage(code: ErrorCode, context: ErrorContext = {}): string {
  const template = getErrorTemplate(code)
  return template.message(context)
}

/**
 * Generate error actions with context
 */
export function generateErrorActions(code: ErrorCode, context: ErrorContext = {}): string[] {
  const template = getErrorTemplate(code)
  return template.actions(context)
}

/**
 * Export all templates for direct access
 */
export { MESSAGE_TEMPLATES as ERROR_TEMPLATES }

/**
 * Retry Configuration
 *
 * Retry settings for retryable errors
 * Requirements: 5.1, 5.4
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
}

/**
 * Retry configurations for each error code
 * null = not retryable
 */
export const RETRY_CONFIGS: Record<ErrorCode, RetryConfig | null> = {
  // Validation Errors - Not retryable (user needs to fix input)
  [ErrorCode.ERR_VAL_001]: null,
  [ErrorCode.ERR_VAL_002]: null,

  // Stock Errors - Not retryable (user needs to change quantity/product)
  [ErrorCode.ERR_STK_001]: null,
  [ErrorCode.ERR_STK_002]: null,

  // Customer Errors - Not retryable (user needs to select valid customer)
  [ErrorCode.ERR_CUST_001]: null,

  // Product Errors - Not retryable (user needs to select valid product)
  [ErrorCode.ERR_PROD_001]: null,
  [ErrorCode.ERR_SIZE_001]: null,

  // Date Errors - Not retryable (user needs to change dates)
  [ErrorCode.ERR_DATE_001]: null,
  [ErrorCode.ERR_DATE_002]: null,

  // Pairing Errors - Not retryable (user needs to fix pairing)
  [ErrorCode.ERR_PAIR_001]: null,

  // Database Errors - Retryable with exponential backoff
  [ErrorCode.ERR_DB_001]: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
  },
  [ErrorCode.ERR_DB_002]: {
    maxAttempts: 2,
    baseDelay: 1500,
    maxDelay: 6000,
    backoffMultiplier: 2,
  },

  // Payment Errors - Retryable (payment service might be temporarily down)
  [ErrorCode.ERR_PAY_001]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffMultiplier: 2,
  },

  // System Errors - Retryable (might be temporary issue)
  [ErrorCode.ERR_SYS_001]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 4000,
    backoffMultiplier: 2,
  },

  // Network Errors - Retryable with exponential backoff
  [ErrorCode.ERR_NET_001]: {
    maxAttempts: 3,
    baseDelay: 1500,
    maxDelay: 8000,
    backoffMultiplier: 2,
  },

  // Authentication Errors - Not retryable (user needs to re-authenticate)
  [ErrorCode.ERR_AUTH_001]: null,
}

/**
 * Check if error code is retryable
 */
export function isRetryable(code: ErrorCode): boolean {
  return RETRY_CONFIGS[code] !== null
}

/**
 * Get retry configuration for error code
 */
export function getRetryConfig(code: ErrorCode): RetryConfig | null {
  return RETRY_CONFIGS[code]
}

/**
 * Calculate retry delay with exponential backoff and jitter
 * Requirement: 5.1 - Exponential backoff
 */
export function calculateRetryDelay(code: ErrorCode, attempt: number): number | null {
  const config = RETRY_CONFIGS[code]
  if (!config) return null

  // Exponential backoff: baseDelay * (2 ^ (attempt - 1))
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay)

  // Add jitter (±10%) to prevent thundering herd
  const jitter = Math.random() * 0.2 * cappedDelay - 0.1 * cappedDelay

  return Math.floor(cappedDelay + jitter)
}
