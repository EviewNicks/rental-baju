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
 * FIXED: Allow returns for both 'active' and 'terlambat' status
 */
export function canReturnTransaction(transaction: TransaksiDetail): boolean {
  return (
    (transaction.status === 'active' || transaction.status === 'terlambat') && 
    getReturnableItems(transaction).length > 0
  )
}

/**
 * Calculate late days for penalty
 */
export function calculateLateDays(expectedReturnDate: string | Date): number {
  const returnDate = typeof expectedReturnDate === 'string' 
    ? new Date(expectedReturnDate) 
    : expectedReturnDate
  
  const today = new Date()
  const diffTime = today.getTime() - returnDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays) // Only positive values (late days)
}

/**
 * Calculate penalty amount based on item price and late days
 */
export function calculatePenaltyAmount(
  hargaSewa: number,
  lateDays: number,
  penaltyPercentage: number = 10 // Default 10%
): number {
  if (lateDays <= 0) return 0
  
  const dailyPenalty = hargaSewa * (penaltyPercentage / 100)
  return dailyPenalty * lateDays
}

/**
 * Calculate total penalty for multiple items
 */
export function calculateTotalPenalty(
  items: Array<{
    hargaSewa: number
    jumlahKembali: number
    lateDays: number
  }>,
  penaltyPercentage: number = 10
): number {
  return items.reduce((total, item) => {
    const itemPenalty = calculatePenaltyAmount(item.hargaSewa, item.lateDays, penaltyPercentage)
    return total + (itemPenalty * item.jumlahKembali)
  }, 0)
}

/**
 * Calculate deposit deduction based on item condition
 */
export function calculateDepositDeduction(kondisiAkhir: string, modalAwal: number): number {
  // Lost items: full deduction
  if (isLostItemCondition(kondisiAkhir)) {
    return modalAwal
  }
  
  const condition = kondisiAkhir.toLowerCase()
  
  // Good condition: no deduction
  if (condition.includes('baik')) {
    return 0
  }
  
  // Fair condition: partial deduction
  if (condition.includes('cukup')) {
    return modalAwal * 0.3 // 30% deduction
  }
  
  // Bad condition: major deduction
  if (condition.includes('buruk')) {
    return modalAwal * 0.7 // 70% deduction
  }
  
  return 0 // Default: no deduction
}

/**
 * Create return form data for an item
 */
export function createReturnFormItem(
  item: TransaksiItemResponse,
  jumlahKembali: number,
  kondisiAkhir: string,
  expectedReturnDate: string | Date
) {
  const lateDays = calculateLateDays(expectedReturnDate)
  const penaltyAmount = calculatePenaltyAmount(item.hargaSewa, lateDays)
  const depositDeduction = calculateDepositDeduction(kondisiAkhir, item.produk.modalAwal || 0)
  
  return {
    transaksiItemId: item.id,
    jumlahKembali,
    kondisiAkhir,
    penaltyAmount: penaltyAmount * jumlahKembali,
    modalAwalUsed: depositDeduction * jumlahKembali,
    lateDays,
    isLost: isLostItemCondition(kondisiAkhir)
  }
}

/**
 * Validate return form data
 */
export function validateReturnForm(items: Array<{
  transaksiItemId: string
  jumlahKembali: number
  jumlahDiambil: number
  kondisiAkhir: string
}>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  items.forEach((item, index) => {
    if (item.jumlahKembali <= 0) {
      errors.push(`Item ${index + 1}: Jumlah kembali harus lebih dari 0`)
    }
    
    if (item.jumlahKembali > item.jumlahDiambil) {
      errors.push(`Item ${index + 1}: Jumlah kembali tidak boleh lebih dari jumlah diambil`)
    }
    
    if (!item.kondisiAkhir) {
      errors.push(`Item ${index + 1}: Kondisi akhir harus dipilih`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

/**
 * Check transaction return eligibility with detailed reasons
 */
export interface ReturnEligibility {
  canReturn: boolean
  reason?: string
  returnableItemsCount: number
}

export function checkReturnEligibility(transaction: TransaksiDetail): ReturnEligibility {
  // FIXED: Allow returns for both 'active' and 'terlambat' status
  if (transaction.status !== 'active' && transaction.status !== 'terlambat') {
    return {
      canReturn: false,
      reason: 'Status transaksi bukan active atau terlambat',
      returnableItemsCount: 0
    }
  }
  
  const returnableItems = getReturnableItems(transaction)
  
  if (returnableItems.length === 0) {
    return {
      canReturn: false,
      reason: 'Tidak ada item yang dapat dikembalikan',
      returnableItemsCount: 0
    }
  }
  
  return {
    canReturn: true,
    returnableItemsCount: returnableItems.length
  }
}

/**
 * Calculate summary for return operation
 */
export interface ReturnSummary {
  totalItemsReturned: number
  totalPenalty: number
  totalDepositDeduction: number
  netRefund: number
  hasLostItems: boolean
}

export function calculateReturnSummary(
  items: Array<{
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed: number
    kondisiAkhir: string
  }>
): ReturnSummary {
  const totalItemsReturned = items.reduce((sum, item) => sum + item.jumlahKembali, 0)
  const totalPenalty = items.reduce((sum, item) => sum + item.penaltyAmount, 0)
  const totalDepositDeduction = items.reduce((sum, item) => sum + item.modalAwalUsed, 0)
  const hasLostItems = items.some(item => isLostItemCondition(item.kondisiAkhir))
  
  // Net refund = initial deposit - penalty - deductions
  const netRefund = Math.max(0, totalDepositDeduction - totalPenalty)
  
  return {
    totalItemsReturned,
    totalPenalty,
    totalDepositDeduction,
    netRefund,
    hasLostItems
  }
}