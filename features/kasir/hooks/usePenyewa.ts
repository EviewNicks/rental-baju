'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi, KasirApiError } from '../api'
import type { CreatePenyewaRequest, UpdatePenyewaRequest, PenyewaQueryParams, PenyewaResponse } from '../types'

// Hook for fetching penyewa list with pagination support
export function usePenyewaList(params: PenyewaQueryParams = {}) {
  // Set default pagination parameters
  const queryParams = {
    page: 1,
    limit: 20,
    ...params,
  }

  return useQuery({
    queryKey: queryKeys.kasir.penyewa.list(queryParams),
    queryFn: () => kasirApi.penyewa.getAll(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Enhanced error handling
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx) except timeout and rate limit
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false
        }
      }
      return failureCount < 2
    },
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  })
}

// Hook for fetching single penyewa
export function usePenyewa(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.penyewa.detail(id),
    queryFn: () => kasirApi.penyewa.getById(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook for searching penyewa with pagination support
export function usePenyewaSearch(query: string, enabled = true, params: Omit<PenyewaQueryParams, 'search'> = {}) {
  // Set default pagination parameters for search
  const searchParams = {
    search: query,
    page: 1,
    limit: 20,
    ...params,
  }

  return useQuery({
    queryKey: queryKeys.kasir.penyewa.search(query, searchParams),
    queryFn: () => kasirApi.penyewa.getAll(searchParams),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
    // Enhanced error handling for search
    retry: (failureCount, error) => {
      // Don't retry search on client errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number
        if (status >= 400 && status < 500) {
          return false
        }
      }
      return failureCount < 1 // Only retry once for search
    },
    // Keep previous search results while fetching new ones
    placeholderData: (previousData) => previousData,
    // Debounce search queries
    refetchOnWindowFocus: false,
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
      queryClient.setQueryData(queryKeys.kasir.penyewa.detail(newPenyewa.id), newPenyewa)
    },
    onError: (error: KasirApiError) => {
      // Error will be handled by the component
      console.error('Failed to create penyewa:', error.message)
    },
  })
}

// Hook for updating penyewa with optimistic updates
export function useUpdatePenyewa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePenyewaRequest }) => 
      kasirApi.penyewa.update(id, data),
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.kasir.penyewa.detail(id) })

      // Snapshot the previous value
      const previousPenyewa = queryClient.getQueryData(queryKeys.kasir.penyewa.detail(id))

      // Optimistically update the cache
      if (previousPenyewa) {
        queryClient.setQueryData(queryKeys.kasir.penyewa.detail(id), {
          ...previousPenyewa,
          ...data,
          updatedAt: new Date().toISOString(),
        })
      }

      // Return context with the previous and new data
      return { previousPenyewa, id }
    },
    onSuccess: (updatedPenyewa, { id }) => {
      // Update the specific penyewa in cache with server response
      queryClient.setQueryData(queryKeys.kasir.penyewa.detail(id), updatedPenyewa)

      // Update penyewa in list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.kasir.penyewa.lists() },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object' || !('data' in oldData)) return oldData
          
          const typedOldData = oldData as { data: Array<{ id: string }> }
          if (!typedOldData.data) return oldData
          
          return {
            ...typedOldData,
            data: typedOldData.data.map((penyewa) =>
              penyewa.id === id ? updatedPenyewa : penyewa
            ),
          }
        }
      )

      // Update search results caches
      queryClient.setQueriesData(
        { queryKey: ['kasir', 'penyewa', 'list', 'search'] },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object' || !('data' in oldData)) return oldData
          
          const typedOldData = oldData as { data: Array<{ id: string }> }
          if (!typedOldData.data) return oldData
          
          return {
            ...typedOldData,
            data: typedOldData.data.map((penyewa) =>
              penyewa.id === id ? updatedPenyewa : penyewa
            ),
          }
        }
      )
    },
    onError: (error: KasirApiError, { id }, context) => {
      // Rollback optimistic update on error
      if (context?.previousPenyewa) {
        queryClient.setQueryData(queryKeys.kasir.penyewa.detail(id), context.previousPenyewa)
      }
      
      // Error will be handled by the component
      console.error('Failed to update penyewa:', error.message)
      throw error // Re-throw to allow component error handling
    },
    onSettled: (data, error, { id }) => {
      // Always refetch the penyewa detail to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.kasir.penyewa.detail(id) })
    },
  })
}

// Hook for prefetching penyewa data (performance optimization)
export function usePrefetchPenyewa() {
  const queryClient = useQueryClient()

  const prefetchPenyewaList = (params: PenyewaQueryParams = {}) => {
    const queryParams = {
      page: 1,
      limit: 20,
      ...params,
    }

    return queryClient.prefetchQuery({
      queryKey: queryKeys.kasir.penyewa.list(queryParams),
      queryFn: () => kasirApi.penyewa.getAll(queryParams),
      staleTime: 2 * 60 * 1000,
    })
  }

  const prefetchPenyewaDetail = (id: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.kasir.penyewa.detail(id),
      queryFn: () => kasirApi.penyewa.getById(id),
      staleTime: 2 * 60 * 1000,
    })
  }

  return {
    prefetchPenyewaList,
    prefetchPenyewaDetail,
  }
}

// Hook for cache invalidation utilities
export function usePenyewaCache() {
  const queryClient = useQueryClient()

  const invalidateAllPenyewa = () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.kasir.penyewa.all(),
    })
  }

  const invalidatePenyewaLists = () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.kasir.penyewa.lists(),
    })
  }

  const invalidatePenyewaDetail = (id: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.kasir.penyewa.detail(id),
    })
  }

  const removePenyewaFromCache = (id: string) => {
    queryClient.removeQueries({
      queryKey: queryKeys.kasir.penyewa.detail(id),
    })
  }

  const updatePenyewaInCache = (id: string, updater: (old: PenyewaResponse | undefined) => PenyewaResponse) => {
    queryClient.setQueryData(queryKeys.kasir.penyewa.detail(id), updater)
  }

  return {
    invalidateAllPenyewa,
    invalidatePenyewaLists,
    invalidatePenyewaDetail,
    removePenyewaFromCache,
    updatePenyewaInCache,
  }
}

// Hook for getting cached penyewa data without triggering a request
export function usePenyewaFromCache(id: string) {
  const queryClient = useQueryClient()
  
  return queryClient.getQueryData<PenyewaResponse>(queryKeys.kasir.penyewa.detail(id))
}

