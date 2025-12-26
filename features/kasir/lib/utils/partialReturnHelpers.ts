/**
 * Partial Return Utility Functions
 * 
 * Provides utility functions for calculating remaining returnable quantities,
 * return progress, and session numbering for the partial return system.
 * 
 * Requirements: 2.2, 4.5, 5.2
 */

import type { TransaksiDetail, TransaksiItemResponse } from '../../types'

// ==========================================
// INTERFACES
// ==========================================

/**
 * Transaction item with return condition breakdown
 * Extends TransaksiItemResponse with optional return data
 */
export interface TransaksiItemWithReturns extends TransaksiItemResponse {
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed?: number | null
    resolutionStatus?: string | null
    resolutionDate?: string | null
    createdAt?: string
    createdBy?: string
  }>
}

/**
 * Return progress information for an item
 */
export interface ReturnProgress {
  returned: number
  total: number
  percentage: number
  status: 'pending' | 'partial' | 'complete'
}

/**
 * Remaining quantity calculation result
 */
export interface RemainingQuantityResult {
  itemId: string
  jumlahDiambil: number
  totalReturned: number
  remainingToReturn: number
  canReturn: boolean
}

/**
 * Session information for return tracking
 */
export interface ReturnSessionInfo {
  sessionNumber: number
  totalSessions: number
  isFirstSession: boolean
  isLastSession: boolean
}

/**
 * Partial return state for form management
 */
export interface PartialReturnState {
  remainingQuantities: Record<string, number> // itemId -> remaining quantity
  returnProgress: Record<string, ReturnProgress> // itemId -> progress info
  sessionNumber: number // Current return session number
}

// ==========================================
// REMAINING QUANTITY CALCULATIONS
// ==========================================

/**
 * Calculate total returned quantity for an item from condition breakdown
 * 
 * @param conditionBreakdown - Array of return conditions with quantities
 * @returns Total quantity returned across all conditions
 */
export function calculateTotalReturned(
  conditionBreakdown?: Array<{
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount?: number
  }>
): number {
  if (!conditionBreakdown || conditionBreakdown.length === 0) {
    return 0
  }

  return conditionBreakdown.reduce((total, condition) => {
    return total + (condition.jumlahKembali || 0)
  }, 0)
}

/**
 * Calculate remaining returnable quantity for a single item
 * Formula: jumlahDiambil - totalAlreadyReturned
 * 
 * @param item - Transaction item with pickup and return information
 * @returns Remaining quantity calculation result
 */
export function calculateRemainingQuantity(item: TransaksiItemWithReturns): RemainingQuantityResult {
  const jumlahDiambil = item.jumlahDiambil || 0
  const totalReturned = calculateTotalReturned(item.conditionBreakdown)
  const remainingToReturn = Math.max(0, jumlahDiambil - totalReturned)

  return {
    itemId: item.id,
    jumlahDiambil,
    totalReturned,
    remainingToReturn,
    canReturn: remainingToReturn > 0
  }
}

/**
 * Calculate remaining quantities for all items in a transaction
 * 
 * @param transaction - Transaction with items
 * @returns Map of itemId to remaining quantity
 */
export function calculateRemainingQuantities(
  transaction: TransaksiDetail
): Record<string, number> {
  const remainingQuantities: Record<string, number> = {}

  if (!transaction.items) {
    return remainingQuantities
  }

  transaction.items.forEach(item => {
    const result = calculateRemainingQuantity(item as TransaksiItemWithReturns)
    remainingQuantities[item.id] = result.remainingToReturn
  })

  return remainingQuantities
}

/**
 * Get items that have remaining returnable quantity
 * 
 * @param transaction - Transaction with items
 * @returns Array of items that can still be returned
 */
export function getItemsWithRemainingQuantity(
  transaction: TransaksiDetail
): TransaksiItemWithReturns[] {
  if (!transaction.items) {
    return []
  }

  return (transaction.items as TransaksiItemWithReturns[]).filter(item => {
    const result = calculateRemainingQuantity(item)
    return result.canReturn
  })
}

// ==========================================
// RETURN PROGRESS CALCULATIONS
// ==========================================

/**
 * Calculate return progress for a single item
 * 
 * @param item - Transaction item with return information
 * @returns Return progress information
 */
export function calculateReturnProgress(item: TransaksiItemWithReturns): ReturnProgress {
  const jumlahDiambil = item.jumlahDiambil || 0
  const totalReturned = calculateTotalReturned(item.conditionBreakdown)
  
  // Avoid division by zero
  const percentage = jumlahDiambil > 0 ? (totalReturned / jumlahDiambil) * 100 : 0
  
  let status: ReturnProgress['status']
  if (totalReturned === 0) {
    status = 'pending'
  } else if (totalReturned >= jumlahDiambil) {
    status = 'complete'
  } else {
    status = 'partial'
  }

  return {
    returned: totalReturned,
    total: jumlahDiambil,
    percentage: Math.round(percentage),
    status
  }
}

/**
 * Calculate return progress for all items in a transaction
 * 
 * @param transaction - Transaction with items
 * @returns Map of itemId to return progress
 */
export function calculateAllReturnProgress(
  transaction: TransaksiDetail
): Record<string, ReturnProgress> {
  const progressMap: Record<string, ReturnProgress> = {}

  if (!transaction.items) {
    return progressMap
  }

  transaction.items.forEach(item => {
    progressMap[item.id] = calculateReturnProgress(item as TransaksiItemWithReturns)
  })

  return progressMap
}

