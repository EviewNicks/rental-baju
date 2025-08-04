'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { ProductAvailabilityQueryParams } from '../types'

// Cache metrics for monitoring
const logCacheMetrics = (queryKey: string, isStale: boolean) => {
  if (typeof window !== 'undefined') {
    console.info('[useProduk] Cache metrics', {
      queryKey,
      isStale,
      timestamp: new Date().toISOString(),
      cacheStrategy: 'optimized-30s',
    })
  }
}

// Hook for fetching available products
export function useAvailableProducts(params: ProductAvailabilityQueryParams = {}) {
  // Default to showing only available products
  const queryParams = {
    available: true,
    ...params,
  }

  const queryKey = queryKeys.kasir.produk.availableList(queryParams)

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await kasirApi.produk.getAvailable(queryParams)

      // Log cache metrics for monitoring
      logCacheMetrics(JSON.stringify(queryKey), false)

      return result
    },
    staleTime: 10 * 1000, // 30 seconds - reduced from 2 minutes for fresh inventory data
    gcTime: 2 * 30 * 1000, // 2 minutes - reduced garbage collection time
  })
}
