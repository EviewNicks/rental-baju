/**
 * Strategy Integration Utilities
 *
 * Utility functions untuk mengintegrasikan strategy pattern dengan existing services.
 * Memastikan compatibility dan data transformation yang konsisten.
 */

import type { CreateProductSizeRequest, CategoryType } from '../../types'
import type { CategoryFormStrategy, CategoryFormData } from './CategoryFormStrategy'

/**
 * Integration utilities untuk strategy pattern dengan existing services
 */
export class StrategyIntegration {
  /**
   * Validate strategy data dengan existing service validation
   */
  static validateWithService(
    strategy: CategoryFormStrategy,
    formData: CategoryFormData,
    categoryType: CategoryType
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Validate dengan strategy schema
      const strategySchema = strategy.getValidationSchema()
      const result = strategySchema.safeParse(formData)

      if (!result.success) {
        errors.push(...result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`))
      }

      // Additional service-level validations
      const sizes = strategy.transformToProductSizes(formData)

      if (sizes.length === 0) {
        errors.push('Minimal satu ukuran harus ditambahkan')
      }

      // Validate quantities
      const invalidQuantities = sizes.filter(size => size.quantity <= 0)
      if (invalidQuantities.length > 0) {
        errors.push('Semua kuantitas harus lebih dari 0')
      }

      // Category type specific validations
      switch (categoryType) {
        case 'accessories_age_based':
          this.validateAgeBasedAccessories(sizes, errors)
          break
        case 'accessories_universal':
          this.validateUniversalAccessories(sizes, errors)
          break
        case 'clothing':
          this.validateClothing(sizes, errors)
          break
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate age-based accessories
   */
  private static validateAgeBasedAccessories(
    sizes: CreateProductSizeRequest[],
    errors: string[]
  ): void {
    const ageCategories = new Set(sizes.map(s => s.ageCategory))

    if (ageCategories.size === 0) {
      errors.push('Aksesoris age-based harus memiliki kategori umur (Dewasa/Anak)')
    }

    // Check untuk valid age categories
    const validCategories = ['ADULT', 'CHILD']
    const invalidCategories = sizes.filter(s => !validCategories.includes(s.ageCategory))

    if (invalidCategories.length > 0) {
      errors.push('Hanya kategori ADULT dan CHILD yang diperbolehkan untuk aksesoris age-based')
    }
  }

  /**
   * Validate universal accessories
   */
  private static validateUniversalAccessories(
    sizes: CreateProductSizeRequest[],
    errors: string[]
  ): void {
    if (sizes.length !== 1) {
      errors.push('Aksesoris universal seharusnya hanya memiliki satu jenis ukuran')
    }

    const universalSize = sizes[0]
    if (universalSize && (universalSize.ageCategory !== 'UNIVERSAL' || universalSize.size !== 'UNIVERSAL')) {
      errors.push('Aksesoris universal harus menggunakan kategori dan ukuran UNIVERSAL')
    }
  }

  /**
   * Validate clothing items
   */
  private static validateClothing(
    sizes: CreateProductSizeRequest[],
    errors: string[]
  ): void {
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

    // Check untuk valid sizes
    const invalidSizes = sizes.filter(s => !validSizes.includes(s.size))
    if (invalidSizes.length > 0) {
      errors.push(`Ukuran tidak valid: ${invalidSizes.map(s => s.size).join(', ')}. Gunakan: ${validSizes.join(', ')}`)
    }

    // Check untuk duplicate combinations
    const combinations = sizes.map(s => `${s.ageCategory}-${s.size}`)
    const uniqueCombinations = new Set(combinations)

    if (combinations.length !== uniqueCombinations.size) {
      errors.push('Tidak boleh ada ukuran duplikat dalam kategori umur yang sama')
    }
  }

  /**
   * Transform strategy sizes ke service-compatible format
   */
  static transformForService(
    sizes: CreateProductSizeRequest[]
  ): CreateProductSizeRequest[] {
    return sizes.map(size => ({
      ...size,
      isActive: size.isActive ?? true,
      // Ensure consistent data types
      quantity: Number(size.quantity)
    }))
  }

  /**
   * Create product data dari strategy untuk service submission
   */
  static createProductRequestFromStrategy(
    baseData: Record<string, unknown>,
    strategy: CategoryFormStrategy,
    categoryFormData: CategoryFormData
  ): {
    productData: Record<string, unknown>
    sizes: CreateProductSizeRequest[]
  } {
    // Transform sizes
    const rawSizes = strategy.transformToProductSizes(categoryFormData)
    const sizes = this.transformForService(rawSizes)

    // Calculate total quantity
    const totalQuantity = (strategy as CategoryFormStrategy & { calculateTotalQuantity?: (data: CategoryFormData) => number }).calculateTotalQuantity?.(categoryFormData) ||
      sizes.reduce((sum, size) => sum + size.quantity, 0)

    // Merge base data dengan strategy-specific data
    const productData = {
      ...baseData,
      quantity: totalQuantity,
      sizes: JSON.stringify(sizes) // For API compatibility
    }

    return {
      productData,
      sizes
    }
  }

  /**
   * Load existing product data ke strategy format
   */
  static loadExistingProductData(
    strategy: CategoryFormStrategy,
    existingSizes: CreateProductSizeRequest[]
  ): CategoryFormData {
    if ('transformFromProductSizes' in strategy && typeof strategy.transformFromProductSizes === 'function') {
      return (strategy as CategoryFormStrategy & { transformFromProductSizes?: (sizes: unknown[]) => CategoryFormData }).transformFromProductSizes?.(existingSizes) || {
      categoryId: ''
    }
    }

    // Fallback transformation
    const formData: CategoryFormData = { categoryId: '' }

    existingSizes.forEach(size => {
      if (strategy.type === 'accessories_age_based') {
        if (size.ageCategory === 'ADULT') {
          formData.jumlahDewasa = size.quantity
        } else if (size.ageCategory === 'CHILD') {
          formData.jumlahAnak = size.quantity
        }
      } else if (strategy.type === 'accessories_universal') {
        if (size.ageCategory === 'UNIVERSAL') {
          formData.jumlahTotal = size.quantity
        }
      } else if (strategy.type === 'clothing') {
        if (!formData.sizes) formData.sizes = []
        if (Array.isArray(formData.sizes)) {
          formData.sizes.push(size.size)
        }
        formData[`quantity_${size.size}`] = size.quantity
      }
    })

    return formData
  }

  /**
   * Get strategy description untuk debugging dan logging
   */
  static getStrategyInfo(strategy: CategoryFormStrategy): {
    type: CategoryType
    description: string
    fieldCount: number
    formSections: string[]
  } {
    const formFields = strategy.getFormFields()

    return {
      type: strategy.type,
      description: strategy.getFormDescription(),
      fieldCount: formFields.reduce((total, section) => total + section.fields.length, 0),
      formSections: formFields.map(section => section.title)
    }
  }

  /**
   * Validate strategy compatibility dengan existing data
   */
  static validateStrategyCompatibility(
    strategy: CategoryFormStrategy,
    existingSizes: CreateProductSizeRequest[]
  ): { isCompatible: boolean; issues: string[] } {
    const issues: string[] = []

    try {
      // Check jika existing data bisa di-transform ke strategy format
      const formData = this.loadExistingProductData(strategy, existingSizes)

      // Transform balik ke sizes
      const transformedSizes = strategy.transformToProductSizes(formData)

      // Compare dengan original data
      if (transformedSizes.length !== existingSizes.length) {
        issues.push(`Size count mismatch: expected ${existingSizes.length}, got ${transformedSizes.length}`)
      }

      // Check quantity consistency
      const originalQuantities = existingSizes.map(s => `${s.ageCategory}-${s.size}:${s.quantity}`)
      const transformedQuantities = transformedSizes.map(s => `${s.ageCategory}-${s.size}:${s.quantity}`)

      const missingQuantities = originalQuantities.filter(q => !transformedQuantities.includes(q))
      if (missingQuantities.length > 0) {
        issues.push(`Missing size quantities: ${missingQuantities.join(', ')}`)
      }

    } catch (error) {
      issues.push(`Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isCompatible: issues.length === 0,
      issues
    }
  }
}