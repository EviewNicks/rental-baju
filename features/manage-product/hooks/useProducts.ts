/**
 * Simplified useProducts Hook - Data fetching for products
 * Replaces multiple complex hooks with simple, direct approach
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../api'
import type { Product } from '../types'

// Simple query key factory
const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: any) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
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
}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.getProducts(params),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  })
}

// Single product hook
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  })
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, any> }) =>
      productApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
  })
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}