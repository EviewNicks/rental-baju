/**
 * Jas-Sarung Pairing Utilities
 * Utility functions for detecting jas products and filtering sarung products
 * Following architecture guidelines from docs/rules/architecture.md
 */

import type { Product, ProductWithCategory, ProductSelection } from '../../types'

// Jas category constants
export const JAS_CATEGORIES = [
  'jas-jaguar',
  'jas-polos', 
  'jas-premium',
  'jas-renda'
] as const

export type JasCategory = typeof JAS_CATEGORIES[number]

// Sarung category constants
export const SARUNG_CATEGORY = 'sarung'
export const SARUNG_CATEGORY_TYPE = 'accessories_age_based'

/**
 * Detect if a product is a jas product based on category name
 * @param product - Product to check
 * @returns true if product is a jas product
 */
export function isJasProduct(product: Product | ProductWithCategory): boolean {
  if (!product.category) {
    return false
  }
  
  const categoryName = typeof product.category === 'string' 
    ? product.category.toLowerCase()
    : product.category.name.toLowerCase()
    
  return categoryName.startsWith('jas-')
}

/**
 * Check if a category name is a valid jas category
 * @param categoryName - Category name to validate
 * @returns true if category is a valid jas category
 */
export function isValidJasCategory(categoryName: string): categoryName is JasCategory {
  return JAS_CATEGORIES.includes(categoryName.toLowerCase() as JasCategory)
}

/**
 * Filter products to get only sarung products
 * @param products - Array of products to filter
 * @returns Array of sarung products
 */
export function getSarungProducts(products: Product[]): Product[] {
  return products.filter(product => {
    // Check category name
    const categoryName = typeof product.category === 'string'
      ? product.category.toLowerCase()
      : product.category

    // Check category type if available
    const categoryType = product.categoryType

    return categoryName === SARUNG_CATEGORY && 
           categoryType === SARUNG_CATEGORY_TYPE
  })
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
 * @param sarungProduct - Selected sarung product
 * @param jasQuantity - Quantity of jas being paired
 * @param sarungQuantity - Requested sarung quantity
 * @returns Validation result with error message if invalid
 */
export function validateSarungSelection(
  sarungProduct: Product | ProductWithCategory,
  jasQuantity: number,
  sarungQuantity: number
): { isValid: boolean; error?: string } {
  // Check if product is actually a sarung
  const categoryName = typeof sarungProduct.category === 'string'
    ? sarungProduct.category.toLowerCase()
    : sarungProduct.category.name.toLowerCase()

  if (categoryName !== SARUNG_CATEGORY) {
    return {
      isValid: false,
      error: 'Produk yang dipilih bukan sarung'
    }
  }

  // Check quantity limits
  if (sarungQuantity <= 0) {
    return {
      isValid: false,
      error: 'Jumlah sarung harus lebih dari 0'
    }
  }

  if (sarungQuantity > jasQuantity) {
    return {
      isValid: false,
      error: `Jumlah sarung tidak boleh melebihi jumlah jas (${jasQuantity})`
    }
  }

  return { isValid: true }
}

/**
 * Check if a product has available stock for pairing
 * @param product - Product to check
 * @param requestedQuantity - Requested quantity
 * @returns true if product has sufficient stock
 */
export function hasAvailableStock(product: Product, requestedQuantity: number): boolean {
  const availableQuantity = product.availableQuantity || 0
  return availableQuantity >= requestedQuantity
}

/**
 * Get display name for jas category
 * @param category - Jas category name
 * @returns Formatted display name
 */
export function getJasCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'jas-jaguar': 'Jas Jaguar',
    'jas-polos': 'Jas Polos',
    'jas-premium': 'Jas Premium',
    'jas-renda': 'Jas Renda'
  }
  
  return categoryMap[category.toLowerCase()] || category
}

/**
 * Create pairing display text for UI
 * @param jasName - Name of jas product
 * @param sarungName - Name of sarung product
 * @returns Formatted pairing text
 */
export function createPairingDisplayText(jasName: string, sarungName: string): string {
  return `${jasName} → dengan ${sarungName}`
}

/**
 * Extract product code for receipt display
 * @param product - Product to extract code from
 * @returns Product code or '-' if not available
 */
export function extractProductCode(product: Product | ProductWithCategory): string {
  return product.code || '-'
}

/**
 * Check if a product is a linked sarung (free sarung paired with jas)
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
  return products.some(jasItem => 
    jasItem.linkedSarung?.productId === productId &&
    jasItem.linkedSarung?.productSizeId === productSizeId
  )
}