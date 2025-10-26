/**
 * Product Filter Utilities - Shared between Kasir and Manage Product workflows
 * Performance optimizations and reusable filter logic
 */

import type { KasirFilters, ProductAvailabilityQueryParams } from '../../types'

/**
 * Convert KasirFilters to API query parameters
 * Ensures proper format for API calls
 */
export function kasirFiltersToQueryParams(filters: KasirFilters): ProductAvailabilityQueryParams {
  return {
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    available: true, // Default to available for kasir workflow
    size: filters.size && filters.size.length > 0 ? filters.size : undefined,
    // Enhanced filters
    status: filters.status as 'AVAILABLE' | 'RENTED' | undefined,
    sortBy: filters.sortBy || 'name',
    sortOrder: filters.sortOrder || 'asc',
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  }
}

/**
 * Debounce function for search input optimization
 * Prevents excessive API calls during typing
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Format price for display
 * Converts number to formatted currency string
 */
export function formatPriceDisplay(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Check if filters have active values
 * Used for conditional UI rendering
 */
export function hasActiveFilters(filters: KasirFilters): boolean {
  return !!(
    filters.search ||
    filters.categoryId ||
    filters.status ||
    filters.minPrice ||
    filters.maxPrice
  )
}

/**
 * Get filter summary for display
 * Returns count of active filters
 */
export function getFilterSummary(filters: KasirFilters): string[] {
  const summary: string[] = []

  if (filters.search) summary.push(`Search: "${filters.search}"`)
  if (filters.status) summary.push(`Status: ${filters.status}`)
  if (filters.minPrice || filters.maxPrice) {
    const range = filters.minPrice && filters.maxPrice
      ? `Rp ${formatPriceDisplay(filters.minPrice)} - ${formatPriceDisplay(filters.maxPrice)}`
      : filters.minPrice
        ? `≥ Rp ${formatPriceDisplay(filters.minPrice)}`
        : `≤ Rp ${formatPriceDisplay(filters.maxPrice!)}`
    summary.push(`Price: ${range}`)
  }

  return summary
}