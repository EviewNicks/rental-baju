'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { ProductAvailabilityQueryParams } from '../types'

// Cache metrics for monitoring - cleaned up debug logging

// Hook for fetching available products
export function useAvailableProducts(params: ProductAvailabilityQueryParams = {}) {
  // Default to showing only available products with pagination
  const queryParams = {
    available: true,
    page: 1,
    limit: 12,
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
    staleTime: 30 * 1000, // 30 seconds - optimized for fresh inventory data
    gcTime: 5 * 60 * 1000, // 5 minutes - extended cache time for better performance
  })
}
