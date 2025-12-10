/**
 * Simplified useProducts Hook - Data fetching for products
 * Replaces multiple complex hooks with simple, direct approach
 * RPK-MODAL: Added break-even status support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../api'

// Simple query key factory
const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: { 
      search?: string
      category?: string
      status?: string
      size?: string | string[]
      colorId?: string | string[]
      page?: number
      limit?: number
      includeBreakEven?: boolean
    } | undefined) => ['products', 'list', params] as const,
    detail: (id: string, options?: { includeAggregation?: boolean; includeBreakEven?: boolean }) => 
      ['products', 'detail', id, options] as const,
  }
}

// Products list hook
export function useProducts(params?: {
  search?: string
  category?: string  
  status?: string
  size?: string | string[]
  colorId?: string | string[]
  page?: number
  limit?: number
  includeBreakEven?: boolean // RPK-MODAL
}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.getProducts(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // RPK-MODAL: 5 minutes for break-even data
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true, // RPK-MODAL: Refetch on focus for fresh data
  })
}

// Single product hook with options
export function useProduct(
  id: string,
  options?: {
    includeAggregation?: boolean
    includeBreakEven?: boolean // RPK-MODAL
  }
) {
  return useQuery({
    queryKey: queryKeys.products.detail(id, options),
    queryFn: () => productApi.getProductById(
      id,
      options?.includeAggregation ?? true,
      options?.includeBreakEven ?? false
    ),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // RPK-MODAL: 5 minutes for break-even data
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true, // RPK-MODAL: Refetch on focus for fresh data
    retry: 2, // RPK-MODAL: Retry failed requests
  })
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      // RPK-MODAL: No need to invalidate break-even data for new products (no transactions yet)
    },
  })
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, string | number | boolean | File | null> }) =>
      productApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
      // RPK-MODAL: Invalidate specific product detail to refresh break-even data
      queryClient.invalidateQueries({ 
        queryKey: ['products', 'detail', id],
        predicate: (query) => {
          const options = query.queryKey[3] as { includeBreakEven?: boolean } | undefined
          return options?.includeBreakEven === true
        }
      })
    },
  })
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      // RPK-MODAL: Remove specific product from cache
      queryClient.removeQueries({ 
        queryKey: ['products', 'detail', id]
      })
    },
  })
}
/**
 
* RPK-MODAL: Utility function to invalidate break-even cache when transactions are completed/cancelled
 * This should be called from transaction mutation hooks when transaction status changes
 * 
 * @param queryClient - React Query client instance
 * @param productIds - Array of product IDs that were affected by transaction changes
 */
export function invalidateBreakEvenCache(
  queryClient: ReturnType<typeof useQueryClient>,
  productIds: string[]
) {
  // Invalidate product list queries that include break-even data
  queryClient.invalidateQueries({
    queryKey: ['products', 'list'],
    predicate: (query) => {
      const params = query.queryKey[2] as { includeBreakEven?: boolean } | undefined
      return params?.includeBreakEven === true
    },
  })

  // Invalidate specific product detail queries for affected products
  productIds.forEach((productId) => {
    queryClient.invalidateQueries({
      queryKey: ['products', 'detail', productId],
      predicate: (query) => {
        const options = query.queryKey[3] as { includeBreakEven?: boolean } | undefined
        return options?.includeBreakEven === true
      },
    })
  })
}

/**
 * RPK-MODAL: Hook to get query client for break-even cache invalidation
 * Use this in transaction-related components to invalidate break-even data
 */
export function useBreakEvenCacheInvalidation() {
  const queryClient = useQueryClient()
  
  return {
    invalidateBreakEvenCache: (productIds: string[]) => 
      invalidateBreakEvenCache(queryClient, productIds),
    
    invalidateAllBreakEvenCache: () => {
      // Invalidate all product queries with break-even data
      queryClient.invalidateQueries({
        queryKey: ['products'],
        predicate: (query) => {
          // Check if query includes break-even data
          const params = query.queryKey[2] as { includeBreakEven?: boolean } | undefined
          const options = query.queryKey[3] as { includeBreakEven?: boolean } | undefined
          return params?.includeBreakEven === true || options?.includeBreakEven === true
        },
      })
    },
  }
}
