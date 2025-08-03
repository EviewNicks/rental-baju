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

// Hook for searching products
export function useProductSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.produk.search(query),
    queryFn: () => kasirApi.produk.search(query),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 1 * 60 * 1000, // 1 minute for search results
    gcTime: 3 * 60 * 1000,
  })
}

// Hook for products by category
export function useProductsByCategory(categoryId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.produk.byCategory(categoryId),
    queryFn: () => kasirApi.produk.getByCategory(categoryId),
    enabled: enabled && !!categoryId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Combined hook for product selection in transaction forms
export function useProductSelection() {
  // Get all available products by default
  const { data: productsData, isLoading, error, refetch } = useAvailableProducts()

  // Helper functions for product operations
  const searchProducts = (query: string) => {
    return kasirApi.produk.search(query)
  }

  const getProductsByCategory = (categoryId: string) => {
    return kasirApi.produk.getByCategory(categoryId)
  }

  // Check if product is available for rental
  const isProductAvailable = (productId: string, requestedQuantity: number) => {
    if (!productsData?.data) return false

    const product = productsData.data.find((p) => p.id === productId)
    return product ? product.availableQuantity >= requestedQuantity : false
  }

  // Get product details by ID
  const getProductById = (productId: string) => {
    if (!productsData?.data) return null
    return productsData.data.find((p) => p.id === productId) || null
  }

  // Calculate total price for selected products
  const calculateTotalPrice = (
    selections: Array<{ productId: string; quantity: number; duration: number }>,
  ) => {
    if (!productsData?.data) return 0

    return selections.reduce((total, selection) => {
      const product = getProductById(selection.productId)
      if (!product) return total

      const subtotal = product.hargaSewa * selection.quantity * selection.duration
      return total + subtotal
    }, 0)
  }

  return {
    products: productsData?.data || [],
    isLoading,
    error,
    pagination: productsData?.pagination,
    refetch,
    // Helper functions
    searchProducts,
    getProductsByCategory,
    isProductAvailable,
    getProductById,
    calculateTotalPrice,
  }
}

// Hook for real-time inventory checking
export function useInventoryCheck(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.produk.availableList({
      search: productId, // This might need adjustment based on API implementation
      available: true,
    }),
    queryFn: () => kasirApi.produk.getAvailable({ available: true }),
    enabled: enabled && !!productId,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 30000, // Consider stale after 30 seconds
    gcTime: 2 * 60 * 1000,
    select: (data) => {
      // Extract just the product we're checking
      const product = data.data.find((p) => p.id === productId)
      return product
        ? {
            id: product.id,
            name: product.name,
            availableQuantity: product.availableQuantity,
            hargaSewa: product.hargaSewa,
          }
        : null
    },
  })
}
