/**
 * KondisiAwal Parser - RPK-51 Size-Aware Transaction System
 *
 * Parses encoded kondisiAwal format: "productSizeId|size|ageCategory|condition"
 * Example: "85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik"
 */

export interface ParsedKondisiAwal {
  productSizeId?: string
  size?: string
  ageCategory?: 'ADULT' | 'CHILD' | 'TODDLER'
  condition?: string
  isLegacyFormat: boolean
}

// Enhanced interface for pairing integration
export interface EnhancedKondisiAwalData extends ParsedKondisiAwal {
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    product?: {
      name: string
      code: string
    }
  }
}

/**
 * Parse kondisiAwal string into structured data
 * Supports both new format (with productSizeId) and legacy format
 */
export function parseKondisiAwal(kondisiAwal?: string | null): ParsedKondisiAwal {
  // Default return for empty/null values
  if (!kondisiAwal) {
    return {
      isLegacyFormat: true,
    }
  }

  // Check if it's the new format (contains UUID + multiple parts)
  const parts = kondisiAwal.split('|')

  // New format: productSizeId|size|ageCategory|condition
  if (parts.length >= 4 && isValidUUID(parts[0])) {
    return {
      productSizeId: parts[0],
      size: parts[1] || undefined,
      ageCategory: (parts[2] as 'ADULT' | 'CHILD' | 'TODDLER') || undefined,
      condition: parts.slice(3).join('|') || undefined, // Join remaining parts for condition
      isLegacyFormat: false,
    }
  }

  // Legacy format: plain text condition
  return {
    condition: kondisiAwal,
    isLegacyFormat: true,
  }
}

/**
 * Format size and age category for display
 */
export function formatSizeWithAge(size?: string, ageCategory?: string): string {
  if (!size && !ageCategory) return 'Tidak ada info ukuran'

  const parts = []
  if (size) parts.push(size)
  if (ageCategory) parts.push(ageCategory)

  return parts.join(' | ')
}

/**
 * Get age category display label
 */
export function getAgeCategoryLabel(ageCategory?: string): string {
  switch (ageCategory) {
    case 'ADULT':
      return 'Dewasa'
    case 'CHILD':
      return 'Anak-anak'
    case 'TODDLER':
      return 'Balita'
    default:
      return ageCategory || 'Tidak diketahui'
  }
}

/**
 * Validate if string is UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Enhanced parseKondisiAwal function with JSON format support for pairing integration
 * Supports both new JSON format (with linkedSarung) and legacy pipe format
 */
export function parseKondisiAwalEnhanced(kondisiAwal?: string | null): EnhancedKondisiAwalData {
  // Default return for empty/null values
  if (!kondisiAwal) {
    return {
      isLegacyFormat: true,
    }
  }

  // Try JSON format first (pairing system)
  try {
    const jsonData = JSON.parse(kondisiAwal)
    if (jsonData.productSizeId) {
      return {
        productSizeId: jsonData.productSizeId,
        size: jsonData.size || undefined,
        ageCategory: (jsonData.ageCategory as 'ADULT' | 'CHILD' | 'TODDLER') || undefined,
        condition: jsonData.condition || undefined,
        linkedSarung: jsonData.linkedSarung,
        isLegacyFormat: false,
      }
    }
  } catch (e) {
    console.error('Error parsing JSON kondisiAwal data:', e)
    // Not JSON, continue to pipe format
  }

  // Fallback to existing pipe-separated format logic
  const parts = kondisiAwal.split('|')
  if (parts.length >= 4 && isValidUUID(parts[0])) {
    return {
      productSizeId: parts[0],
      size: parts[1] || undefined,
      ageCategory: (parts[2] as 'ADULT' | 'CHILD' | 'TODDLER') || undefined,
      condition: parts.slice(3).join('|') || undefined,
      isLegacyFormat: false,
    }
  }

  // Legacy format: plain text condition
  return {
    condition: kondisiAwal,
    isLegacyFormat: true,
  }
}

/**
 * Utility function for pickup service to extract productSizeId
 */
export function extractProductSizeIdEnhanced(kondisiAwal: string | null): string | null {
  const parsed = parseKondisiAwalEnhanced(kondisiAwal)
  return parsed?.productSizeId || null
}
/**
 * Extract product size information for display
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractSizeInfo(item: any): {
  size: string
  ageCategory: string
  hasSizeInfo: boolean
} {
  const parsed = parseKondisiAwal(item.kondisiAwal)

  // Try to get size from parsed data first, then fallback to product.size
  const size = parsed.size || item.product?.size
  const ageCategory = parsed.ageCategory

  return {
    size: size || 'Ukuran tidak tersedia',
    ageCategory: getAgeCategoryLabel(ageCategory),
    hasSizeInfo: !!(size || ageCategory),
  }
}
