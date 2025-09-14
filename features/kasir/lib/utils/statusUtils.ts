/**
 * Shared status utility functions for kasir feature
 * Provides consistent status calculation logic across components
 */

import type { TransactionStatus, TransaksiItemResponse } from '../../types'

/**
 * Calculate enhanced transaction status based on pickup status and business rules
 * Priority: terlambat > cancelled > selesai > diambil > active
 *
 * @param baseStatus - Original status from API
 * @param items - Transaction items array to check pickup status
 * @param endDate - Optional end date to check for overdue status
 * @returns Enhanced status based on business logic
 */
export function calculateEnhancedStatus(
  baseStatus: TransactionStatus,
  items: TransaksiItemResponse[],
  endDate?: string
): TransactionStatus {
  // Priority 1: Check if overdue (terlambat)
  if (baseStatus === 'terlambat') {
    return 'terlambat'
  }

  // Check if current date is past end date (manual overdue check)
  if (endDate && baseStatus === 'active') {
    const now = new Date()
    const dueDate = new Date(endDate)
    if (now > dueDate) {
      return 'terlambat'
    }
  }

  // Priority 2: Check if cancelled
  if (baseStatus === 'cancelled') {
    return 'cancelled'
  }

  // Priority 3: Check if completed (selesai - all items returned)
  if (baseStatus === 'selesai') {
    return 'selesai'
  }

  // Priority 4: Check if any items have been picked up
  if (baseStatus === 'active') {
    const hasPickup = items.some(item => item.jumlahDiambil > 0)
    if (hasPickup) {
      return 'diambil'
    }
  }

  // Default: return original status
  return baseStatus
}

/**
 * Check if a transaction has any items that have been picked up
 * Useful for determining pickup status without full status calculation
 *
 * @param items - Transaction items array
 * @returns true if any items have jumlahDiambil > 0
 */
export function hasPickupItems(items: TransaksiItemResponse[]): boolean {
  return items.some(item => item.jumlahDiambil > 0)
}

/**
 * Check if a transaction is overdue based on end date
 *
 * @param endDate - Transaction end date
 * @returns true if current date is past end date
 */
export function isOverdue(endDate?: string): boolean {
  if (!endDate) return false

  const now = new Date()
  const dueDate = new Date(endDate)
  return now > dueDate
}