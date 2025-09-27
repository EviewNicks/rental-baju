/**
 * Size Management Utilities
 * Provides backward compatibility and unified interfaces for legacy and advanced sizing
 */

import type {
  Product,
  ClientProduct,
  ProductSize,
  AgeCategory,
  SizeEnum,
  EnhancedClientProduct,
} from '../../types'

/**
 * Size mode detection for a product
 */
export type SizeMode = 'legacy' | 'advanced' | 'none'

/**
 * Detect the size mode of a product
 */
export function getProductSizeMode(product: Product | ClientProduct): SizeMode {
  // Check if product has advanced sizing (sizes array with entries)
  if (product.sizes && product.sizes.length > 0) {
    return 'advanced'
  }

  // Legacy sizing no longer supported - all products use advanced sizing

  // No sizing
  return 'none'
}

/**
 * Get display sizes for a product (unified interface)
 */
export function getDisplaySizes(product: Product | ClientProduct): string[] {
  const mode = getProductSizeMode(product)

  switch (mode) {
    case 'advanced':
      return product.sizes.map((size) => `${size.ageCategory}-${size.size}`)
    case 'legacy':
    case 'none':
    default:
      return []
  }
}

/**
 * Get formatted size display string
 */
export function getFormattedSizeDisplay(product: Product | ClientProduct): string {
  const sizes = getDisplaySizes(product)

  if (sizes.length === 0) {
    return 'Tidak ada ukuran'
  }

  if (sizes.length === 1 && !sizes[0].includes('-')) {
    return sizes[0] // Legacy single size
  }

  // Group by age category for advanced sizing
  const grouped = groupSizesByCategory(sizes)
  return Object.entries(grouped)
    .map(([category, categorySizes]) => `${category}: ${categorySizes.join(', ')}`)
    .join(' | ')
}

/**
 * Group sizes by age category
 */
function groupSizesByCategory(sizes: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}

  sizes.forEach((sizeStr) => {
    if (sizeStr.includes('-')) {
      const [category, size] = sizeStr.split('-')
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(size)
    } else {
      // Legacy format
      if (!grouped['UNKNOWN']) {
        grouped['UNKNOWN'] = []
      }
      grouped['UNKNOWN'].push(sizeStr)
    }
  })

  return grouped
}

/**
 * Get total quantity for a product (unified interface)
 */
export function getTotalQuantity(product: Product | ClientProduct): number {
  const mode = getProductSizeMode(product)

  switch (mode) {
    case 'advanced':
      return product.sizes.reduce((total, size) => total + size.quantity, 0)
    case 'legacy':
    case 'none':
      return product.quantity
  }
}

/**
 * Check if product has sizes (unified interface)
 */
export function hasProductSizes(product: Product | ClientProduct): boolean {
  const mode = getProductSizeMode(product)
  return mode === 'advanced' || mode === 'legacy'
}

/**
 * Convert legacy product to enhanced product with size helpers
 */
export function enhanceClientProduct(product: ClientProduct): EnhancedClientProduct {
  const sizeMode = getProductSizeMode(product)
  const displaySizes = getDisplaySizes(product)

  return {
    ...product,
    hasAdvancedSizing: sizeMode === 'advanced',
    sizeMode: 'advanced' as const, // Advanced-only architecture
    displaySizes,
  }
}

/**
 * Create size summary for product listing
 */
export function createSizeSummary(product: Product | ClientProduct): {
  mode: SizeMode
  count: number
  display: string
  hasStock: boolean
} {
  const mode = getProductSizeMode(product)
  const displaySizes = getDisplaySizes(product)
  const totalQuantity = getTotalQuantity(product)

  return {
    mode,
    count: displaySizes.length,
    display: getFormattedSizeDisplay(product),
    hasStock: totalQuantity > 0,
  }
}

/**
 * Validate size compatibility between legacy and advanced modes
 */
export function validateSizeCompatibility(
  product: Product | ClientProduct,
  newSizes?: ProductSize[],
): { isCompatible: boolean; warnings: string[] } {
  const warnings: string[] = []
  const currentMode = getProductSizeMode(product)

  // Legacy sizing no longer supported - all products use advanced sizing

  // If switching from advanced to legacy
  if (currentMode === 'advanced' && (!newSizes || newSizes.length === 0)) {
    warnings.push('Semua data ukuran lanjutan akan dihapus')
  }

  return {
    isCompatible: true, // Allow all transitions for flexibility
    warnings,
  }
}

/**
 * Migration helper: Convert legacy size to advanced sizes
 * NOTE: Legacy sizing is no longer supported - all products use advanced sizing
 */
export function migrateLegacySizeToAdvanced(): ProductSize[] {
  // Legacy sizing no longer supported - return empty array
  return []
}

/**
 * Check if size value is valid for the system
 */
export function isValidSizeValue(size: string): size is SizeEnum {
  const validSizes: SizeEnum[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  return validSizes.includes(size.toUpperCase() as SizeEnum)
}

/**
 * Check if age category is valid
 */
export function isValidAgeCategory(category: string): category is AgeCategory {
  const validCategories: AgeCategory[] = ['ADULT', 'CHILD', 'UNIVERSAL']
  return validCategories.includes(category.toUpperCase() as AgeCategory)
}

/**
 * Get available sizes for a given age category
 */
export function getAvailableSizes(): SizeEnum[] {
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
}

/**
 * Get available age categories
 */
export function getAvailableAgeCategories(): AgeCategory[] {
  return ['ADULT', 'CHILD', 'UNIVERSAL']
}

/**
 * Format age category for display
 */
export function formatAgeCategory(category: AgeCategory): string {
  const labels: Record<AgeCategory, string> = {
    ADULT: 'Dewasa',
    CHILD: 'Anak',
    UNIVERSAL: 'Universal',
  }

  return labels[category] || category
}

/**
 * Format size for display
 */
export function formatSize(size: SizeEnum): string {
  return size // Sizes are already in display format
}

/**
 * Create default sizes for a new product
 */
export function createDefaultSizes(
  ageCategory: AgeCategory = 'ADULT',
): Omit<ProductSize, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'product'>[] {
  const commonSizes: SizeEnum[] = ['S', 'M', 'L', 'XL']

  return commonSizes.map((size) => ({
    ageCategory,
    size,
    quantity: 1,
    isActive: true,
  }))
}
