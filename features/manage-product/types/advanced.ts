/**
 * Advanced-Only Size Management TypeScript Interfaces
 *
 * Clean interfaces for advanced size management system without legacy baggage.
 * These will replace the hybrid interfaces in index.ts during Phase 4.
 */

// Core enums
export type AgeCategory = 'ADULT' | 'CHILD' | 'UNIVERSAL'
export type SizeEnum = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'

// Advanced Product Size - Core Entity
export interface AdvancedProductSize {
  id: string
  productId: string
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Advanced Product - No Legacy Fields
export interface AdvancedProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  currentPrice: number
  modalAwal: number
  status: ProductStatus
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string

  // REQUIRED: Always has sizes (minimum 1)
  sizes: AdvancedProductSize[]

  // Relations
  category: AdvancedCategory
  color?: AdvancedColor
  material?: AdvancedMaterial
}

// Supporting Entities
export interface AdvancedCategory {
  id: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  products: AdvancedProduct[]
}

export interface AdvancedColor {
  id: string
  name: string
  hexCode?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  products: AdvancedProduct[]
}

export interface AdvancedMaterial {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  products: AdvancedProduct[]
}

// === API REQUEST/RESPONSE INTERFACES ===

// Product Size Request
export interface CreateAdvancedProductSizeRequest {
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive?: boolean // default: true
}

export interface UpdateAdvancedProductSizeRequest {
  id?: string
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive?: boolean
}

// Product Requests - Clean Advanced-Only
export interface CreateAdvancedProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number
  currentPrice: number
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  sizes: CreateAdvancedProductSizeRequest[] // REQUIRED - minimum 1
  image?: File
  imageUrl?: string
}

export interface UpdateAdvancedProductRequest {
  name?: string
  description?: string
  modalAwal?: number
  currentPrice?: number
  categoryId?: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  sizes?: UpdateAdvancedProductSizeRequest[]
  image?: File
  imageUrl?: string
}

// === AGGREGATION INTERFACES ===

export interface AdvancedAggregatedSizeView {
  size: SizeEnum
  totalQuantity: number
  breakdown: {
    adult?: number
    child?: number
    universal?: number
  }
  hasMultipleCategories: boolean
  availableForRental: number
}

export interface AdvancedCategoryBreakdown {
  adult: number
  child: number
  universal: number
  total: number
  distribution: {
    adultPercentage: number
    childPercentage: number
    universalPercentage: number
  }
}

export interface AdvancedProductSizeAggregation {
  productId: string
  totalQuantity: number
  aggregatedSizes: AdvancedAggregatedSizeView[]
  categoryBreakdown: AdvancedCategoryBreakdown
  lastCalculated: Date
  metadata: {
    calculatedAt: Date
    fromCache: boolean
    calculationTimeMs: number
    performance: 'excellent' | 'good' | 'needs_attention' | 'critical'
  }
}

// === VALIDATION INTERFACES ===

export interface AdvancedSizeValidationError {
  field: string
  message: string
  ageCategory?: AgeCategory
  size?: SizeEnum
}

export interface AdvancedSizeValidationResult {
  isValid: boolean
  errors: AdvancedSizeValidationError[]
}

// === FORM INTERFACES ===

export interface AdvancedProductFormData {
  code: string
  name: string
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  sizes: CreateAdvancedProductSizeRequest[] // REQUIRED
}

// === BUSINESS LOGIC INTERFACES ===

export interface AdvancedBusinessValidationResult {
  sizeConsistency: boolean
  uniqueCombinations: boolean
  minimumQuantities: boolean
  validEnumValues: boolean
  errors: string[]
  warnings: string[]
}

export interface AdvancedProductCapabilities {
  canTrackByAgeCategory: boolean
  canTrackBySpecificSize: boolean
  complexityScore: number
  businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise'
  recommendedActions: string[]
}

// === KASIR INTEGRATION INTERFACES ===

