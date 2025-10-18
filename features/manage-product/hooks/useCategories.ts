/**
 * Simplified useCategories Hook - Category data management
 * Simple data fetching without over-engineering
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryApi } from '../api'

// Simple query keys
const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: (params: { search?: string; isActive?: boolean; includeProducts?: boolean } | undefined) => ['categories', 'list', params] as const,
  }
}

// === CATEGORIES ===
export function useCategories(params?: { search?: string; isActive?: boolean; includeProducts?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryApi.getCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string } }) =>
      categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

