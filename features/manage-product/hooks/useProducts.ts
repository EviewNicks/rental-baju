/**
 * useProducts Hook - Low-level data fetching for products
 * Handles product list fetching with pagination, search, and filtering
 */

import { useQuery } from '@tanstack/react-query'
import { productAdapter } from '../adapters/productAdapter'
import { queryKeys } from '@/lib/react-query'
import type { GetProductsParams } from '../adapters/types/requests'
import type { ProductListApiResponse } from '../adapters/types/responses'

export interface UseProductsParams extends GetProductsParams {
  enabled?: boolean
}

export function useProducts(params: UseProductsParams = {}) {
  const { enabled = true, ...queryParams } = params

  return useQuery({
    queryKey: queryKeys.products.list(queryParams),
    queryFn: () => productAdapter.getProducts(queryParams),
    enabled,
    select: (data: ProductListApiResponse) => ({
      products: data.products || [],
      pagination: data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      total: data.pagination?.total || 0,
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes for frequently changing data
  })
}

/**
 * Hook for infinite/paginated product loading
 */
export function useInfiniteProducts(params: GetProductsParams = {}) {
  // Note: This could be implemented later if needed for infinite scroll
  // For now, we'll use regular pagination
  return useProducts(params)
}

/**
 * Hook for searching products with debouncing
 */
export function useProductSearch(searchTerm: string, additionalParams: GetProductsParams = {}) {
  return useProducts({
    ...additionalParams,
    search: searchTerm,
    enabled: searchTerm.length >= 2, // Only search if at least 2 characters
  })
}

/**
 * Hook for getting products by category
 */
export function useProductsByCategory(categoryId: string, params: GetProductsParams = {}) {
  return useProducts({
    ...params,
    categoryId,
    enabled: !!categoryId,
  })
}

/**
 * Hook for getting products by status
 */
export function useProductsByStatus(
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE',
  params: GetProductsParams = {},
) {
  return useProducts({
    ...params,
    status,
  })
}