/**
 * usePublicProducts Hook - Public product data management for homepage
 *
 * React Query hooks for fetching public product data without authentication.
 * Used specifically for homepage FeaturedItemsSection integration.
 * Follows pattern from useMaterials.ts for consistency.
 */

import { useQuery } from '@tanstack/react-query'
import {
  publicProductApi,
  type PublicProductQueryParams,
  type PublicProduct
} from '../api/publicProductApi'

// Query keys following established pattern
const queryKeys = {
  publicProducts: {
    all: ['public-products'] as const,
    list: (params: PublicProductQueryParams | undefined) => ['public-products', 'list', params] as const,
    featured: (limit: number) => ['public-products', 'featured', limit] as const,
    search: (query: string, params: PublicProductQueryParams | undefined) => ['public-products', 'search', query, params] as const,
    category: (categoryId: string, params: PublicProductQueryParams | undefined) => ['public-products', 'category', categoryId, params] as const,
    status: (status: string, params: PublicProductQueryParams | undefined) => ['public-products', 'status', status, params] as const,
  }
}

/**
 * Hook to fetch public products with optional parameters
 * General purpose hook for any public product queries
 */
export function usePublicProducts(params?: PublicProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.publicProducts.list(params),
    queryFn: () => publicProductApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - public product data doesn't change often
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Hook specifically for homepage featured products
 * Optimized for homepage usage with reasonable defaults
 */
export function useFeaturedProducts(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.publicProducts.featured(limit),
    queryFn: () => publicProductApi.getFeaturedProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus for better user experience
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for searching public products
 * Used when users want to search for specific items
 */
export function useSearchPublicProducts(query: string, params?: Omit<PublicProductQueryParams, 'search'>) {
  return useQuery({
    queryKey: queryKeys.publicProducts.search(query, params),
    queryFn: () => publicProductApi.searchProducts(query, params),
    enabled: query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    retry: 2, // Less retries for search
  })
}

/**
 * Hook for getting products by category
 * Used for category-specific product listings
 */
export function usePublicProductsByCategory(categoryId: string, params?: Omit<PublicProductQueryParams, 'categoryId'>) {
  return useQuery({
    queryKey: queryKeys.publicProducts.category(categoryId, params),
    queryFn: () => publicProductApi.getProductsByCategory(categoryId, params),
    enabled: !!categoryId, // Only run when categoryId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 3,
  })
}

/**
 * Hook for getting products by status
 * Used for filtering products by availability status
 */
export function usePublicProductsByStatus(
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE',
  params?: Omit<PublicProductQueryParams, 'status'>
) {
  return useQuery({
    queryKey: queryKeys.publicProducts.status(status, params),
    queryFn: () => publicProductApi.getProductsByStatus(status, params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 3,
  })
}

/**
 * Hook for getting single product detail by ID
 * Used for public product detail pages
 */
export function usePublicProductDetail(id: string) {
  return useQuery({
    queryKey: ['public-products', 'detail', id],
    queryFn: () => publicProductApi.getProductDetail(id),
    enabled: !!id, // Only run when ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Helper hook for transforming single product detail for UI consumption
 * Provides computed properties and formatted data for detail page
 */
export function useTransformedProductDetail(id: string) {
  const { data, isLoading, error, isError } = usePublicProductDetail(id)

  // Transform data for UI consumption
  const transformedData = data ? {
    ...data,
    // Add computed properties for UI
    hasMultipleSizes: data.sizes.length > 1,
    displaySizes: data.sizes.map(size => `${size.size} (${size.ageCategory})`),
    totalQuantity: data.sizes.reduce((sum, size) => sum + size.quantity, 0),
    isAvailable: data.status === 'AVAILABLE',
    hasColor: !!data.color,
    hasDescription: !!data.description,
    // Add rental-specific computed values
    rentalInfo: {
      dailyPrice: data.currentPrice,
      itemValue: data.modalAwal,
      categoryColor: data.category.color,
      categoryName: data.category.name,
    },
    // Add availability info
    availabilityInfo: {
      status: data.status,
      isInStock: data.sizes.some(size => size.quantity > 0),
      availableSizes: data.sizes.filter(size => size.quantity > 0),
      totalStock: data.sizes.reduce((sum, size) => sum + size.quantity, 0),
    }
  } : undefined

  return {
    data: transformedData,
    product: transformedData,
    isLoading,
    error,
    isError,
    isNotFound: isError && error?.message?.includes('tidak ditemukan'),
    isEmpty: !isLoading && !transformedData
  }
}

/**
 * Helper hook for transforming public product data for UI consumption
 * Provides computed properties and formatted data for components
 */
export function useTransformedFeaturedProducts(limit: number = 10) {
  const { data, isLoading, error, isError } = useFeaturedProducts(limit)

  // Transform data for UI consumption
  const transformedData = data ? {
    ...data,
    products: data.products.map((product: PublicProduct) => ({
      ...product,
      // Add computed properties for UI
      hasMultipleSizes: product.sizes.length > 1,
      displaySize: product.sizes.length === 1
        ? `${product.sizes[0].size} (${product.sizes[0].ageCategory})`
        : `${product.sizes.length} ukuran`,
      isAvailable: product.status === 'AVAILABLE',
      hasColor: !!product.color,
      // Add rental-specific computed values
      rentalInfo: {
        dailyPrice: product.currentPrice,
        itemValue: product.modalAwal,
        categoryColor: product.category.color,
        categoryName: product.category.name,
      }
    }))
  } : undefined

  return {
    data: transformedData,
    products: transformedData?.products || [],
    pagination: transformedData?.pagination,
    isLoading,
    error,
    isError,
    isEmpty: !isLoading && (!transformedData?.products || transformedData.products.length === 0)
  }
}