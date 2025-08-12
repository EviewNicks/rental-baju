/**
 * Type Consolidation Utilities - Phase 1 Implementation
 * Supporting the field redundancy optimization in kasir feature
 */

import type { 
  TransaksiResponse, 
  TransaksiItemResponse, 
  ProductCore 
} from '../types'

// ==========================================
// TYPE GUARDS
// ==========================================

/**
 * Check if transaction response has detailed items
 */
export function isTransaksiDetail(response: TransaksiResponse): response is TransaksiResponse & { items: TransaksiItemResponse[] } {
  return response.items !== undefined && Array.isArray(response.items)
}

/**
 * Check if transaction response is summary mode
 */
export function isTransaksiSummary(response: TransaksiResponse): response is TransaksiResponse & { itemCount: number } {
  return response.itemCount !== undefined && response.items === undefined
}

/**
 * Check if product has stock information
 */
export function hasProductStock(product: ProductCore): product is ProductCore & { quantity: number; rentedStock: number } {
  return 'quantity' in product && 'rentedStock' in product
}

// ==========================================
// CALCULATED FIELD UTILITIES
// ==========================================

/**
 * Calculate available stock (replaces stored availableStock field)
 * This is Phase 1 implementation - will be moved to service layer in Phase 2
 */
export function calculateAvailableStock(quantity: number, rentedStock: number): number {
  return Math.max(0, quantity - rentedStock)
}

/**
 * Calculate total revenue for a product (replaces stored totalPendapatan field)
 * Note: This will be moved to service layer with database aggregation in Phase 2
 */
export function calculateProductRevenue(
  transactionItems: { subtotal: number; produkId: string }[], 
  productId: string
): number {
  return transactionItems
    .filter(item => item.produkId === productId)
    .reduce((total, item) => total + item.subtotal, 0)
}

// ==========================================
// FIELD MIGRATION CONSTANTS
// ==========================================

/**
 * Field migration mapping for backward compatibility
 * These help maintain API compatibility during transition phases
 */
export const FIELD_MIGRATIONS = {
  PRODUCT_PRICE: {
    OLD: 'pricePerDay',
    NEW: 'hargaSewa', 
    FUTURE: 'currentPrice', // Phase 2 rename for semantic clarity
  },
  TRANSACTION_CODE: {
    OLD: 'transactionCode',  
    NEW: 'kode',
  },
  AVAILABLE_STOCK: {
    OLD: 'availableQuantity', // Legacy field from Product interface
    NEW: 'availableStock', // Current redundant field to be removed
    CALCULATED: 'quantity - rentedStock', // Phase 2 calculation method
  },
  TOTAL_REVENUE: {
    OLD: 'totalPendapatan', // Stored redundant field to be removed
    CALCULATED: 'SUM(TransaksiItem.subtotal) WHERE produkId = ?', // Phase 2 aggregation
  },
} as const

// ==========================================
// VALIDATION UTILITIES
// ==========================================

/**
 * Validate that calculated fields match stored values during transition
 * This helps ensure data consistency during Phase 2 migration
 */
export function validateCalculatedFields(stored: {
  availableStock?: number
  quantity: number
  rentedStock: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (stored.availableStock !== undefined) {
    const calculated = calculateAvailableStock(stored.quantity, stored.rentedStock)
    if (stored.availableStock !== calculated) {
      errors.push(`availableStock mismatch: stored=${stored.availableStock}, calculated=${calculated}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ==========================================
// EXPORT CONFIGURATION
// ==========================================

/**
 * Configuration flags for Phase 1 rollout
 * These can be used to gradually enable new consolidated types
 */
export const PHASE1_CONFIG = {
  USE_CONSOLIDATED_TYPES: true,
  VALIDATE_CALCULATED_FIELDS: true,
  ENABLE_MIGRATION_WARNINGS: false, // Set to true for development
  BACKWARD_COMPATIBILITY_MODE: true,
} as const