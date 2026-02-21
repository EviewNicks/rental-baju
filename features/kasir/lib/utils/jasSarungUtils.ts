/**
 * Jas-Sarung Pairing Utilities
 * Task 16: Updated to use Configurable Category System
 * Utility functions for detecting eligible products and filtering sarung products
 * Now uses configuration-driven approach for future-proof category management
 */

import type { Product, ProductWithCategory, ProductSelection } from '../../types'
import { sarungPairingService } from '../../services/pairingService'
import { 
  SARUNG_GRATIS_ELIGIBLE_CATEGORIES, 
  SARUNG_PAIRING_DISPLAY,
  getAllEligibleCategories,
  isEligibleForSarungGratis
} from '../../config/pairingConfig'

// Re-export types for backward compatibility
export type CategorySarungGratis = typeof SARUNG_GRATIS_ELIGIBLE_CATEGORIES[number]

// Sarung category constants (from configuration)
export const SARUNG_CATEGORY = SARUNG_PAIRING_DISPLAY.freeItemCategory
export const SARUNG_CATEGORY_TYPE = SARUNG_PAIRING_DISPLAY.freeItemCategoryType

/**
 * Get sarung category ID from categories.json
 * This is used for API filtering
 */
export function getSarungCategoryId(): string {
  // Based on categories.json, sarung category ID
  // In production, this should be fetched from API or config
  return 'e03f730b-5290-4281-af43-f37bca6cb32e' // This is the categoryId from sarung.json
}

/**
 * Check if a product category is eligible for free sarung pairing
 * Now uses configurable system for future-proof category management
 * @param product - Product to check
 * @returns true if product category can get free sarung
 */
export function isEligibleForFreeSarung(product: Product | ProductWithCategory): boolean {
  return sarungPairingService.isEligibleForPairing(product)
}

/**
 * Filter products to get only sarung products
 * @param products - Array of products to filter
 * @returns Array of sarung products
 */
export function getSarungProducts(products: Product[]): Product[] {
  return sarungPairingService.getFreeItemsForPairing(products)
}

/**
 * Filter products with category information to get only sarung products
 * @param products - Array of products with category info to filter
 * @returns Array of sarung products
 */
export function getSarungProductsWithCategory(products: ProductWithCategory[]): ProductWithCategory[] {
  return products.filter(product => {
    const categoryName = product.category.name.toLowerCase()
    const categoryType = product.category.type

    return categoryName === SARUNG_CATEGORY && 
           categoryType === SARUNG_CATEGORY_TYPE
  })
}

/**
 * Validate sarung selection for pairing
 * Now uses configurable validation system
 * @param jasProduct - Main product (jas/renda) being paired
 * @param sarungProduct - Selected sarung product
 * @param jasQuantity - Quantity of main product being paired
 * @param sarungQuantity - Requested sarung quantity
 * @returns Validation result with error message if invalid
 */
export function validateSarungSelection(
  jasProduct: Product | ProductWithCategory,
  sarungProduct: Product | ProductWithCategory,
  jasQuantity: number,
  sarungQuantity: number
): { isValid: boolean; error?: string; userMessage?: string } {
  const result = sarungPairingService.validatePairingSelection(
    jasProduct,
    sarungProduct,
    jasQuantity,
    sarungQuantity
  )
  
  return {
    isValid: result.isValid,
    error: result.error,
    userMessage: result.error // For backward compatibility
  }
}

/**
 * Check if a product has available stock for pairing
 * @param product - Product to check
 * @param requestedQuantity - Requested quantity
 * @returns true if product has sufficient stock
 */
export function hasAvailableStock(product: Product, requestedQuantity: number): boolean {
  return sarungPairingService.hasAvailableStock(product, requestedQuantity)
}

/**
 * Create pairing display text for UI
 * @param mainProductName - Name of main product (jas/renda)
 * @param sarungName - Name of sarung product
 * @returns Formatted pairing text
 */
export function createPairingDisplayText(mainProductName: string, sarungName: string): string {
  return sarungPairingService.createPairingDisplayText(mainProductName, sarungName)
}

/**
 * Extract product code for receipt display
 * @param product - Product to extract code from
 * @returns Product code or '-' if not available
 */
export function extractProductCode(product: Product | ProductWithCategory): string {
  return sarungPairingService.extractProductCode(product)
}

/**
 * Check if a product is a linked sarung (free sarung paired with main product)
 * @param productId - ID of product to check
 * @param productSizeId - Size ID of product to check (optional)
 * @param products - Array of products to search for pairing
 * @returns true if product is a linked sarung
 */
export function isLinkedSarung(
  productId: string,
  productSizeId: string | undefined,
  products: ProductSelection[]
): boolean {
  return products.some(mainItem => 
    mainItem.linkedSarung?.productId === productId &&
    mainItem.linkedSarung?.productSizeId === productSizeId
  )
}

// Configuration-driven utility functions for future extensibility

/**
 * Get all eligible categories for pairing
 * @returns Array of eligible category names
 */
export function getEligibleCategories(): string[] {
  return getAllEligibleCategories()
}

/**
 * Get pairing configuration for UI display
 * @returns Current pairing configuration
 */
export function getPairingConfig() {
  return SARUNG_PAIRING_DISPLAY
}

/**
 * Get button text for eligible products
 * @param product - Product to check
 * @param quantity - Current quantity
 * @returns Appropriate button text
 */
export function getPairingButtonText(product: Product, quantity: number = 0): string {
  return sarungPairingService.getButtonText(product, quantity)
}

/**
 * Get badge text for eligible products
 * @returns Badge text from configuration
 */
export function getPairingBadgeText(): string {
  return sarungPairingService.getBadgeText()
}

// Legacy compatibility exports (deprecated - use configuration-driven functions above)
export const CATEGORIES_SARUNG_GRATIS = SARUNG_GRATIS_ELIGIBLE_CATEGORIES

// For backward compatibility with existing validation
export { isEligibleForSarungGratis as isJasProduct }