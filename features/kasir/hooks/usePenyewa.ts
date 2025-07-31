'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi, KasirApiError } from '../api'
import type { 
  CreatePenyewaRequest, 
  UpdatePenyewaRequest, 
  PenyewaResponse,
  PenyewaQueryParams 
} from '../types/api'

// Hook for fetching penyewa list
export function usePenyewaList(params: PenyewaQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.kasir.penyewa.list(params),
    queryFn: () => kasirApi.penyewa.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching single penyewa
export function usePenyewa(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.penyewa.detail(id),
    queryFn: () => kasirApi.penyewa.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook for searching penyewa (debounced)
export function usePenyewaSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.penyewa.search(query),
    queryFn: () => kasirApi.penyewa.search(query),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
  })
}

// Hook for creating penyewa
export function useCreatePenyewa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePenyewaRequest) => kasirApi.penyewa.create(data),
    onSuccess: (newPenyewa) => {
      // Invalidate and refetch penyewa list
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.penyewa.lists(),
      })
      
      // Add the new penyewa to cache
      queryClient.setQueryData(
        queryKeys.kasir.penyewa.detail(newPenyewa.id),
        newPenyewa
      )
    },
    onError: (error: KasirApiError) => {
      // Error will be handled by the component
      console.error('Failed to create penyewa:', error.message)
    },
  })
}

// Hook for updating penyewa
export function useUpdatePenyewa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePenyewaRequest }) =>
      kasirApi.penyewa.update(id, data),
    onSuccess: (updatedPenyewa, { id }) => {
      // Update the penyewa in cache
      queryClient.setQueryData(
        queryKeys.kasir.penyewa.detail(id),
        updatedPenyewa
      )
      
      // Invalidate penyewa lists to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.penyewa.lists(),
      })
    },
    onError: (error: KasirApiError) => {
      console.error('Failed to update penyewa:', error.message)
    },
  })
}

// Combined hook for common penyewa operations
export function usePenyewaOperations() {
  const createPenyewa = useCreatePenyewa()
  const updatePenyewa = useUpdatePenyewa()

  return {
    createPenyewa: createPenyewa.mutate,
    updatePenyewa: updatePenyewa.mutate,
    isCreating: createPenyewa.isPending,
    isUpdating: updatePenyewa.isPending,
    createError: createPenyewa.error,
    updateError: updatePenyewa.error,
    isLoading: createPenyewa.isPending || updatePenyewa.isPending,
  }
}

// Helper hook for customer selection in forms
export function usePenyewaSelection() {
  const queryClient = useQueryClient()

  // Get recently accessed customers from cache
  const getRecentCustomers = (): PenyewaResponse[] => {
    const queries = queryClient.getQueriesData({
      queryKey: queryKeys.kasir.penyewa.details(),
    })
    
    return queries
      .map(([, data]) => data as PenyewaResponse)
      .filter(Boolean)
      .slice(0, 5) // Last 5 accessed customers
  }

  return {
    getRecentCustomers,
    search: (query: string) => kasirApi.penyewa.search(query),
  }
}