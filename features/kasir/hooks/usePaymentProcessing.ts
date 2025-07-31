'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kasirApi } from '../api'
import { queryKeys } from '@/lib/react-query'
import type { CreatePembayaranRequest } from '../lib/validation/kasirSchema'
import type { PembayaranResponse } from '../types/api'

interface PaymentProcessingOptions {
  onSuccess?: (data: PembayaranResponse) => void
  onError?: (error: Error) => void
}

/**
 * Custom hook for processing payments
 * Provides mutation for creating payments with optimistic updates
 */
export function usePaymentProcessing(
  transactionId: string,
  options: PaymentProcessingOptions = {}
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: Omit<CreatePembayaranRequest, 'transaksiId'>) => {
      return kasirApi.pembayaran.create({
        ...paymentData,
        transaksiId: transactionId,
      })
    },
    onSuccess: (data) => {
      // Invalidate and refetch transaction detail (base query)
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionId)
      })
      
      // Invalidate transformed query to ensure UI updates immediately
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.kasir.transaksi.detail(transactionId), 'transformed']
      })
      
      // Invalidate transactions list to update any cached list data
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists()
      })
      
      // Invalidate dashboard stats as payment affects overall stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats()
      })

      onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Payment processing failed:', error)
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