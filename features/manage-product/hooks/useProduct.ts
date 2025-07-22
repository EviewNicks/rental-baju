/**
 * useProduct Hook - Single product operations and mutations
 * Handles individual product CRUD operations with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAdapter } from '../adapters/productAdapter'
import { queryKeys } from '@/lib/react-query'
import type { CreateProductRequest, UpdateProductRequest } from '../adapters/types/requests'
import type { ProductResponse } from '../adapters/types/responses'
import { Product } from '../types'

/**
 * Hook for fetching a single product
 */
export function useProduct(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productAdapter.getProduct(id),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for creating a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productAdapter.createProduct(data),
    onSuccess: (newProduct: ProductResponse) => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
      
      // Add new product to cache
      queryClient.setQueryData(queryKeys.products.detail(newProduct.id), newProduct)
    },
    onError: (error) => {
      console.error('Failed to create product:', error)
    },
  })
}

/**
 * Hook for updating an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) => 
      productAdapter.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) })

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id))

      // Optimistically update the product
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), {
          ...previousProduct,
          ...data,
          updatedAt: new Date().toISOString(),
        })
      }

      // Return a context with the snapshotted value
      return { previousProduct }
    },
    onError: (error, { id }, context) => {
      // Revert the optimistic update on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct)
      }
      console.error('Failed to update product:', error)
    },
    onSuccess: (updatedProduct: ProductResponse) => {
      // Update the product in cache
      queryClient.setQueryData(queryKeys.products.detail(updatedProduct.id), updatedProduct)
      
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}

/**
 * Hook for updating product status specifically
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' }) =>
      productAdapter.updateProductStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) })
      
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id))
      
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), {
          ...previousProduct,
          status,
          updatedAt: new Date().toISOString(),
        })
      }
      
      return { previousProduct }
    },
    onError: (error, { id }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct)
      }
      console.error('Failed to update product status:', error)
    },
    onSuccess: (updatedProduct: ProductResponse) => {
      queryClient.setQueryData(queryKeys.products.detail(updatedProduct.id), updatedProduct)
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productAdapter.deleteProduct(id),
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) })
      
      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id))
      
      // Remove the product from cache optimistically
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) })
      
      // Update lists to remove the product optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (oldData: any) => {
          if (!oldData?.products) return oldData
          return {
            ...oldData,
            products: oldData.products.filter((product: Product) => product.id !== id),
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total - 1,
            },
          }
        }
      )
      
      return { previousProduct }
    },
    onError: (error, id, context) => {
      // Revert optimistic updates on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct)
      }
      // Invalidate to refetch and restore correct state
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
      console.error('Failed to delete product:', error)
    },
    onSuccess: () => {
      // Invalidate all product lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}

/**
 * Hook for checking if product code exists (for validation)
 */
export function useCheckProductCode() {
  return useMutation({
    mutationFn: (code: string) => productAdapter.checkProductCode(code),
  })
}