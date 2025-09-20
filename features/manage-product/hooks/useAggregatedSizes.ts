/**
 * useAggregatedSizes Hook
 *
 * Provides API integration for fetching aggregated size data from ProductSizeAggregationService
 * Supports caching, query parameters, and real-time updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type {
  AggregatedSizeView,
  AggregationQueryParams
} from '@/features/manage-product/types'
import { sizeApi } from '@/features/manage-product/api'

interface AggregatedSizesResponse {
  productId: string
  productName: string
  aggregatedSizes: AggregatedSizeView[]
  metadata?: {
    calculatedAt: string
    fromCache: boolean
    calculationTimeMs: number
  }
}

interface UseAggregatedSizesOptions extends Partial<AggregationQueryParams> {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
}

/**
 * Hook for fetching aggregated size data
 */
export function useAggregatedSizes(
  productId: string | undefined,
  options: UseAggregatedSizesOptions = {}
) {
  const queryClient = useQueryClient()

  const {
    includeBreakdown = true,
    includeMetadata = false,
    cacheBypass = false,
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options

  // Fetch function using centralized sizeApi
  const fetchAggregatedSizes = async (): Promise<AggregatedSizesResponse> => {
    if (!productId) {
      throw new Error('Product ID is required')
    }

    return sizeApi.getAggregatedSizes(productId, {
      includeBreakdown,
      includeMetadata,
      cacheBypass
    })
  }

  // React Query setup
  const query = useQuery({
    queryKey: ['aggregatedSizes', productId, includeBreakdown, includeMetadata, cacheBypass],
    queryFn: fetchAggregatedSizes,
    enabled: enabled && !!productId,
    staleTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 400 errors
      if (error instanceof Error &&
          (error.message.includes('not found') || error.message.includes('not active'))) {
        return false
      }

      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Invalidate cache for this product
  const invalidateCache = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({
        queryKey: ['aggregatedSizes', productId],
      })
    }
  }, [queryClient, productId])

  // Refresh data with cache bypass
  const refreshWithCacheBypass = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({
        queryKey: ['aggregatedSizes', productId],
      })

      // Fetch with cache bypass using centralized API
      queryClient.fetchQuery({
        queryKey: ['aggregatedSizes', productId, includeBreakdown, includeMetadata, true],
        queryFn: async () => {
          return sizeApi.getAggregatedSizes(productId, {
            includeBreakdown,
            includeMetadata,
            cacheBypass: true
          })
        },
      })
    }
  }, [queryClient, productId, includeBreakdown, includeMetadata])

  // Update cache with optimistic updates
  const updateCache = useCallback((updatedSizes: AggregatedSizeView[]) => {
    if (productId) {
      queryClient.setQueryData(
        ['aggregatedSizes', productId, includeBreakdown, includeMetadata, cacheBypass],
        (oldData: AggregatedSizesResponse | undefined) => {
          if (!oldData) return undefined

          return {
            ...oldData,
            aggregatedSizes: updatedSizes,
            metadata: {
              ...oldData.metadata,
              calculatedAt: new Date().toISOString(),
              fromCache: false,
            },
          }
        }
      )
    }
  }, [queryClient, productId, includeBreakdown, includeMetadata, cacheBypass])

  return {
    // Data
    data: query.data?.aggregatedSizes || [],
    productName: query.data?.productName,
    metadata: query.data?.metadata,

    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,

    // Error states
    error: query.error,
    isError: query.isError,

    // Success state
    isSuccess: query.isSuccess,

    // Cache info
    isFromCache: query.data?.metadata?.fromCache || false,
    calculationTime: query.data?.metadata?.calculationTimeMs,

    // Actions
    refetch: query.refetch,
    invalidateCache,
    refreshWithCacheBypass,
    updateCache,

    // Query info
    dataUpdatedAt: query.dataUpdatedAt,
    failureCount: query.failureCount,
  }
}

/**
 * Hook for checking if a product has advanced sizing
 */
export function useHasAdvancedSizing(productId: string | undefined) {
  const { data, isLoading, error } = useAggregatedSizes(productId, {
    includeBreakdown: false,
    includeMetadata: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - this changes less frequently
  })

  return {
    hasAdvancedSizing: data.length > 0,
    isLoading,
    error,
  }
}

/**
 * Hook for getting total quantity across all sizes
 */
export function useTotalQuantity(productId: string | undefined) {
  const { data, isLoading, error } = useAggregatedSizes(productId, {
    includeBreakdown: false,
    includeMetadata: false,
  })

  const totalQuantity = data.reduce((sum, size) => sum + size.totalQuantity, 0)

  return {
    totalQuantity,
    isLoading,
    error,
  }
}

/**
 * Helper function to get query key for external cache management
 */
export function getAggregatedSizesQueryKey(
  productId: string,
  options: Partial<AggregationQueryParams> = {}
) {
  const {
    includeBreakdown = true,
    includeMetadata = false,
    cacheBypass = false,
  } = options

  return ['aggregatedSizes', productId, includeBreakdown, includeMetadata, cacheBypass]
}