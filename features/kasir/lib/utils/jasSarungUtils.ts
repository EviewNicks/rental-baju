/**
 * Jas-Sarung Pairing Utilities
 * Utility functions for detecting jas products and filtering sarung products
 * Following architecture guidelines from docs/rules/architecture.md
 */

import type { Product, ProductWithCategory, ProductSelection } from '../../types'

// Categories eligible for free sarung pairing
export const CATEGORIES_SARUNG_GRATIS = [
  'jas-jaguar',
  'jas-polos', 
  'jas-premium',
  'jas-renda',
  'renda',           // Regular renda category
  'renda-premium'    // Premium renda category
] as const

export type CategorySarungGratis = typeof CATEGORIES_SARUNG_GRATIS[number]

// Sarung category constants
export const SARUNG_CATEGORY = 'sarung'
export const SARUNG_CATEGORY_TYPE = 'accessories_age_based'

/**
 * Get sarung category ID from categories.json
 * This is used for API filtering
 */
export function getSarungCategoryId(): string {
  // Based on categories.json, sarung category ID
  // In production, this should be fetched from API or config
  return 'd50fbc08-26f9-499f-bce1-189c7e18a171' // This is the categoryId from sarung.json
}

/**
 * Check if a product category is eligible for free sarung pairing
 * @param product - Product to check
 * @returns true if product category can get free sarung
 */
export function isEligibleForFreeSarung(product: Product | ProductWithCategory): boolean {
  if (!product.category) {
    return false
  }
  
  const categoryName = typeof product.category === 'string' 
    ? product.category.toLowerCase()
    : product.category.name.toLowerCase()
    
  return CATEGORIES_SARUNG_GRATIS.includes(categoryName as CategorySarungGratis)
}


/**
 * Filter products to get only sarung products
 * @param products - Array of products to filter
 * @returns Array of sarung products
 */
export function getSarungProducts(products: Product[]): Product[] {
  return products.filter(product => {
    // Check category name - more flexible approach
    const categoryName = typeof product.category === 'string'
      ? product.category.toLowerCase()
      : product.category

    // Primary check: category name must be 'sarung'
    const isSarungCategory = categoryName === SARUNG_CATEGORY
    
    // Optional check: category type if available (for backward compatibility)
    const hasValidCategoryType = !product.categoryType || product.categoryType === SARUNG_CATEGORY_TYPE
    
    // Debug logging to help identify issues
    if (process.env.NODE_ENV === 'development') {
      console.log(`Product ${product.name}: category=${categoryName}, categoryType=${product.categoryType}, isSarung=${isSarungCategory && hasValidCategoryType}`)
    }

    return isSarungCategory && hasValidCategoryType
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
 * @param mainProductQuantity - Quantity of main product being paired
 * @param sarungQuantity - Requested sarung quantity
 * @returns Validation result with error message if invalid
 */
export function validateSarungSelection(
  sarungProduct: Product | ProductWithCategory,
  mainProductQuantity: number,
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

  if (sarungQuantity > mainProductQuantity) {
    return {
      isValid: false,
      error: `Jumlah sarung tidak boleh melebihi jumlah produk utama (${mainProductQuantity})`
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
 * Create pairing display text for UI
 * @param mainProductName - Name of main product (jas/renda)
 * @param sarungName - Name of sarung product
 * @returns Formatted pairing text
 */
export function createPairingDisplayText(mainProductName: string, sarungName: string): string {
  return `${mainProductName} → dengan ${sarungName}`
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