/**
 * Type Converter Utilities
 * Converts between different type representations (Database, API, Client)
 */

import type { 
  Product, 
  Category, 
  ClientProduct, 
  ClientCategory,
  BaseCategory
} from '../../types'

/**
 * Convert Prisma Decimal to number (safe for client-side)
 */
export function decimalToNumber(decimal: any): number {
  if (typeof decimal === 'number') return decimal
  if (typeof decimal === 'string') return parseFloat(decimal)
  if (decimal && typeof decimal.toNumber === 'function') return decimal.toNumber()
  return 0
}

/**
 * Convert number to client-safe representation
 */
export function numberToClientSafe(num: number): number {
  return Number(num) || 0
}

/**
 * Convert Product to ClientProduct
 */
export function productToClientProduct(product: Product): ClientProduct {
  return {
    ...product,
    modalAwal: decimalToNumber(product.modalAwal),
    hargaSewa: decimalToNumber(product.hargaSewa),
    totalPendapatan: decimalToNumber(product.totalPendapatan),
    createdAt: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt : new Date(product.updatedAt),
    category: categoryToClientCategory(product.category)
  }
}

/**
 * Convert ClientProduct to Product (for server-side usage)
 * Note: This creates objects with number values that need server-side Decimal conversion
 */
export function clientProductToProduct(clientProduct: ClientProduct): any {
  return {
    ...clientProduct,
    modalAwal: clientProduct.modalAwal, // Keep as number, server will convert to Decimal
    hargaSewa: clientProduct.hargaSewa, // Keep as number, server will convert to Decimal  
    totalPendapatan: clientProduct.totalPendapatan, // Keep as number, server will convert to Decimal
    createdAt: clientProduct.createdAt instanceof Date ? clientProduct.createdAt : new Date(clientProduct.createdAt),
    updatedAt: clientProduct.updatedAt instanceof Date ? clientProduct.updatedAt : new Date(clientProduct.updatedAt),
    category: clientCategoryToCategory(clientProduct.category)
  }
}

/**
 * Convert Category to ClientCategory
 */
export function categoryToClientCategory(category: Category): ClientCategory {
  return {
    ...category,
    createdAt: category.createdAt instanceof Date ? category.createdAt : new Date(category.createdAt),
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt : new Date(category.updatedAt),
    products: category.products.map(productToClientProduct)
  }
}

/**
 * Convert ClientCategory to Category (for server-side usage)
 */
export function clientCategoryToCategory(clientCategory: ClientCategory): any {
  return {
    ...clientCategory,
    createdAt: clientCategory.createdAt instanceof Date ? clientCategory.createdAt : new Date(clientCategory.createdAt),
    updatedAt: clientCategory.updatedAt instanceof Date ? clientCategory.updatedAt : new Date(clientCategory.updatedAt),
    products: clientCategory.products.map(clientProductToProduct)
  }
}

/**
 * Convert Category array to ClientCategory array
 */
export function categoriesToClientCategories(categories: Category[]): ClientCategory[] {
  return categories.map(categoryToClientCategory)
}

/**
 * Convert ClientCategory array to Category array (for server-side usage)
 */
export function clientCategoriesToCategories(clientCategories: ClientCategory[]): any[] {
  return clientCategories.map(clientCategoryToCategory)
}

/**
 * Safe conversion for categories without products (common case for dropdowns)
 */
export function baseCategoryToClientCategory(category: BaseCategory): ClientCategory {
  return {
    ...category,
    createdAt: category.createdAt instanceof Date ? category.createdAt : new Date(category.createdAt),
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt : new Date(category.updatedAt),
    products: [] // Empty products array for dropdown usage
  }
}

/**
 * Convert array of BaseCategory to ClientCategory array (for dropdowns)
 */
export function baseCategoriesToClientCategories(categories: BaseCategory[]): ClientCategory[] {
  return categories.map(baseCategoryToClientCategory)
}