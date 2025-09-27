'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { ProductAvailabilityQueryParams } from '../types'

// Cache metrics for monitoring - cleaned up debug logging

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

      // Cache metrics monitoring removed

      return result
    },
    staleTime: 10 * 1000, // 30 seconds - reduced from 2 minutes for fresh inventory data
    gcTime: 2 * 30 * 1000, // 2 minutes - reduced garbage collection time
  })
}
