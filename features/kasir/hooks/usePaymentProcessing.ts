'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kasirApi } from '../api'
import { queryKeys } from '@/lib/react-query'
import type { CreatePembayaranRequest } from '../lib/validation/kasirSchema'
import type { PembayaranResponse } from '../types'

interface PaymentProcessingOptions {
  onSuccess?: (data: PembayaranResponse) => void
  onError?: (error: Error) => void
}

/**
 * Custom hook for processing payments
 * Provides mutation for creating payments with optimistic updates
 */
export function usePaymentProcessing(
  transactionCode: string,
  options: PaymentProcessingOptions = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: Omit<CreatePembayaranRequest, 'transaksiKode'>) => {
      return kasirApi.pembayaran.create({
        ...paymentData,
        transaksiKode: transactionCode,
      })
    },
    onSuccess: async (data) => {
      // Optimistic update for immediate UI feedback
      const optimisticActivity = {
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'paid' as const,
        description: `Pembayaran ${data.metode} sebesar Rp ${data.jumlah.toLocaleString('id-ID')}`,
        performedBy: 'current-user',
        details: {
          amount: data.jumlah,
          method: data.metode,
        },
      }

      // Apply optimistic update to transformed cache
      queryClient.setQueryData(
        [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData

          const typedData = oldData as Record<string, unknown>
          return {
            ...typedData,
            timeline: [optimisticActivity, ...((typedData.timeline as unknown[]) || [])],
            amountPaid: ((typedData.amountPaid as number) || 0) + data.jumlah,
            remainingAmount: Math.max(
              0,
              ((typedData.totalAmount as number) || 0) - (((typedData.amountPaid as number) || 0) + data.jumlah),
            ),
            payments: [
              {
                id: data.id,
                amount: data.jumlah,
                method: data.metode,
                timestamp: new Date().toISOString(),
                type: 'rental' as const,
                reference: data.referensi,
              },
              ...((typedData.payments as unknown[]) || []),
            ],
          }
        },
      )

      // Wait for backend transaction to be fully committed
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Enhanced cache invalidation with retry mechanism

      let retryCount = 0
      const maxRetries = 3
      let refetchSuccess = false

      while (!refetchSuccess && retryCount < maxRetries) {
        try {
          // Refetch base query first and wait for completion
          await queryClient.refetchQueries({
            queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
            type: 'active',
          })

          // Small delay between queries
          await new Promise((resolve) => setTimeout(resolve, 100))

          await queryClient.refetchQueries({
            queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
            type: 'active',
          })

          refetchSuccess = true
          break
        } catch (error) {
          retryCount++
          console.error(`Cache refetch attempt ${retryCount} failed`, {
            transactionCode: transactionCode,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount,
          })

          if (retryCount < maxRetries) {
            // Exponential backoff
            const delay = 500 * Math.pow(2, retryCount - 1)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      if (!refetchSuccess) {
        console.error('All cache refetch attempts failed, falling back to invalidation', {
          transactionCode: transactionCode,
          maxRetries,
        })

        // Fallback to invalidation if all retries fail
        queryClient.invalidateQueries({
          queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
        })
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
        })
      }

      // Invalidate related queries (no need to wait for these)
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats(),
      })

      onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Payment API call failed', {
        transactionCode: transactionCode,
        error: error.message,
        errorName: error.name,
      })
      onError?.(error)
    },
  })

  return {
    processPayment: paymentMutation.mutate,
    isProcessing: paymentMutation.isPending,
    error: paymentMutation.error,
    isError: paymentMutation.isError,
    isSuccess: paymentMutation.isSuccess,
    data: paymentMutation.data,
    reset: paymentMutation.reset,
  }
}

/**
 * Hook for getting payment method options
 */
export function usePaymentMethods() {
  const paymentMethods = [
    { value: 'tunai', label: 'Tunai', requiresReference: false },
    { value: 'transfer', label: 'Transfer Bank', requiresReference: true },
    { value: 'kartu', label: 'QRIS/Kartu', requiresReference: true },
  ] as const

  return { paymentMethods }
}
