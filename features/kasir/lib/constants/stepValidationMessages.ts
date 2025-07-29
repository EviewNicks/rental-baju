/**
 * Step validation messages for transaction form
 * Centralized for consistency and i18n readiness
 */

export interface StepValidationMessage {
  title: string
  message: string
  helpText?: string
}

export const STEP_VALIDATION_MESSAGES: Record<number, StepValidationMessage> = {
  1: {
    title: 'Pilih Produk',
    message: 'Silakan pilih minimal satu produk untuk melanjutkan ke tahap berikutnya.',
    helpText: 'Anda dapat memilih beberapa produk sekaligus dengan jumlah yang berbeda.'
  },
  2: {
    title: 'Data Penyewa Diperlukan',
    message: 'Pilih atau daftarkan data penyewa untuk melanjutkan.',
    helpText: 'Data penyewa digunakan untuk identifikasi dan kontak selama masa penyewaan.'
  },
  3: {
    title: 'Lengkapi Informasi Pembayaran',
    message: 'Pastikan tanggal penyewaan dan metode pembayaran sudah dipilih.',
    helpText: 'Informasi pembayaran akan digunakan untuk proses transaksi dan pencatatan keuangan.'
  }
} as const

/**
 * Get validation message for a specific step
 */
export function getStepValidationMessage(step: number): StepValidationMessage | null {
  return STEP_VALIDATION_MESSAGES[step] || null
}

/**
 * Check if a step has validation message
 */
export function hasStepValidationMessage(step: number): boolean {
  return step in STEP_VALIDATION_MESSAGES
}