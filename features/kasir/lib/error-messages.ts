/**
 * Indonesian Error Messages for Kasir Feature
 * Centralized error message definitions with user-friendly Indonesian text
 */

import { KasirApiError } from '../api'

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Koneksi bermasalah. Silakan periksa internet Anda dan coba lagi.',
  TIMEOUT_ERROR: 'Permintaan memakan waktu terlalu lama. Silakan coba lagi.',
  
  // Server errors
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa saat.',
  SERVICE_UNAVAILABLE: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
  
  // Authentication errors
  UNAUTHORIZED: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  
  // Validation errors - Penyewa
  PENYEWA_NAMA_REQUIRED: 'Nama penyewa wajib diisi.',
  PENYEWA_TELEPON_REQUIRED: 'Nomor telepon wajib diisi.',
  PENYEWA_TELEPON_INVALID: 'Format nomor telepon tidak valid.',
  PENYEWA_TELEPON_DUPLICATE: 'Nomor telepon sudah terdaftar.',
  PENYEWA_ALAMAT_REQUIRED: 'Alamat penyewa wajib diisi.',
  PENYEWA_EMAIL_INVALID: 'Format email tidak valid.',
  PENYEWA_NIK_INVALID: 'Format NIK tidak valid.',
  
  // Validation errors - Transaksi
  TRANSAKSI_PENYEWA_REQUIRED: 'Pilih penyewa terlebih dahulu.',
  TRANSAKSI_ITEMS_REQUIRED: 'Pilih minimal satu produk untuk disewa.',
  TRANSAKSI_ITEM_QUANTITY_INVALID: 'Jumlah produk tidak valid.',
  TRANSAKSI_ITEM_UNAVAILABLE: 'Produk tidak tersedia dalam jumlah yang diminta.',
  TRANSAKSI_DATE_INVALID: 'Tanggal sewa tidak valid.',
  TRANSAKSI_DATE_PAST: 'Tanggal sewa tidak boleh di masa lalu.',
  TRANSAKSI_DURATION_INVALID: 'Durasi sewa harus minimal 1 hari.',
  
  // Validation errors - Pembayaran
  PEMBAYARAN_AMOUNT_REQUIRED: 'Jumlah pembayaran wajib diisi.',
  PEMBAYARAN_AMOUNT_INVALID: 'Jumlah pembayaran tidak valid.',
  PEMBAYARAN_AMOUNT_EXCEEDS: 'Jumlah pembayaran melebihi sisa tagihan.',
  PEMBAYARAN_METHOD_REQUIRED: 'Pilih metode pembayaran.',
  PEMBAYARAN_REFERENCE_REQUIRED: 'Referensi pembayaran wajib diisi untuk metode ini.',
  
  // Business logic errors
  PRODUCT_OUT_OF_STOCK: 'Produk sedang tidak tersedia.',
  PRODUCT_INSUFFICIENT_STOCK: 'Stok produk tidak mencukupi.',
  TRANSACTION_NOT_FOUND: 'Transaksi tidak ditemukan.',
  TRANSACTION_ALREADY_COMPLETED: 'Transaksi sudah diselesaikan.',
  TRANSACTION_CANNOT_BE_CANCELLED: 'Transaksi tidak dapat dibatalkan.',
  CUSTOMER_NOT_FOUND: 'Data penyewa tidak ditemukan.',
  PAYMENT_ALREADY_COMPLETE: 'Pembayaran sudah lunas.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak terduga.',
  INVALID_REQUEST: 'Permintaan tidak valid.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses resource ini.',
  NOT_FOUND: 'Data yang diminta tidak ditemukan.',
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

// Map API error codes to user-friendly messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof KasirApiError) {
    const message = ERROR_MESSAGES[error.code as ErrorCode]
    if (message) {
      return message
    }
    // Return the original message if we have a custom one
    return error.message
  }
  
  if (error instanceof Error) {
    // Handle specific error patterns
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
    
    if (error.message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR
    }
    
    return error.message
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR
}

// Format validation errors for forms
export function formatValidationErrors(
  validationErrors?: Array<{ field: string; message: string }>
): Record<string, string> {
  if (!validationErrors) return {}
  
  const errors: Record<string, string> = {}
  
  validationErrors.forEach(({ field, message }) => {
    // Map API field names to Indonesian
    const fieldMap: Record<string, string> = {
      nama: 'Nama',
      telepon: 'Nomor Telepon',
      alamat: 'Alamat',
      email: 'Email',
      nik: 'NIK',
      jumlah: 'Jumlah',
      metode: 'Metode Pembayaran',
      referensi: 'Referensi',
      catatan: 'Catatan',
      penyewaId: 'Penyewa',
      items: 'Produk',
      durasi: 'Durasi',
      tglMulai: 'Tanggal Mulai',
      tglSelesai: 'Tanggal Selesai',
    }
    
    const displayField = fieldMap[field] || field
    errors[field] = message.replace(field, displayField)
  })
  
  return errors
}

// Check if error is a network/connectivity issue
export function isNetworkError(error: unknown): boolean {
  if (error instanceof KasirApiError) {
    return error.code === 'NETWORK_ERROR'
  }
  
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch')
  }
  
  return false
}

// Check if error is a server issue
export function isServerError(error: unknown): boolean {
  if (error instanceof KasirApiError) {
    return error.code === 'SERVER_ERROR' || 
           error.code === 'SERVICE_UNAVAILABLE'
  }
  
  return false
}

// Check if error is retryable
export function isRetryableError(error: unknown): boolean {
  return isNetworkError(error) || isServerError(error)
}

// Generate user-friendly error titles
export function getErrorTitle(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Masalah Koneksi'
  }
  
  if (isServerError(error)) {
    return 'Masalah Server'
  }
  
  if (error instanceof KasirApiError) {
    if (error.code === 'UNAUTHORIZED') {
      return 'Tidak Diizinkan'
    }
    
    if (error.code === 'FORBIDDEN') {
      return 'Akses Ditolak'
    }
    
    if (error.code === 'NOT_FOUND') {
      return 'Data Tidak Ditemukan'
    }
  }
  
  return 'Terjadi Kesalahan'
}

// Success messages
export const SUCCESS_MESSAGES = {
  PENYEWA_CREATED: 'Data penyewa berhasil disimpan.',
  PENYEWA_UPDATED: 'Data penyewa berhasil diperbarui.',
  TRANSAKSI_CREATED: 'Transaksi berhasil dibuat.',
  TRANSAKSI_UPDATED: 'Transaksi berhasil diperbarui.',
  TRANSAKSI_CANCELLED: 'Transaksi berhasil dibatalkan.',
  PEMBAYARAN_CREATED: 'Pembayaran berhasil diproses.',
  PEMBAYARAN_UPDATED: 'Pembayaran berhasil diperbarui.',
} as const

export type SuccessCode = keyof typeof SUCCESS_MESSAGES

export function getSuccessMessage(code: SuccessCode): string {
  return SUCCESS_MESSAGES[code]
}