/**
 * Calculate overall transaction return progress
 * 
 * @param transaction - Transaction with items
 * @returns Overall progress information
 */
export function calculateTransactionProgress(transaction: TransaksiDetail): ReturnProgress {
  if (!transaction.items || transaction.items.length === 0) {
    return {
      returned: 0,
      total: 0,
      percentage: 0,
      status: 'pending'
    }
  }

  const totalPickedUp = transaction.items.reduce((sum, item) => sum + (item.jumlahDiambil || 0), 0)
  const totalReturned = transaction.items.reduce((sum, item) => {
    return sum + calculateTotalReturned((item as TransaksiItemWithReturns).conditionBreakdown)
  }, 0)

  const percentage = totalPickedUp > 0 ? (totalReturned / totalPickedUp) * 100 : 0
  
  let status: ReturnProgress['status']
  if (totalReturned === 0) {
    status = 'pending'
  } else if (totalReturned >= totalPickedUp) {
    status = 'complete'
  } else {
    status = 'partial'
  }

  return {
    returned: totalReturned,
    total: totalPickedUp,
    percentage: Math.round(percentage),
    status
  }
}

// ==========================================
// SESSION NUMBERING LOGIC
// ==========================================

/**
 * Calculate session number based on existing return records
 * 
 * @param item - Transaction item with return history
 * @returns Current session number (1-based)
 */
export function calculateSessionNumber(item: TransaksiItemWithReturns): number {
  if (!item.conditionBreakdown || item.conditionBreakdown.length === 0) {
    return 1 // First session
  }

  // Count existing return sessions
  // Each entry in conditionBreakdown represents a return session
  return item.conditionBreakdown.length + 1
}

/**
 * Calculate session information for an item
 * 
 * @param item - Transaction item with return history
 * @returns Session information
 */
export function calculateSessionInfo(item: TransaksiItemWithReturns): ReturnSessionInfo {
  const currentSession = calculateSessionNumber(item)
  const totalSessions = item.conditionBreakdown?.length || 0
  
  return {
    sessionNumber: currentSession,
    totalSessions: totalSessions + 1, // Including current session
    isFirstSession: currentSession === 1,
    isLastSession: false // Will be determined after return is processed
  }
}

/**
 * Calculate next session number for a transaction
 * Uses the highest session number across all items
 * 
 * @param transaction - Transaction with items
 * @returns Next session number for the transaction
 */
export function calculateNextSessionNumber(transaction: TransaksiDetail): number {
  if (!transaction.items || transaction.items.length === 0) {
    return 1
  }

  const maxSessionNumber = transaction.items.reduce((max, item) => {
    const sessionNumber = calculateSessionNumber(item as TransaksiItemWithReturns)
    return Math.max(max, sessionNumber)
  }, 1)

  return maxSessionNumber
}

// ==========================================
// PARTIAL RETURN STATE MANAGEMENT
// ==========================================

/**
 * Build complete partial return state for a transaction
 * 
 * @param transaction - Transaction with items
 * @returns Complete partial return state
 */
export function buildPartialReturnState(transaction: TransaksiDetail): PartialReturnState {
  const remainingQuantities = calculateRemainingQuantities(transaction)
  const returnProgress = calculateAllReturnProgress(transaction)
  const sessionNumber = calculateNextSessionNumber(transaction)

  return {
    remainingQuantities,
    returnProgress,
    sessionNumber
  }
}

/**
 * Check if transaction has any items available for partial return
 * 
 * @param transaction - Transaction to check
 * @returns True if any items can be returned
 */
export function hasReturnableItems(transaction: TransaksiDetail): boolean {
  const itemsWithRemaining = getItemsWithRemainingQuantity(transaction)
  return itemsWithRemaining.length > 0
}

/**
 * Validate partial return quantities against remaining amounts
 * 
 * @param requestedQuantities - Map of itemId to requested return quantity
 * @param remainingQuantities - Map of itemId to remaining returnable quantity
 * @returns Validation result with errors if any
 */
export function validatePartialReturnQuantities(
  requestedQuantities: Record<string, number>,
  remainingQuantities: Record<string, number>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  Object.entries(requestedQuantities).forEach(([itemId, requestedQty]) => {
    const remainingQty = remainingQuantities[itemId] || 0

    if (requestedQty <= 0) {
      errors.push(`Item ${itemId}: Jumlah kembali harus lebih dari 0`)
    }

    if (requestedQty > remainingQty) {
      errors.push(
        `Item ${itemId}: Jumlah kembali (${requestedQty}) melebihi sisa yang dapat dikembalikan (${remainingQty})`
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format return progress for display
 * 
 * @param progress - Return progress information
 * @returns Formatted string "returned/total (percentage%)"
 */
export function formatReturnProgress(progress: ReturnProgress): string {
  return `${progress.returned}/${progress.total} (${progress.percentage}%)`
}

/**
 * Format session information for display
 * 
 * @param sessionInfo - Session information
 * @returns Formatted string "Session X of Y"
 */
export function formatSessionInfo(sessionInfo: ReturnSessionInfo): string {
  return `Session ${sessionInfo.sessionNumber} of ${sessionInfo.totalSessions}`
}

/**
 * Get return status badge color based on progress
 * 
 * @param status - Return progress status
 * @returns CSS color class or color value
 */
export function getReturnStatusColor(status: ReturnProgress['status']): string {
  switch (status) {
    case 'pending':
      return 'text-gray-500'
    case 'partial':
      return 'text-yellow-500'
    case 'complete':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}