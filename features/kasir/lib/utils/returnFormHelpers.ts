import type { TransaksiDetail, TransaksiItemResponse } from '../../types'

/**
 * Helper functions for return form processing
 */

// Standard condition options from backend schema
export const CONDITION_OPTIONS = [
  'Baik - tidak ada kerusakan',
  'Baik - sedikit kotor/kusut', 
  'Cukup - ada noda ringan',
  'Cukup - ada kerusakan kecil',
  'Buruk - ada noda berat',
  'Buruk - ada kerusakan besar',
  'Hilang/tidak dikembalikan'
] as const

export type ConditionOption = typeof CONDITION_OPTIONS[number]

/**
 * Check if a condition indicates a lost item
 */
export function isLostItemCondition(kondisiAkhir: string): boolean {
  const normalized = kondisiAkhir.toLowerCase()
  return normalized.includes('hilang') || normalized.includes('tidak dikembalikan')
}

/**
 * Get returnable items from a transaction
 */
export function getReturnableItems(transaction: TransaksiDetail): TransaksiItemResponse[] {
  return transaction.items?.filter(item => 
    item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap'
  ) || []
}

/**
 * Check if a transaction can be returned
 */
export function canReturnTransaction(transaction: TransaksiDetail): boolean {
  return (
    transaction.status === 'active' && 
    getReturnableItems(transaction).length > 0
  )
}

/**
 * Calculate late days for penalty
 */
export function calculateLateDays(expectedReturnDate: string | Date): number {
  const today = new Date()
  const expected = new Date(expectedReturnDate)
  
  const diffTime = today.getTime() - expected.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Get penalty rates based on condition
 */
export const PENALTY_RATES = {
  DAILY_LATE: 5000, // Rp 5,000 per day
  CONDITION: {
    baik: 0,
    cukup: 5000, // 1x daily rate
    buruk: 20000, // 4x daily rate
    hilang: 150000 // Default, will use modalAwal if available
  }
} as const

/**
 * Calculate condition penalty for an item
 */
export function calculateConditionPenalty(
  kondisiAkhir: string,
  quantity: number,
  modalAwal?: number
): number {
  const normalized = kondisiAkhir.toLowerCase()
  
  if (isLostItemCondition(kondisiAkhir)) {
    // Use modalAwal if available, otherwise default
    return modalAwal || PENALTY_RATES.CONDITION.hilang
  }
  
  if (normalized.includes('buruk')) {
    return PENALTY_RATES.CONDITION.buruk * quantity
  }
  
  if (normalized.includes('cukup')) {
    return PENALTY_RATES.CONDITION.cukup * quantity
  }
  
  return PENALTY_RATES.CONDITION.baik * quantity
}

/**
 * Calculate late penalty for an item
 */
export function calculateLatePenalty(
  lateDays: number,
  quantity: number
): number {
  return lateDays * PENALTY_RATES.DAILY_LATE * quantity
}

/**
 * Validate item condition for return
 */
export interface ItemConditionValidation {
  isValid: boolean
  error?: string
}

export function validateItemCondition(
  itemId: string,
  kondisiAkhir: string,
  jumlahKembali: number,
  maxQuantity: number
): ItemConditionValidation {
  // Check if condition is provided
  if (!kondisiAkhir || kondisiAkhir.trim() === '') {
    return {
      isValid: false,
      error: 'Kondisi barang harus dipilih'
    }
  }

  // Check for lost items
  if (isLostItemCondition(kondisiAkhir)) {
    if (jumlahKembali !== 0) {
      return {
        isValid: false,
        error: 'Barang hilang harus memiliki jumlah kembali = 0'
      }
    }
  } else {
    // For normal items
    if (jumlahKembali < 1) {
      return {
        isValid: false,
        error: 'Jumlah kembali minimal 1 untuk barang yang dikembalikan'
      }
    }
    
    if (jumlahKembali > maxQuantity) {
      return {
        isValid: false,
        error: `Jumlah kembali tidak bisa lebih dari ${maxQuantity}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Get condition color for UI styling
 */
export function getConditionColor(condition: string): string {
  const normalized = condition.toLowerCase()
  
  if (normalized.includes('hilang')) return 'text-red-600 bg-red-50'
  if (normalized.includes('buruk')) return 'text-orange-600 bg-orange-50'
  if (normalized.includes('cukup')) return 'text-yellow-600 bg-yellow-50'
  if (normalized.includes('baik')) return 'text-green-600 bg-green-50'
  
  return 'text-gray-600 bg-gray-50'
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Generate return request payload
 */
export interface ReturnRequestPayload {
  items: Array<{
    itemId: string
    kondisiAkhir: string
    jumlahKembali: number
  }>
  catatan?: string
  tglKembali: string
}

export function generateReturnRequestPayload(
  itemConditions: Record<string, { kondisiAkhir: string; jumlahKembali: number }>,
  notes?: string
): ReturnRequestPayload {
  return {
    items: Object.entries(itemConditions).map(([itemId, condition]) => ({
      itemId,
      kondisiAkhir: condition.kondisiAkhir,
      jumlahKembali: condition.jumlahKembali
    })),
    catatan: notes?.trim() || undefined,
    tglKembali: new Date().toISOString()
  }
}

/**
 * Calculate transaction return eligibility
 */
export interface ReturnEligibility {
  canReturn: boolean
  reason?: string
  returnableItemsCount: number
}

export function checkReturnEligibility(transaction: TransaksiDetail): ReturnEligibility {
  if (transaction.status !== 'active') {
    return {
      canReturn: false,
      reason: 'Status transaksi bukan active',
      returnableItemsCount: 0
    }
  }

  const returnableItems = getReturnableItems(transaction)
  
  if (returnableItems.length === 0) {
    return {
      canReturn: false,
      reason: 'Tidak ada barang yang dapat dikembalikan',
      returnableItemsCount: 0
    }
  }

  return {
    canReturn: true,
    returnableItemsCount: returnableItems.length
  }
}