/**
 * Sarung Pairing Service
 * Simple service for jas-sarung pairing functionality
 * 
 * This service handles the business logic for sarung gratis pairing
 * using configuration from pairingConfig.ts
 */

import type { Product, ProductWithCategory } from '../types'
import { 
  SARUNG_PAIRING_DISPLAY,
  isEligibleForSarungGratis
} from '../config/pairingConfig'

/**
 * Check if a product is eligible for free sarung pairing
 */
export function isEligibleForPairing(product: Product | ProductWithCategory): boolean {
  if (!product.category) {
    return false
  }
  
  const categoryName = typeof product.category === 'string' 
    ? product.category
    : product.category.name
  
  return isEligibleForSarungGratis(categoryName)
}

/**
 * Get display text for pairing button
 */
export function getButtonText(product: Product | ProductWithCategory, quantity: number = 0): string {
  if (!isEligibleForPairing(product)) {
    return quantity === 0 ? 'Tambah ke Keranjang' : `Tambah ${quantity} ke Keranjang`
  }
  
  return quantity === 0 
    ? SARUNG_PAIRING_DISPLAY.buttonText 
    : `Pilih ${quantity} ${SARUNG_PAIRING_DISPLAY.buttonText.split(' ').slice(1).join(' ')}`
}

/**
 * Get badge text for eligible products
 */
export function getBadgeText(): string {
  return SARUNG_PAIRING_DISPLAY.badgeText
}

/**
 * Filter products to get sarung products for pairing
 */
export function getFreeItemsForPairing(products: Product[]): Product[] {
  return products.filter(product => {
    const categoryName = typeof product.category === 'string'
      ? product.category.toLowerCase()
      : product.category

    const hasValidCategory = categoryName === SARUNG_PAIRING_DISPLAY.freeItemCategory
    const hasValidCategoryType = !product.categoryType || 
      product.categoryType === SARUNG_PAIRING_DISPLAY.freeItemCategoryType
    
    return hasValidCategory && hasValidCategoryType
  })
}

/**
 * Validate sarung selection for pairing
 */
export function validatePairingSelection(
  mainProduct: Product | ProductWithCategory,
  freeItem: Product | ProductWithCategory,
  mainQuantity: number,
  freeItemQuantity: number
): { isValid: boolean; error?: string } {
  // Check if main product is eligible
  if (!isEligibleForPairing(mainProduct)) {
    return {
      isValid: false,
      error: `Produk ${mainProduct.name} tidak eligible untuk sarung gratis`
    }
  }

  // Check if free item is sarung
  const freeItemCategory = typeof freeItem.category === 'string'
    ? freeItem.category.toLowerCase()
    : freeItem.category.name.toLowerCase()

  if (freeItemCategory !== SARUNG_PAIRING_DISPLAY.freeItemCategory) {
    return {
      isValid: false,
      error: `Produk yang dipilih bukan sarung yang valid`
    }
  }

  // Check quantity limits
  if (freeItemQuantity <= 0) {
    return {
      isValid: false,
      error: `Jumlah sarung harus lebih dari 0`
    }
  }

  if (freeItemQuantity > mainQuantity) {
    return {
      isValid: false,
      error: `Jumlah sarung tidak boleh melebihi jumlah produk utama (${mainQuantity})`
    }
  }

  return { isValid: true }
}

/**
 * Check if product has available stock for pairing
 */
export function hasAvailableStock(product: Product, requestedQuantity: number): boolean {
  const availableQuantity = product.availableQuantity || 0
  return availableQuantity >= requestedQuantity
}

/**
 * Create pairing display text for UI
 */
export function createPairingDisplayText(mainProductName: string, freeItemName: string): string {
  return `${mainProductName} → dengan ${freeItemName}`
}

/**
 * Extract product code for receipt display
 */
export function extractProductCode(product: Product | ProductWithCategory): string {
  return product.code || '-'
}

// Backward compatibility - create service-like object
export const sarungPairingService = {
  isEligibleForPairing,
  getButtonText,
  getBadgeText,
  getFreeItemsForPairing,
  validatePairingSelection,
  hasAvailableStock,
  createPairingDisplayText,
  extractProductCode,
  getFreeItemCategory: () => SARUNG_PAIRING_DISPLAY.freeItemCategory,
  getFreeItemCategoryType: () => SARUNG_PAIRING_DISPLAY.freeItemCategoryType
}