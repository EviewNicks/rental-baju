/**
 * Size-Aware Product Validation Utilities
 *
 * TypeScript validation utilities to prevent size-aware cart issues
 * and ensure proper data flow between API and UI components.
 */

import type { Product, ProductSelection, ProductSize } from '../../types'

/**
 * Validates that a ProductSelection object has all required size-aware fields
 */
export function validateProductSelection(selection: ProductSelection): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required fields
  if (!selection.product) {
    errors.push('Product is required')
  }

  if (!selection.quantity || selection.quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (!selection.duration || selection.duration <= 0) {
    errors.push('Duration must be greater than 0')
  }

  // Size-aware validation
  if (selection.productSizeId) {
    if (!selection.selectedSize) {
      warnings.push('productSizeId is provided but selectedSize is missing')
    }

    if (selection.selectedSize && selection.selectedSize.id !== selection.productSizeId) {
      errors.push(`selectedSize.id (${selection.selectedSize.id}) does not match productSizeId (${selection.productSizeId})`)
    }
  }

  // Check for size consistency
  if (selection.selectedSize && !selection.productSizeId) {
    warnings.push('selectedSize is provided but productSizeId is missing')
  }

  // Validate product structure
  if (selection.product) {
    if (!selection.product.id) {
      errors.push('Product ID is required')
    }

    if (!selection.product.name) {
      errors.push('Product name is required')
    }

    if (!selection.product.pricePerDay || selection.product.pricePerDay <= 0) {
      errors.push('Product price must be greater than 0')
    }

    // Validate size-aware product structure
    if (selection.product.sizes && selection.product.sizes.length > 0) {
      if (!selection.product.supportsSizeSelection) {
        warnings.push('Product has sizes array but supportsSizeSelection is false')
      }

      // Validate size data structure
      for (const size of selection.product.sizes) {
        if (!size.id) {
          errors.push('Size ID is required for all product sizes')
        }

        if (!size.ageCategory) {
          errors.push('Age category is required for all product sizes')
        }

        if (!size.size) {
          errors.push('Size label is required for all product sizes')
        }

        if (size.quantity === undefined || size.quantity < 0) {
          errors.push('Size quantity must be non-negative')
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates API response structure for size-aware products
 */
export function validateProductApiResponse(apiProduct: any): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!apiProduct) {
    errors.push('API product data is null or undefined')
    return { isValid: false, errors, warnings }
  }

  // Required fields
  if (!apiProduct.id) {
    errors.push('Product ID is required in API response')
  }

  if (!apiProduct.name) {
    errors.push('Product name is required in API response')
  }

  if (!apiProduct.currentPrice || apiProduct.currentPrice <= 0) {
    errors.push('Product price must be greater than 0 in API response')
  }

  // Category validation
  if (!apiProduct.category) {
    errors.push('Product category is required in API response')
  } else {
    if (!apiProduct.category.name) {
      errors.push('Category name is required in API response')
    }

    if (!apiProduct.category.type) {
      warnings.push('Category type is missing in API response')
    }
  }

  // Legacy field validation
  if (!apiProduct.size) {
    warnings.push('Legacy size field is missing in API response')
  }

  if (!apiProduct.color) {
    warnings.push('Legacy color field is missing in API response')
  } else if (typeof apiProduct.color !== 'object' || !apiProduct.color.name) {
    errors.push('Color field must be an object with name property')
  }

  // Size-aware validation
  if (apiProduct.sizes && Array.isArray(apiProduct.sizes)) {
    if (apiProduct.sizes.length === 0) {
      warnings.push('Product has empty sizes array')
    } else {
      for (const size of apiProduct.sizes) {
        if (!size.id) {
          errors.push('Size ID is required in API response')
        }

        if (!size.ageCategory) {
          errors.push('Age category is required for all sizes in API response')
        }

        if (!size.size) {
          errors.push('Size label is required for all sizes in API response')
        }

        if (size.quantity === undefined || size.quantity < 0) {
          errors.push('Size quantity must be non-negative in API response')
        }

        // Validate generated color field
        if (!size.color) {
          warnings.push(`Generated color field is missing for size ${size.size}`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Ensures selectedSize is properly resolved from product.sizes array
 */
export function resolveSelectedSize(
  product: Product,
  productSizeId?: string
): ProductSize | undefined {
  if (!productSizeId) {
    return undefined
  }

  if (!product.sizes || product.sizes.length === 0) {
    console.warn(`[resolveSelectedSize] Product ${product.id} has no sizes array, but productSizeId provided: ${productSizeId}`)
    return undefined
  }

  const selectedSize = product.sizes.find(size => size.id === productSizeId)

  if (!selectedSize) {
    console.warn(`[resolveSelectedSize] Size with ID ${productSizeId} not found in product ${product.id}`)
    console.warn(`[resolveSelectedSize] Available sizes:`, product.sizes.map(s => ({ id: s.id, size: s.size })))
    return undefined
  }

  return selectedSize
}

/**
 * Creates a safe ProductSelection object with proper validation
 */
export function createProductSelection(
  product: Product,
  quantity: number,
  duration: number,
  productSizeId?: string
): {
  selection: ProductSelection | null
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate basic inputs
  if (!product) {
    errors.push('Product is required')
    return { selection: null, errors, warnings }
  }

  if (quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (duration <= 0) {
    errors.push('Duration must be greater than 0')
  }

  // Handle size-aware products
  let selectedSize: ProductSize | undefined
  if (productSizeId) {
    selectedSize = resolveSelectedSize(product, productSizeId)
    if (!selectedSize) {
      errors.push(`Selected size with ID ${productSizeId} not found`)
    }
  }

  // Check if product supports size selection
  if (productSizeId && !product.supportsSizeSelection) {
    warnings.push('productSizeId provided for product that does not support size selection')
  }

  if (!productSizeId && product.supportsSizeSelection && product.sizes && product.sizes.length > 0) {
    warnings.push('Size-aware product selected without specifying size')
  }

  // Create ProductSelection object
  const selection: ProductSelection = {
    product,
    quantity,
    duration,
    ...(productSizeId && { productSizeId }),
    ...(selectedSize && { selectedSize }),
  }

  // Validate the created selection
  const validation = validateProductSelection(selection)
  errors.push(...validation.errors)
  warnings.push(...validation.warnings)

  return {
    selection: validation.isValid ? selection : null,
    errors,
    warnings,
  }
}

/**
 * Validates React key generation to prevent duplicate keys
 */
export function generateReactKey(productId: string, productSizeId?: string): string {
  if (!productId) {
    throw new Error('Product ID is required for React key generation')
  }

  return productSizeId ? `${productId}-${productSizeId}` : `${productId}-no-size`
}

/**
 * Validates that React keys are unique within an array of items
 */
export function validateUniqueKeys<T extends { product: { id: string }; productSizeId?: string }>(
  items: T[]
): {
  isValid: boolean
  duplicateKeys: string[]
  errors: string[]
} {
  const keyMap = new Map<string, T>()
  const duplicateKeys: string[] = []
  const errors: string[] = []

  for (const item of items) {
    try {
      const key = generateReactKey(item.product.id, item.productSizeId)

      if (keyMap.has(key)) {
        duplicateKeys.push(key)
        errors.push(`Duplicate React key detected: ${key} for product ${item.product.id}`)
      } else {
        keyMap.set(key, item)
      }
    } catch (error) {
      errors.push(`Failed to generate React key for product ${item.product.id}: ${error}`)
    }
  }

  return {
    isValid: duplicateKeys.length === 0 && errors.length === 0,
    duplicateKeys,
    errors,
  }
}

/**
 * Runtime validation helper for development
 */
export function logValidationIssues(
  context: string,
  validation: { isValid: boolean; errors: string[]; warnings: string[] }
): void {
  if (process.env.NODE_ENV === 'development') {
    if (validation.errors.length > 0) {
      console.error(`[${context}] Validation errors:`, validation.errors)
    }

    if (validation.warnings.length > 0) {
      console.warn(`[${context}] Validation warnings:`, validation.warnings)
    }
  }
}

/**
 * Type guards for runtime type checking
 */
export function isProductSelection(obj: any): obj is ProductSelection {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.product === 'object' &&
         typeof obj.quantity === 'number' &&
         typeof obj.duration === 'number' &&
         obj.product !== null
}

export function isSizeAwareProduct(product: Product): boolean {
  return !!(product.sizes && product.sizes.length > 0 && product.supportsSizeSelection)
}

export function isValidProductSize(obj: any): obj is ProductSize {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.ageCategory === 'string' &&
         typeof obj.size === 'string' &&
         typeof obj.quantity === 'number'
}