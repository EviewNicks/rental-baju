/**
 * Simplified useCategories Hook - Category and Color data management
 * Simple data fetching without over-engineering
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryApi, colorApi } from '../api'

// Simple query keys
const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: (params: any) => ['categories', 'list', params] as const,
  },
  colors: {
    all: ['colors'] as const,
    list: (params: any) => ['colors', 'list', params] as const,
  }
}

// === CATEGORIES ===
export function useCategories(params?: { search?: string; isActive?: boolean }) {
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
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
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

// === COLORS ===
export function useColors(params?: { 
  search?: string 
  isActive?: boolean 
  includeProducts?: boolean 
}) {
  return useQuery({
    queryKey: queryKeys.colors.list(params),
    queryFn: () => colorApi.getColors(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - colors don't change often
  })
}

export function useCreateColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: colorApi.createColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colors.all })
    },
  })
}

export function useUpdateColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string
      data: { name?: string; hexCode?: string; description?: string } 
    }) => colorApi.updateColor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colors.all })
    },
  })
}

export function useDeleteColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: colorApi.deleteColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.colors.all })
    },
  })
}