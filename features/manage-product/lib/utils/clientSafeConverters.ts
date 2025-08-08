/**
 * Client-Safe Type Converters
 * Simple utilities for frontend without Prisma dependencies
 */

import type { ClientCategory, ClientProduct } from '../../types'

/**
 * Convert product data to ClientProduct (safe for frontend)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClientProduct(product: any, skipCategory = false): ClientProduct {
  return {
    id: product.id || '',
    code: product.code || '',
    name: product.name || '',
    description: product.description || '',
    categoryId: product.categoryId || '',
    modalAwal: toSafeNumber(product.modalAwal),
    currentPrice: toSafeNumber(product.currentPrice),
    quantity: product.quantity || 0,
    rentedStock: product.rentedStock || 0,
    status: product.status || 'AVAILABLE',
    imageUrl: product.imageUrl || '',
    totalPendapatan: toSafeNumber(product.totalPendapatan),
    isActive: product.isActive ?? true,
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
    updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    createdBy: product.createdBy || '',
    category:
      !skipCategory && product.category
        ? toClientCategory(product.category)
        : ({} as ClientCategory),
  }
}

/**
 * Convert any category data to ClientCategory (safe for frontend)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClientCategory(category: any): ClientCategory {
  const products =
    category.products && Array.isArray(category.products)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category.products.map((product: any) => toClientProduct(product, true)) // Skip category to avoid circular ref
      : []

  return {
    id: category.id || '',
    name: category.name || '',
    color: category.color || '#000000',
    createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
    updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
    createdBy: category.createdBy || '',
    products, // Include actual products data if available
  }
}

/**
 * Convert array of category data to ClientCategory array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClientCategories(categories: any[]): ClientCategory[] {
  if (!Array.isArray(categories)) return []
  return categories.map(toClientCategory)
}

/**
 * Safe number conversion for monetary values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSafeNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value && typeof value.toNumber === 'function') return value.toNumber()
  return 0
}

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number for input fields (with thousands separator)
 */
export function formatNumberInput(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Parse number from formatted input
 */
export function parseNumberInput(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0
}
