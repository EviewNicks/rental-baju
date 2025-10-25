/**
 * Category Form Strategy Interface
 *
 * Strategy pattern untuk dynamic form rendering berdasarkan kategori tipe.
 * Setiap strategy menentukan field configuration, data transformation, dan validation.
 */

import { z } from 'zod'
import type { CreateProductSizeRequest, CategoryType } from '../../types'

// ============== FORM FIELD CONFIGURATION ==============

/**
 * Konfigurasi untuk individual form field
 */
export interface FormFieldConfig {
  name: string
  type: 'number' | 'select' | 'checkbox-group' | 'text'
  label: string
  placeholder?: string
  required: boolean
  validation: z.ZodSchema
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  defaultValue?: string | number | boolean | string[] | undefined
  helpText?: string
}

/**
 * Konfigurasi untuk form section
 */
export interface FormSectionConfig {
  title: string
  description?: string
  fields: FormFieldConfig[]
}

// ============== STRATEGY INTERFACE ==============

/**
 * Interface untuk Category Form Strategy
 * Setiap strategy meng-handle form behavior untuk kategori tipe tertentu
 */
export interface CategoryFormStrategy {
  /**
   * Tipe kategori yang di-handle oleh strategy ini
   */
  readonly type: CategoryType

  /**
   * Mengembalikan form field configuration untuk UI rendering
   */
  getFormFields(): FormSectionConfig[]

  /**
   * Transform form data ke ProductSize format untuk API submission
   */
  transformToProductSizes(formData: CategoryFormData): CreateProductSizeRequest[]

  /**
   * Mengembalikan validation schema untuk form data
   */
  getValidationSchema(): z.ZodSchema

  /**
   * Default form values untuk strategy ini
   */
  getDefaultValues(): CategoryFormData

  /**
   * Form description/help text untuk user guidance
   */
  getFormDescription(): string
}

// ============== HELPER TYPES ==============

/**
 * Form data structure yang digunakan dalam ProductForm
 */
export interface CategoryFormData {
  categoryId: string
  name?: string
  color?: string
  // Dynamic fields berdasarkan strategy
  [key: string]: unknown
}

/**
 * Strategy creation context
 */
export interface StrategyContext {
  categoryId: string
  categoryName: string
  isEditMode: boolean
  existingData?: CreateProductSizeRequest[]
}

/**
 * Validation result untuk form data
 */
export interface ValidationResult {
  isValid: boolean
  errors: Array<{ field: string; message: string }>
  data?: CreateProductSizeRequest[]
}

// ============== ERROR TYPES ==============

/**
 * Custom error untuk strategy-related issues
 */
export class StrategyError extends Error {
  constructor(
    message: string,
    public readonly strategy: CategoryType,
    public readonly field?: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'StrategyError'
  }
}

/**
 * Error untuk invalid category type
 */
export class InvalidCategoryTypeError extends StrategyError {
  constructor(categoryType: string) {
    super(
      `Invalid category type: ${categoryType}. Must be one of: clothing, accessories_age_based, accessories_universal`,
      categoryType as CategoryType
    )
    this.name = 'InvalidCategoryTypeError'
  }
}

// Re-export types for convenience
export type { CreateProductSizeRequest, CategoryType } from '../../types'

// ============== REGISTRY TYPES ==============

/**
 * Strategy registry untuk dynamic strategy loading
 */
export interface StrategyRegistry {
  [key: string]: new () => CategoryFormStrategy
}

/**
 * Strategy factory configuration
 */
export interface StrategyFactoryConfig {
  defaultStrategy?: CategoryType
  customStrategies?: StrategyRegistry
  enableFallback: boolean
}