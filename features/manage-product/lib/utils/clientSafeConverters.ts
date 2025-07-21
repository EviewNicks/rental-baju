/**
 * Client-Safe Type Converters
 * Simple utilities for frontend without Prisma dependencies
 */

import type { ClientCategory } from '../../types'

/**
 * Convert any category data to ClientCategory (safe for frontend)
 */
export function toClientCategory(category: any): ClientCategory {
  return {
    id: category.id || '',
    name: category.name || '',
    color: category.color || '#000000',
    createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
    updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
    createdBy: category.createdBy || '',
    products: [], // Empty products array for frontend usage
  }
}

/**
 * Convert array of category data to ClientCategory array
 */
export function toClientCategories(categories: any[]): ClientCategory[] {
  if (!Array.isArray(categories)) return []
  return categories.map(toClientCategory)
}

/**
 * Safe number conversion for monetary values
 */
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
