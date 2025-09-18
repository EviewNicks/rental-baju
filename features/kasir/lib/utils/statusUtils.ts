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
    endDate,
    endDateExists: !!endDate,
    hasPickupFlag: hasPickup,
    hasItems: !!items?.length,
    currentTime: new Date().toISOString()
  })

  // Priority 1: Check if cancelled (immutable status)
  if (baseStatus === 'cancelled') {
    log.debug('calculateEnhancedStatus', 'Status is cancelled', { result: 'cancelled' })
    return 'cancelled'
  }

  log.debug('calculateEnhancedStatus', 'Cancelled check passed, checking completion next')

  // Priority 2: Check if all items have been returned (HIGHEST BUSINESS PRIORITY)
  // Completion overrides ALL other status calculations including explicit database status
  if (items && items.length > 0) {
    const itemStatuses = items.map(item => ({
      statusKembali: item.statusKembali,
      jumlahDiambil: item.jumlahDiambil
    }))

    const allItemsReturned = items.every(item => {
      // Check if this item has been fully returned using statusKembali
      return item.statusKembali === 'lengkap'
    })

    log.debug('calculateEnhancedStatus', 'Checking completion status', {
      baseStatus,
      totalItems: items.length,
      itemStatuses,
      allItemsReturned
    })

    if (allItemsReturned) {
      log.info('calculateEnhancedStatus', 'All items returned, marking as selesai (HIGHEST PRIORITY)', {
        result: 'selesai',
        baseStatus,
        totalItems: items.length,
        returnStatuses: items.map(item => item.statusKembali),
        businessRule: 'completion-overrides-all-status'
      })
      return 'selesai'
    } else {
      log.debug('calculateEnhancedStatus', 'Not all items returned, continuing status checks', {
        totalItems: items.length,
        itemDetails: items.map(item => ({
          statusKembali: item.statusKembali,
          jumlahDiambil: item.jumlahDiambil
        }))
      })
    }
  }

  // Priority 3: Check if explicit completed status (selesai)
  if (baseStatus === 'selesai') {
    log.debug('calculateEnhancedStatus', 'Status is selesai', { result: 'selesai' })
    return 'selesai'
  }

  // Priority 4: Check if explicit overdue status (terlambat)
  if (baseStatus === 'terlambat') {
    log.debug('calculateEnhancedStatus', 'Status is terlambat', { result: 'terlambat' })
    return 'terlambat'
  }

  // Priority 5: Check if current date is past end date (manual overdue check)
  // This runs AFTER completion check to allow completed transactions to show as 'selesai'
  if (endDate && (baseStatus === 'active' || baseStatus === 'diambil')) {
    const now = new Date()
    const dueDate = new Date(endDate)
    const isOverdue = now > dueDate

    log.debug('calculateEnhancedStatus', 'Checking overdue status', {
      endDate,
      currentDate: now.toISOString(),
      dueDate: !isNaN(dueDate.getTime()) ? dueDate.toISOString() : 'Invalid Date',
      isOverdue,
      daysDifference: Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

    if (isOverdue) {
      log.info('calculateEnhancedStatus', 'Detected overdue transaction (AFTER completion check)', {
        endDate,
        result: 'terlambat',
        reasonCompleted: false,
        statusFlow: 'overdue-detection-after-completion'
      })
      return 'terlambat'
    }
  }

  // Priority 6: Check if any items have been picked up
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
export function hasValidItemData(items?: TransaksiItemResponse[]): boolean {
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