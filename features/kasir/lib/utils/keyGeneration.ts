/**
 * Key Generation Utilities for React Components
 * Provides consistent key generation patterns for size-aware products
 */

/**
 * Generate unique React key for products with size-aware support
 * @param productId - Product ID
 * @param productSizeId - Optional ProductSize ID for size variants
 * @param suffix - Optional suffix for different contexts (e.g., 'cart', 'grid')
 * @returns Unique React key string
 */
export function generateProductKey(
  productId: string,
  productSizeId?: string,
  suffix?: string
): string {
  const baseKey = productSizeId ? `${productId}-${productSizeId}` : `${productId}-no-size`
  return suffix ? `${baseKey}-${suffix}` : baseKey
}

/**
 * Generate cart item key for React list rendering
 * @param productId - Product ID
 * @param productSizeId - Optional ProductSize ID
 * @returns Unique cart item key
 */
export function generateCartItemKey(productId: string, productSizeId?: string): string {
  return generateProductKey(productId, productSizeId, 'cart')
}

/**
 * Generate product card key for React list rendering
 * @param productId - Product ID
 * @param productSizeId - Optional ProductSize ID (for selected size context)
 * @returns Unique product card key
 */
export function generateProductCardKey(productId: string, productSizeId?: string): string {
  return generateProductKey(productId, productSizeId, 'card')
}

/**
 * Parse product key to extract productId and productSizeId
 * @param key - Generated key string
 * @returns Parsed components or null if invalid format
 */
export function parseProductKey(key: string): { productId: string; productSizeId?: string } | null {
  const parts = key.split('-')
  if (parts.length < 2) return null

  const productId = parts[0]
  const productSizeId = parts[1] === 'no' && parts[2] === 'size' ? undefined : parts[1]

  return { productId, productSizeId }
}