/**
 * useCategories Hook - Category data management
 * Handles category fetching and management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryAdapter } from '../adapters/categoryAdapter'
import { queryKeys } from '@/lib/react-query'
import { toClientCategories, toClientCategory } from '../lib/utils/clientSafeConverters'
import type { ClientCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

/**
 * Hook for fetching categories list
 */
export function useCategories(params: { search?: string; includeProducts?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryAdapter.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    select: (data) => ({
      categories: toClientCategories(data.categories || []),
      total: data.categories?.length || 0,
    }),
  })
}

/**
 * Hook for fetching a single category
 */
export function useCategory(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryAdapter.getCategory(id),
    enabled: !!id && options?.enabled !== false,
    staleTime: 10 * 60 * 1000,
    select: (data) => toClientCategory(data),
  })
}

/**
 * Hook for creating a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryAdapter.createCategory(data),
    onSuccess: (newCategory) => {
      // Invalidate categories list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })

      // Add new category to cache
      queryClient.setQueryData(queryKeys.categories.detail(newCategory.id), newCategory)
    },
    onError: (error) => {
      console.error('Failed to create category:', error)
    },
  })
}

/**
 * Hook for updating an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoryAdapter.updateCategory(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.detail(id) })

      // Snapshot the previous value
      const previousCategory = queryClient.getQueryData(queryKeys.categories.detail(id))

      // Optimistically update the category
      if (previousCategory) {
        queryClient.setQueryData(queryKeys.categories.detail(id), {
          ...previousCategory,
          ...data,
          updatedAt: new Date().toISOString(),
        })
      }

      return { previousCategory }
    },
    onError: (error, { id }, context) => {
      // Revert the optimistic update on error
      if (context?.previousCategory) {
        queryClient.setQueryData(queryKeys.categories.detail(id), context.previousCategory)
      }
      console.error('Failed to update category:', error)
    },
    onSuccess: (updatedCategory) => {
      // Update the category in cache
      queryClient.setQueryData(queryKeys.categories.detail(updatedCategory.id), updatedCategory)

      // Invalidate categories list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
  })
}

/**
 * Hook for deleting a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoryAdapter.deleteCategory(id),
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.detail(id) })

      // Snapshot the previous value
      const previousCategory = queryClient.getQueryData(queryKeys.categories.detail(id))

      // Remove the category from cache optimistically
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) })

      // Update lists to remove the category optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.categories.lists() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (oldData: any) => {
          if (!oldData?.categories) return oldData
          return {
            ...oldData,
            categories: oldData.categories.filter((category: any) => category.id !== id),
          }
        },
      )

      return { previousCategory }
    },
    onError: (error, id, context) => {
      // Revert optimistic updates on error
      if (context?.previousCategory) {
        queryClient.setQueryData(queryKeys.categories.detail(id), context.previousCategory)
      }
      // Invalidate to refetch and restore correct state
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      console.error('Failed to delete category:', error)
    },
    onSuccess: () => {
      // Invalidate all category lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
  })
}