export interface AdvancedKasirProductView {
  id: string
  code: string
  name: string
  currentPrice: number
  category: { id: string; name: string; color: string }
  color?: { id: string; name: string; hexCode: string }
  availableSizes: AdvancedKasirAvailableSize[]
  totalAvailableStock: number
  complexityLevel: 'simple' | 'complex'
}

export interface AdvancedKasirAvailableSize {
  sizeId: string
  size: SizeEnum
  ageCategory: AgeCategory
  availableQuantity: number
  displayName: string // "M (Dewasa)" or "M (Anak)"
}

export interface AdvancedRentalTransactionItem {
  productId: string
  productCode: string
  productName: string
  selectedSize: SizeEnum
  selectedAgeCategory: AgeCategory
  sizeDisplayName: string
  quantity: number
  pricePerItem: number
  totalPrice: number
  sizeId: string // ProductSize.id for precise tracking
  reservedAt: Date
}

// === TYPE GUARDS ===

export function isValidAdvancedAgeCategory(category: string): category is AgeCategory {
  return ['ADULT', 'CHILD', 'UNIVERSAL'].includes(category)
}

export function isValidAdvancedSizeEnum(size: string): size is SizeEnum {
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size)
}

export function isValidAdvancedProductStatus(status: string): status is ProductStatus {
  return ['AVAILABLE', 'RENTED', 'MAINTENANCE'].includes(status)
}

// === UTILITY FUNCTIONS ===

export function validateAdvancedSizeRequest(request: CreateAdvancedProductSizeRequest): AdvancedSizeValidationResult {
  const errors: AdvancedSizeValidationError[] = []

  if (!isValidAdvancedAgeCategory(request.ageCategory)) {
    errors.push({
      field: 'ageCategory',
      message: 'Invalid age category',
      ageCategory: request.ageCategory
    })
  }

  if (!isValidAdvancedSizeEnum(request.size)) {
    errors.push({
      field: 'size',
      message: 'Invalid size value',
      size: request.size
    })
  }

  if (request.quantity < 1) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be at least 1'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateAdvancedSizeArray(sizes: CreateAdvancedProductSizeRequest[]): AdvancedSizeValidationResult {
  const errors: AdvancedSizeValidationError[] = []

  // Rule 1: Must have at least one size
  if (!sizes || sizes.length === 0) {
    errors.push({
      field: 'sizes',
      message: 'At least one size must be added'
    })
    return { isValid: false, errors }
  }

  // Rule 2: No duplicate size+ageCategory combinations
  const combinations = sizes.map(s => `${s.size}-${s.ageCategory}`)
  const uniqueCombinations = new Set(combinations)
  if (combinations.length !== uniqueCombinations.size) {
    errors.push({
      field: 'sizes',
      message: 'Duplicate size and age category combinations are not allowed'
    })
  }

  // Rule 3: Validate each individual size
  sizes.forEach((size, index) => {
    const validation = validateAdvancedSizeRequest(size)
    validation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `sizes[${index}].${error.field}`
      })
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// === DEFAULT VALUES ===

export const ADVANCED_DEFAULTS = {
  ageCategory: 'UNIVERSAL' as AgeCategory,
  size: 'M' as SizeEnum,
  quantity: 1,
  isActive: true
} as const

export const ADVANCED_SIZE_OPTIONS = [
  { value: 'XS', label: 'XS (Extra Small)' },
  { value: 'S', label: 'S (Small)' },
  { value: 'M', label: 'M (Medium)' },
  { value: 'L', label: 'L (Large)' },
  { value: 'XL', label: 'XL (Extra Large)' },
  { value: 'XXL', label: 'XXL (Double Extra Large)' }
] as const

export const ADVANCED_AGE_CATEGORY_OPTIONS = [
  { value: 'UNIVERSAL', label: 'Universal' },
  { value: 'ADULT', label: 'Dewasa' },
  { value: 'CHILD', label: 'Anak' }
] as const