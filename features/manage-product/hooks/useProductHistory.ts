/**
 * useProductHistory Hook - RPK-46 Product History Component
 * React Query hook for fetching product rental history with pagination
 * Follows existing patterns from useProducts.ts
 */

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '../api'
import type { 
  HistoryQueryParams,
} from '../types/productHistory'

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '../types/productHistory'

// Query keys factory following existing pattern
const queryKeys = {
  products: {
    history: {
      all: (productId: string) => ['products', productId, 'history'] as const,
      list: (productId: string, params?: Omit<HistoryQueryParams, 'productId'>) => 
        [...queryKeys.products.history.all(productId), 'list', params] as const,
    }
  }
}

/**
 * Hook for fetching product rental history with pagination
 */
export function useProductHistory(
  productId: string,
  params?: {
    page?: number
    limit?: number
    sortBy?: 'date' | 'revenue'
    sortOrder?: 'asc' | 'desc'
  }
) {
  // Build query parameters with defaults
  const queryParams = {
    page: params?.page || 1,
    limit: params?.limit || DEFAULT_PAGE_SIZE,
    sortBy: params?.sortBy || DEFAULT_SORT_BY,
    sortOrder: params?.sortOrder || DEFAULT_SORT_ORDER,
  }

  return useQuery({
    queryKey: queryKeys.products.history.list(productId, queryParams),
    queryFn: () => productApi.getProductHistory(productId, queryParams),
    enabled: !!productId, // Only run query if productId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes - balance between freshness and performance
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (likely permanent)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number
        if (status >= 400 && status < 500) {
          return false
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus for history data
    refetchOnMount: true, // Always fetch fresh data on component mount
  })
}

/**
 * Type-safe wrapper for the query response
 */
export type UseProductHistoryResult = ReturnType<typeof useProductHistory>

/**
 * Helper hook for managing pagination state
 */
export function useProductHistoryPagination(initialPage = 1, initialLimit = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = React.useState(initialPage)
  const [limit, setLimit] = React.useState(initialLimit)

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, newPage))
  }

  const nextPage = () => {
    setPage(prev => prev + 1)
  }

  const prevPage = () => {
    setPage(prev => Math.max(1, prev - 1))
  }

  const resetPagination = () => {
    setPage(1)
  }

  return {
    page,
    limit,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    resetPagination,
  }
}

// Export query keys for external invalidation if needed
export { queryKeys as productHistoryQueryKeys }