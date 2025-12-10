/**
 * Shared status utility functions for kasir feature
 * Provides consistent status calculation logic across components
 */

import type { TransaksiItemResponse } from '../../types'
import { logger } from '@/services/logger'

/**
 * Check if a transaction has any items that have been picked up
 * Useful for determining pickup status without full status calculation
 *
 * @param items - Transaction items array
 * @returns true if any items have jumlahDiambil > 0
 */
export function hasPickupItems(items: TransaksiItemResponse[]): boolean {
  return items.some((item) => item.jumlahDiambil > 0)
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
