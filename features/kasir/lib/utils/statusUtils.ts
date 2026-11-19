/**
 * Shared status utility functions for kasir feature — Single Source of Truth
 *
 * Provides deterministic, consistent transaction status resolution across
 * backend services, API routes, dashboard list, dashboard stats, detail page,
 * and return page.
 *
 * Priority Order in resolveTransactionStatus():
 * 1. Final terminal states: 'cancelled', 'selesai'
 * 2. Unresolved lost items: 'pending_resolution'
 * 3. All picked-up items fully returned: 'selesai' (overrides 'terlambat')
 * 4. Overdue: explicit 'terlambat' OR picked-up transaction past tglSelesai (H+1, date-only)
 * 5. Picked-up (ANY item jumlahDiambil > 0): 'diambil'
 * 6. Fallback: baseStatus
 */

import type { TransactionStatus, TransaksiItemResponse } from '../../types'
import { logger } from '@/services/logger'

export interface StatusCalculableReturnCondition {
  kondisiAkhir?: string | null
  resolutionStatus?: string | null
}

export interface StatusCalculableItem {
  jumlah?: number
  jumlahDiambil?: number
  statusKembali?: string | null
  returnConditions?: StatusCalculableReturnCondition[]
  conditionBreakdown?: StatusCalculableReturnCondition[]
}

/**
 * Check if a transaction has any items that have been picked up (ANY-item rule)
 *
 * @param items - Transaction items array
 * @returns true if any item has jumlahDiambil > 0
 */
export function hasPickupItems(items?: StatusCalculableItem[] | TransaksiItemResponse[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.some((item) => (item.jumlahDiambil || 0) > 0)
}

/**
 * Check if any item has an unresolved lost (HILANG) return record
 */
export function hasUnresolvedLostItems(items?: StatusCalculableItem[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false

  return items.some((item) => {
    const conditions = item.returnConditions ?? item.conditionBreakdown
    if (!Array.isArray(conditions) || conditions.length === 0) return false

    return conditions.some((condition) => {
      const isLost = condition.kondisiAkhir?.toLowerCase().includes('hilang') ?? false
      const isUnresolved = !condition.resolutionStatus
      return isLost && isUnresolved
    })
  })
}

/**
 * Check if return condition records are present on the provided items
 */
function hasLoadedReturnConditionData(items?: StatusCalculableItem[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.some(
    (item) =>
      (Array.isArray(item.returnConditions) && item.returnConditions.length > 0) ||
      (Array.isArray(item.conditionBreakdown) && item.conditionBreakdown.length > 0),
  )
}

/**
 * Check if all picked-up items have been fully returned (statusKembali === 'lengkap').
 * Items that were never picked up (jumlahDiambil === 0, e.g. bonus/unpicked items)
 * do NOT block a transaction from being marked 'selesai'.
 */
export function areAllPickedUpItemsReturned(items?: StatusCalculableItem[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false

  const pickedUpItems = items.filter((item) => (item.jumlahDiambil || 0) > 0)

  if (pickedUpItems.length > 0) {
    return pickedUpItems.every((item) => item.statusKembali === 'lengkap')
  }

  // Legacy fallback: if no pickup counts exist, only complete if every item is explicitly 'lengkap'
  return items.every((item) => item.statusKembali === 'lengkap')
}

/**
 * Check if a date is strictly past the due date using date-only normalization (YYYY-MM-DD).
 * Same-day returns (today === dueDay) are NOT considered overdue; overdue starts on H+1.
 */
export function isOverdue(endDate?: string | Date | null, now: Date = new Date()): boolean {
  if (!endDate) return false

  const dueDate = typeof endDate === 'string' ? new Date(endDate) : endDate
  if (isNaN(dueDate.getTime())) return false

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

  return today > dueDay
}

/**
 * Single Source of Truth for resolving a transaction's effective status.
 *
 * @param baseStatus - Raw status stored in database
 * @param items - Transaction items (full list, never truncated)
 * @param endDate - Transaction due date (tglSelesai)
 * @param now - Optional reference date (defaults to current date for deterministic testing)
 */
export function resolveTransactionStatus(
  baseStatus: TransactionStatus,
  items?: StatusCalculableItem[],
  endDate?: string | Date | null,
  now: Date = new Date(),
): TransactionStatus {
  // Priority 1: Final terminal states
  if (baseStatus === 'cancelled') {
    return 'cancelled'
  }
  if (baseStatus === 'selesai') {
    return 'selesai'
  }

  // Priority 2: Unresolved lost items (pending_resolution)
  if (hasUnresolvedLostItems(items)) {
    return 'pending_resolution'
  }
  // If DB is already 'pending_resolution' and return condition details were not loaded
  // (e.g. lightweight queries), preserve 'pending_resolution' rather than overriding it.
  if (baseStatus === 'pending_resolution' && !hasLoadedReturnConditionData(items)) {
    return 'pending_resolution'
  }

  // Priority 3: All picked-up items fully returned -> 'selesai'
  // Runs BEFORE overdue checks so returned transactions (including previously 'terlambat')
  // always resolve to 'selesai'.
  if (
    baseStatus === 'active' ||
    baseStatus === 'diambil' ||
    baseStatus === 'terlambat' ||
    baseStatus === 'pending_resolution'
  ) {
    if (areAllPickedUpItemsReturned(items)) {
      return 'selesai'
    }
  }

  // Priority 4: Overdue ('terlambat')
  // Explicit 'terlambat' (not yet returned) stays 'terlambat'.
  if (baseStatus === 'terlambat') {
    return 'terlambat'
  }

  // Dynamic overdue applies ONLY to transactions that have been picked up
  // (status === 'diambil' OR at least one item has jumlahDiambil > 0).
  // Unpicked bookings (active with jumlahDiambil === 0) stay 'active'.
  const isPickedUp = baseStatus === 'diambil' || hasPickupItems(items)
  if (
    (baseStatus === 'active' || baseStatus === 'diambil') &&
    isPickedUp &&
    isOverdue(endDate, now)
  ) {
    return 'terlambat'
  }

  // Priority 5: Unified ANY-item pickup rule ('diambil')
  if (baseStatus === 'active' && hasPickupItems(items)) {
    return 'diambil'
  }

  // Priority 6: Fallback to base status
  return baseStatus
}

/**
 * Backward-compatible alias for resolveTransactionStatus
 */
export const calculateEnhancedStatus = resolveTransactionStatus

/**
 * Validate if items array contains valid pickup data for status calculation
 * Used to determine if enhanced status calculation can be performed reliably
 *
 * @param items - Transaction items array to validate
 * @returns true if items contain valid pickup information
 */
export function hasValidItemData(items?: TransaksiItemResponse[]): boolean {
  const log = logger.child('statusUtils')

  if (!Array.isArray(items)) {
    log.debug('hasValidItemData', 'Items is not an array', {
      itemsType: typeof items,
      isValid: false,
    })
    return false
  }

  if (items.length === 0) {
    log.debug('hasValidItemData', 'Items array is empty', {
      itemCount: 0,
      isValid: false,
    })
    return false
  }

  const hasPickupData = items.every(
    (item) => item && typeof item === 'object' && typeof item.jumlahDiambil === 'number',
  )

  const pickupInfo = items.map((item) => ({
    hasJumlahDiambil: typeof item?.jumlahDiambil === 'number',
    jumlahDiambil: item?.jumlahDiambil,
    itemType: typeof item,
  }))

  log.debug('hasValidItemData', 'Item data validation completed', {
    itemCount: items.length,
    hasPickupData,
    isValid: hasPickupData,
    itemDetails: pickupInfo,
  })

  return hasPickupData
}
