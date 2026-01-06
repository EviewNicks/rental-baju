'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kasirApi } from '../api'
import { queryKeys } from '@/lib/react-query'

interface CancelTransactionOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface RefundData {
  refundAmount: number
  refundPercentage: number
  isEligible: boolean
  daysUntilPickup: number
}

/**
 * Custom hook for canceling transactions
 * Provides mutation for updating transaction status to cancelled with enhanced error handling and refund processing
 */
export function useCancelTransaction(
  transactionCode: string,
  options: CancelTransactionOptions = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options

  const cancelMutation = useMutation({
    mutationFn: async ({ 
      reason, 
      kasirId, 
      refundData 
    }: { 
      reason: string; 
      kasirId?: string; 
      refundData?: RefundData | null 
    }) => {
      // Update transaction status to cancelled with cancellation reason, kasirId, and refund data
      return kasirApi.transaksi.update(transactionCode, {
        status: 'cancelled',
        catatan: reason,
        kasirId, // ✅ EXISTING: Pass kasirId for refund processing
        refundData, // ✅ NEW: Pass refund calculation data
      })
    },
    onSuccess: async () => {
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

      onSuccess?.()
    },
    onError: (error) => {
      console.error('Cancel transaction API call failed', {
        transactionCode: transactionCode,
        error: error.message,
        errorName: error.name,
      })
      onError?.(error)
    },
  })

  return {
    cancelTransaction: (reason: string, kasirId?: string, refundData?: RefundData | null) => 
      cancelMutation.mutate({ reason, kasirId, refundData }),
    isProcessing: cancelMutation.isPending,
    error: cancelMutation.error,
    isError: cancelMutation.isError,
    isSuccess: cancelMutation.isSuccess,
    data: cancelMutation.data,
    reset: cancelMutation.reset,
  }
}
