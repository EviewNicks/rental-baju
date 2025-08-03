'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { ProductAvailabilityQueryParams } from '../types'

// Hook for fetching available products
export function useAvailableProducts(params: ProductAvailabilityQueryParams = {}) {
  // Default to showing only available products
  const queryParams = {
    available: true,
    ...params,
  }

  return useQuery({
    queryKey: queryKeys.kasir.produk.availableList(queryParams),
    queryFn: () => kasirApi.produk.getAvailable(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes - inventory changes frequently
    gcTime: 5 * 60 * 1000,
  })
}

