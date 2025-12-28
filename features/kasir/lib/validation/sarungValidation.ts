/**
 * Input Validation and Security Measures for Jas-Sarung Pairing System
 * Task 12: Implement input validation and security measures
 * Requirements: 9.2, 9.3, 10.1, 10.2
 */

import type { Product, ProductSize } from '../../types'
import { sanitizeTextInput } from '../../types'
import { isEligibleForFreeSarung } from '../utils/jasSarungUtils'

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

// Security constants
export const VALIDATION_LIMITS = {
  MAX_QUANTITY: 50, // Maximum quantity per selection
  MIN_QUANTITY: 1,  // Minimum quantity per selection
  MAX_PRODUCT_NAME_LENGTH: 255,
  MAX_CATEGORY_NAME_LENGTH: 100,
  ALLOWED_CATEGORIES: ['jas-jaguar', 'jas-polos', 'jas-premium', 'jas-renda', 'renda', 'renda-premium', 'sarung'],
  MAX_SELECTIONS_PER_SESSION: 100, // Prevent DoS attacks
} as const

/**
 * Validate quantity input for sarung selection
 * Requirements: 9.2 - Inventory validation checks
 */
export function validateQuantityInput(
  quantity: number,
  availableStock: number,
  mainProductQuantity: number
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic type and range validation
  if (!Number.isInteger(quantity) || quantity < VALIDATION_LIMITS.MIN_QUANTITY) {
    errors.push(`Jumlah harus berupa angka bulat minimal ${VALIDATION_LIMITS.MIN_QUANTITY}`)
  }

  if (quantity > VALIDATION_LIMITS.MAX_QUANTITY) {
    errors.push(`Jumlah tidak boleh melebihi ${VALIDATION_LIMITS.MAX_QUANTITY}`)
  }

  // Stock availability validation
  if (quantity > availableStock) {
    errors.push(`Jumlah yang diminta (${quantity}) melebihi stok tersedia (${availableStock})`)
  }

  // Pairing quantity validation
  if (quantity > mainProductQuantity) {
    errors.push(`Jumlah sarung (${quantity}) tidak boleh melebihi jumlah produk utama (${mainProductQuantity})`)
  }

  // Warning for high quantity selections
  if (quantity > mainProductQuantity * 0.8 && quantity <= mainProductQuantity) {
    warnings.push(`Jumlah sarung mendekati batas maksimal untuk pairing`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate product data for security
 * Requirements: 10.1, 10.2 - Code quality and security
 */
export function validateProductData(product: Product): ValidationResult {
  const errors: string[] = []

  // Sanitize and validate product ID
  if (!product.id || typeof product.id !== 'string' || product.id.trim().length === 0) {
    errors.push('ID produk tidak valid')
  }

  // Validate product name
  if (!product.name || typeof product.name !== 'string') {
    errors.push('Nama produk tidak valid')
  } else {
    const sanitizedName = sanitizeTextInput(product.name)
    if (sanitizedName.length > VALIDATION_LIMITS.MAX_PRODUCT_NAME_LENGTH) {
      errors.push(`Nama produk terlalu panjang (maksimal ${VALIDATION_LIMITS.MAX_PRODUCT_NAME_LENGTH} karakter)`)
    }
  }

  // Validate category
  if (!product.category || typeof product.category !== 'string') {
    errors.push('Kategori produk tidak valid')
  } else {
    const normalizedCategory = product.category.toLowerCase().trim()
    const isValidCategory = VALIDATION_LIMITS.ALLOWED_CATEGORIES.some(cat => 
      normalizedCategory === cat || normalizedCategory.startsWith('jas-')
    )
    
    if (!isValidCategory) {
      errors.push(`Kategori produk tidak diizinkan: ${product.category}`)
    }
  }

  // Validate price
  if (typeof product.pricePerDay !== 'number' || product.pricePerDay < 0) {
    errors.push('Harga produk tidak valid')
  }

  // Validate available quantity
  if (product.availableQuantity !== undefined) {
    if (typeof product.availableQuantity !== 'number' || product.availableQuantity < 0) {
      errors.push('Jumlah stok tidak valid')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate sarung selection for pairing
 * Requirements: 9.2, 9.3 - Inventory validation and graceful degradation
 */
export function validateSarungSelection(
  mainProduct: Product,
  sarungProduct: Product,
  mainProductQuantity: number,
  sarungQuantity: number
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate main product
  const mainProductValidation = validateProductData(mainProduct)
  if (!mainProductValidation.isValid) {
    errors.push(...mainProductValidation.errors.map(err => `Produk utama: ${err}`))
  }

  // Validate sarung product
  const sarungValidation = validateProductData(sarungProduct)
  if (!sarungValidation.isValid) {
    errors.push(...sarungValidation.errors.map(err => `Sarung: ${err}`))
  }

  // Validate main product category (should be eligible for free sarung)
  if (!isEligibleForFreeSarung(mainProduct)) {
    errors.push('Produk yang dipilih tidak eligible untuk mendapat sarung gratis')
  }

  // Validate sarung category
  if (sarungProduct.category.toLowerCase() !== 'sarung') {
    errors.push('Produk yang dipilih bukan kategori sarung yang valid')
  }

  // Validate quantities
  const quantityValidation = validateQuantityInput(
    sarungQuantity,
    sarungProduct.availableQuantity || 0,
    mainProductQuantity
  )
  
  if (!quantityValidation.isValid) {
    errors.push(...quantityValidation.errors)
  }
  
  if (quantityValidation.warnings) {
    warnings.push(...quantityValidation.warnings)
  }

  // Additional pairing validation
  if (mainProductQuantity !== sarungQuantity) {
    warnings.push(`Jumlah produk utama (${mainProductQuantity}) dan sarung (${sarungQuantity}) tidak sama`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate product size selection
 * Requirements: 9.2 - Inventory validation checks
 */
export function validateProductSizeSelection(
  product: Product,
  productSizeId?: string,
  selectedSize?: ProductSize
): ValidationResult {
  const errors: string[] = []

  // If productSizeId is provided, validate it
  if (productSizeId) {
    if (typeof productSizeId !== 'string' || productSizeId.trim().length === 0) {
      errors.push('ID ukuran produk tidak valid')
    }

    // Validate that the size exists in product sizes
    if (product.sizes && product.sizes.length > 0) {
      const sizeExists = product.sizes.some(size => size.id === productSizeId)
      if (!sizeExists) {
        errors.push('Ukuran yang dipilih tidak tersedia untuk produk ini')
      }
    }

    // Validate selectedSize if provided
    if (selectedSize) {
      if (selectedSize.id !== productSizeId) {
        errors.push('Data ukuran yang dipilih tidak konsisten')
      }

      if (selectedSize.availableQuantity <= 0) {
        errors.push('Ukuran yang dipilih tidak memiliki stok tersedia')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate session limits to prevent DoS attacks
 * Requirements: 10.2 - Security considerations
 */
export function validateSessionLimits(
  currentSelections: number
): ValidationResult {
  const errors: string[] = []

  if (currentSelections >= VALIDATION_LIMITS.MAX_SELECTIONS_PER_SESSION) {
    errors.push(`Terlalu banyak seleksi dalam sesi ini (maksimal ${VALIDATION_LIMITS.MAX_SELECTIONS_PER_SESSION})`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Comprehensive validation for sarung modal form submission
 * Requirements: 9.2, 9.3, 10.1, 10.2
 */
export function validateSarungModalSubmission(
  mainProduct: Product,
  selectedSarung: {
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  } | null,
  mainProductQuantity: number,
  currentSelections: number
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate session limits
  const sessionValidation = validateSessionLimits(currentSelections)
  if (!sessionValidation.isValid) {
    errors.push(...sessionValidation.errors)
  }

  // Validate main product
  const mainProductValidation = validateProductData(mainProduct)
  if (!mainProductValidation.isValid) {
    errors.push(...mainProductValidation.errors.map(err => `Produk utama: ${err}`))
  }

  // If sarung is selected, validate it
  if (selectedSarung) {
    const sarungValidation = validateSarungSelection(
      mainProduct,
      selectedSarung.product,
      mainProductQuantity,
      selectedSarung.quantity
    )
    
    if (!sarungValidation.isValid) {
      errors.push(...sarungValidation.errors)
    }
    
    if (sarungValidation.warnings) {
      warnings.push(...sarungValidation.warnings)
    }

    // Validate size selection if applicable
    const sizeValidation = validateProductSizeSelection(
      selectedSarung.product,
      selectedSarung.productSizeId,
      selectedSarung.selectedSize
    )
    
    if (!sizeValidation.isValid) {
      errors.push(...sizeValidation.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Rate limiting helper for preventing spam submissions
 * Requirements: 10.2 - Security considerations
 */
export class SubmissionRateLimiter {
  private submissions: Map<string, number[]> = new Map()
  private readonly maxSubmissions = 10 // Max submissions per minute
  private readonly timeWindow = 60000 // 1 minute in milliseconds

  canSubmit(sessionId: string): boolean {
    const now = Date.now()
    const userSubmissions = this.submissions.get(sessionId) || []
    
    // Remove old submissions outside time window
    const recentSubmissions = userSubmissions.filter(
      timestamp => now - timestamp < this.timeWindow
    )
    
    // Update submissions list
    this.submissions.set(sessionId, recentSubmissions)
    
    return recentSubmissions.length < this.maxSubmissions
  }

  recordSubmission(sessionId: string): void {
    const now = Date.now()
    const userSubmissions = this.submissions.get(sessionId) || []
    userSubmissions.push(now)
    this.submissions.set(sessionId, userSubmissions)
  }

  getRemainingSubmissions(sessionId: string): number {
    const userSubmissions = this.submissions.get(sessionId) || []
    const now = Date.now()
    const recentSubmissions = userSubmissions.filter(
      timestamp => now - timestamp < this.timeWindow
    )
    
    return Math.max(0, this.maxSubmissions - recentSubmissions.length)
  }
}

// Global rate limiter instance
export const globalRateLimiter = new SubmissionRateLimiter()