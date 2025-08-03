/**
 * Pickup Utilities - TSK-22
 * Utility functions for pickup status calculations and validation
 */

import type { TransactionDetail } from '../../types'

/**
 * Calculate comprehensive pickup status for a transaction
 */
export function calculateTransactionPickupStatus(transaction: TransactionDetail) {
  if (!transaction.products || transaction.products.length === 0) {
    return {
      hasRemainingItems: false,
      totalItems: 0,
      totalPickedUp: 0,
      totalRemaining: 0,
      completionPercentage: 0,
    }
  }

  const totalItems = transaction.products.reduce((sum, product) => sum + product.quantity, 0)
  const totalPickedUp = transaction.products.reduce((sum, product) => sum + (product.jumlahDiambil || 0), 0)
  const totalRemaining = totalItems - totalPickedUp
  const completionPercentage = totalItems > 0 ? Math.round((totalPickedUp / totalItems) * 100) : 0

  return {
    hasRemainingItems: totalRemaining > 0,
    totalItems,
    totalPickedUp,
    totalRemaining,
    completionPercentage,
  }
}

/**
 * Check if pickup is available for a transaction
 */
export function isPickupAvailable(transaction: TransactionDetail): boolean {
  // Pickup is available if transaction is active and has remaining items
  if (transaction.status !== 'active') {
    return false
  }

  if (!transaction.products || transaction.products.length === 0) {
    return false
  }

  // Check if any product has remaining quantity to pick up
  return transaction.products.some(product => {
    const remainingQuantity = product.quantity - (product.jumlahDiambil || 0)
    return remainingQuantity > 0
  })
}