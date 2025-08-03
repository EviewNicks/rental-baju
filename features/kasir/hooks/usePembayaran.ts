'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi, KasirApiError } from '../api'
import type { CreatePembayaranRequest } from '../types'

// Hook for creating payment
export function useCreatePembayaran() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePembayaranRequest) => kasirApi.pembayaran.create(data),
    onSuccess: (newPembayaran, variables) => {
      // Invalidate transaction details to refresh payment info
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.details(),
      })

      // Invalidate transaction list to update amounts
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })

      // Invalidate dashboard stats to update revenue
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats(),
      })

      // Add payment to specific transaction cache if exists
      const transaksiQueries = queryClient.getQueriesData({
        queryKey: queryKeys.kasir.transaksi.details(),
      })

      transaksiQueries.forEach(([queryKey, queryData]) => {
        if (queryData && typeof queryData === 'object' && 'id' in queryData) {
          const transaction = queryData as Record<string, unknown>
          if (transaction.kode === variables.transaksiKode) {
            // Update the transaction with new payment
            queryClient.setQueryData(queryKey, {
              ...transaction,
              pembayaran: [...((transaction.pembayaran as unknown[]) || []), newPembayaran],
              jumlahBayar: (transaction.jumlahBayar as number) + newPembayaran.jumlah,
              sisaBayar:
                (transaction.totalHarga as number) -
                ((transaction.jumlahBayar as number) + newPembayaran.jumlah),
            })
          }
        }
      })
    },
    onError: (error: KasirApiError) => {
      console.error('Failed to create payment:', error.message)
    },
  })
}

// Hook for updating payment
export function useUpdatePembayaran() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<CreatePembayaranRequest, 'transaksiKode'>>
    }) => kasirApi.pembayaran.update(id, data),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.details(),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats(),
      })
    },
    onError: (error: KasirApiError) => {
      console.error('Failed to update payment:', error.message)
    },
  })
}

