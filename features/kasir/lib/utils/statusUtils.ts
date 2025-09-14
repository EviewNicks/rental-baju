/**
 * Shared status utility functions for kasir feature
 * Provides consistent status calculation logic across components
 */

import type { TransactionStatus, TransaksiItemResponse } from '../../types'
import { logger } from '@/services/logger'

/**
 * Calculate enhanced transaction status based on pickup status and business rules
 * Priority: terlambat > cancelled > selesai > diambil > active
 *
 * @param baseStatus - Original status from API
 * @param items - Transaction items array to check pickup status
 * @param endDate - Optional end date to check for overdue status
 * @param hasPickup - Optional server-provided pickup flag for performance
 * @returns Enhanced status based on business logic
 */
export function calculateEnhancedStatus(
  baseStatus: TransactionStatus,
  items: TransaksiItemResponse[] | undefined,
  endDate?: string,
  hasPickup?: boolean
): TransactionStatus {
  const log = logger.child('statusUtils')

  log.debug('calculateEnhancedStatus', 'Status calculation started', {
    baseStatus,
    itemsCount: items?.length || 0,
    endDate: !!endDate,
    hasPickupFlag: hasPickup,
    hasItems: !!items?.length
  })

  // Priority 1: Check if overdue (terlambat)
  if (baseStatus === 'terlambat') {
    log.debug('calculateEnhancedStatus', 'Status is terlambat', { result: 'terlambat' })
    return 'terlambat'
  }

  // Check if current date is past end date (manual overdue check)
  if (endDate && baseStatus === 'active') {
    const now = new Date()
    const dueDate = new Date(endDate)
    const isOverdue = now > dueDate

    log.debug('calculateEnhancedStatus', 'Checking overdue status', {
      endDate,
      currentDate: now.toISOString(),
      dueDate: !isNaN(dueDate.getTime()) ? dueDate.toISOString() : 'Invalid Date',
      isOverdue
    })

    if (isOverdue) {
      log.info('calculateEnhancedStatus', 'Detected overdue transaction', {
        endDate,
        result: 'terlambat'
      })
      return 'terlambat'
    }
  }

  // Priority 2: Check if cancelled
  if (baseStatus === 'cancelled') {
    log.debug('calculateEnhancedStatus', 'Status is cancelled', { result: 'cancelled' })
    return 'cancelled'
  }

  // Priority 3: Check if completed (selesai - all items returned)
  if (baseStatus === 'selesai') {
    log.debug('calculateEnhancedStatus', 'Status is selesai', { result: 'selesai' })
    return 'selesai'
  }

  // Priority 4: Check if any items have been picked up
  if (baseStatus === 'active') {
    // Use server flag if available, fallback to item parsing
    const pickupDetected = hasPickup ?? (items?.some(item => item.jumlahDiambil > 0) || false)

    log.debug('calculateEnhancedStatus', 'Checking pickup status', {
      hasPickupFlag: hasPickup,
      itemsAvailable: !!items?.length,
      itemBasedPickup: items?.some(item => item.jumlahDiambil > 0),
      finalPickupDetected: pickupDetected
    })

    if (pickupDetected) {
      log.info('calculateEnhancedStatus', 'Pickup detected, changing to diambil', {
        result: 'diambil',
        source: hasPickup !== undefined ? 'server-flag' : 'item-parsing'
      })
      return 'diambil'
    }
  }

  log.debug('calculateEnhancedStatus', 'Using base status', { result: baseStatus })
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

/**
 * Validate if items array contains valid pickup data for status calculation
 * Used to determine if enhanced status calculation can be performed reliably
 *
 * @param items - Transaction items array to validate
 * @returns true if items contain valid pickup information
 */
export function hasValidItemData(items?: any[]): boolean {
  const log = logger.child('statusUtils')

  if (!Array.isArray(items)) {
    log.debug('hasValidItemData', 'Items is not an array', {
      itemsType: typeof items,
      isValid: false
    })
    return false
  }

  if (items.length === 0) {
    log.debug('hasValidItemData', 'Items array is empty', {
      itemCount: 0,
      isValid: false
    })
    return false
  }

  const hasPickupData = items.every(item =>
    item &&
    typeof item === 'object' &&
    typeof item.jumlahDiambil === 'number'
  )

  const pickupInfo = items.map(item => ({
    hasJumlahDiambil: typeof item?.jumlahDiambil === 'number',
    jumlahDiambil: item?.jumlahDiambil,
    itemType: typeof item
  }))

  log.debug('hasValidItemData', 'Item data validation completed', {
    itemCount: items.length,
    hasPickupData,
    isValid: hasPickupData,
    itemDetails: pickupInfo
  })

  return hasPickupData
}