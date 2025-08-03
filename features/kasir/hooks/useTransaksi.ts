'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi, KasirApiError } from '../api'
import type {
  CreateTransaksiRequest,
  UpdateTransaksiRequest,
  TransaksiQueryParams,
  TransactionStatus,
} from '../types'

// Hook for fetching transaksi list
export function useTransaksiList(params: TransaksiQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.kasir.transaksi.list(params),
    queryFn: () => kasirApi.transaksi.getAll(params),
    staleTime: 1 * 30 * 1000, // 1 minute - transaction status changes frequently
    gcTime: 3 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching single transaksi
export function useTransaksi(kode: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.transaksi.detail(kode),
    queryFn: () => kasirApi.transaksi.getByKode(kode),
    enabled: enabled && !!kode,
    staleTime: 1 * 30 * 1000,
    gcTime: 3 * 60 * 1000,
  })
}

// Hook for transaksi by status
export function useTransaksiByStatus(status: TransactionStatus, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.transaksi.byStatus(status),
    queryFn: () => kasirApi.transaksi.getByStatus(status),
    enabled: enabled && !!status,
    staleTime: 1 * 30 * 1000,
    gcTime: 3 * 60 * 1000,
  })
}

// Hook for searching transaksi
export function useTransaksiSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kasir.transaksi.search(query),
    queryFn: () => kasirApi.transaksi.search(query),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 1 * 30 * 1000, // 1 minute for search results
    gcTime: 3 * 60 * 1000,
  })
}

// Hook for creating transaksi
export function useCreateTransaksi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransaksiRequest) => kasirApi.transaksi.create(data),
    onSuccess: (newTransaksi) => {
      // Invalidate and refetch transaksi lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })

      // Add the new transaksi to cache
      queryClient.setQueryData(queryKeys.kasir.transaksi.detail(newTransaksi.kode), newTransaksi)

      // Invalidate specific transaction detail to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(newTransaksi.kode),
      })

      // Invalidate transformed cache used by PaymentSummaryCard
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.kasir.transaksi.detail(newTransaksi.kode), 'transformed'],
      })

      // 🔧 CACHE FIX: Invalidate product availability cache after successful transaction
      // This ensures users see fresh inventory data after any transaction
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.produk.all(),
      })
      
      console.log('[useTransaksi] Cache invalidation completed', {
        transactionCode: newTransaksi.kode,
        cacheKeysInvalidated: ['transaksi.lists', 'produk.all'],
        timestamp: new Date().toISOString()
      })

      // Invalidate payment cache for this transaction
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.pembayaran.byTransaksi(newTransaksi.id),
      })

      // Also invalidate dashboard stats as they may have changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats(),
      })
    },
    onError: (error: KasirApiError) => {
      // Error will be handled by the component
      console.error('Failed to create transaksi:', error.message)
      
      // Enhanced error logging for cache-related issues
      if (error.message.includes('tidak mencukupi') || error.message.includes('Tersedia')) {
        console.warn('[useTransaksi] 🔄 Inventory conflict detected - possible cache staleness', {
          error: error.message,
          timestamp: new Date().toISOString(),
          suggestion: 'User may have been viewing stale inventory data',
          solution: 'Cache has been optimized to 30s refresh',
        })

        // Proactively invalidate product cache on inventory conflicts
        queryClient.invalidateQueries({
          queryKey: queryKeys.kasir.produk.all(),
        })
      }
    },
  })
}

// Hook for updating transaksi
export function useUpdateTransaksi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ kode, data }: { kode: string; data: UpdateTransaksiRequest }) =>
      kasirApi.transaksi.update(kode, data),
    onSuccess: (updatedTransaksi, { kode }) => {
      // Update the transaksi in cache
      queryClient.setQueryData(queryKeys.kasir.transaksi.detail(kode), updatedTransaksi)

      // Invalidate transaksi lists to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })

      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats(),
      })
    },
    onError: (error: KasirApiError) => {
      console.error('Failed to update transaksi:', error.message)
    },
  })
}

