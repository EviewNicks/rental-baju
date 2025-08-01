'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kasirApi } from '../api'
import { queryKeys } from '@/lib/react-query'
import { logger } from '@/lib/client-logger'
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
  transactionCode: string,
  options: PaymentProcessingOptions = {}
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: Omit<CreatePembayaranRequest, 'transaksiKode'>) => {
      logger.debug('🚀 Starting payment API call', {
        transactionCode: transactionCode,
        paymentAmount: paymentData.jumlah,
        paymentMethod: paymentData.metode,
      })
      
      return kasirApi.pembayaran.create({
        ...paymentData,
        transaksiKode: transactionCode,
      })
    },
    onSuccess: async (data) => {
      logger.info('✅ Payment API call successful, starting enhanced cache invalidation', {
        transactionCode: transactionCode,
        paymentId: data.id,
        paymentAmount: data.jumlah,
      })
      
      // 🔥 FIX: Optimistic update first for immediate UI feedback
      const optimisticActivity = {
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'paid' as const,
        description: `Pembayaran ${data.metode} sebesar Rp ${data.jumlah.toLocaleString('id-ID')}`,
        performedBy: 'current-user',
        details: {
          amount: data.jumlah,
          method: data.metode
        }
      }
      
      logger.debug('🚀 Applying optimistic update for immediate UI feedback', {
        transactionCode: transactionCode,
        optimisticActivityId: optimisticActivity.id
      })
      
      // Apply optimistic update to transformed cache
      queryClient.setQueryData(
        [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
        (oldData: any) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            timeline: [optimisticActivity, ...(oldData.timeline || [])],
            amountPaid: (oldData.amountPaid || 0) + data.jumlah,
            remainingAmount: Math.max(0, (oldData.totalAmount || 0) - ((oldData.amountPaid || 0) + data.jumlah)),
            payments: [
              {
                id: data.id,
                amount: data.jumlah,
                method: data.metode,
                timestamp: new Date().toISOString(),
                type: 'rental' as const,
                reference: data.referensi
              },
              ...(oldData.payments || [])
            ]
          }
        }
      )
      
      // 🔥 FIX: Add delay to ensure backend transaction is fully committed
      logger.debug('⏱️ Adding delay for backend transaction consistency')
      await new Promise(resolve => setTimeout(resolve, 300)) // Wait 300ms for backend consistency
      
      // 🔥 FIX: Enhanced cache invalidation with retry mechanism
      logger.debug('🔄 Starting cache refetch with retry mechanism', {
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode)
      })
      
      let retryCount = 0
      const maxRetries = 3
      let refetchSuccess = false
      
      while (!refetchSuccess && retryCount < maxRetries) {
        try {
          logger.debug(`🔄 Cache refetch attempt ${retryCount + 1}/${maxRetries}`)
          
          // Refetch base query first and wait for completion
          await queryClient.refetchQueries({
            queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
            type: 'active'
          })
          
          // Small delay between queries
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Then refetch transformed query to ensure UI components get fresh data
          logger.debug('🔄 Refetching transformed cache for UI components', {
            queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed']
          })
          await queryClient.refetchQueries({
            queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
            type: 'active'
          })
          
          refetchSuccess = true
          logger.info(`✅ Cache refetch successful on attempt ${retryCount + 1}`)
          break
          
        } catch (error) {
          retryCount++
          logger.error(`❌ Cache refetch attempt ${retryCount} failed`, {
            transactionCode: transactionCode,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          })
          
          if (retryCount < maxRetries) {
            // Exponential backoff
            const delay = 500 * Math.pow(2, retryCount - 1)
            logger.debug(`⏱️ Waiting ${delay}ms before retry`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      if (!refetchSuccess) {
        logger.error('💥 All cache refetch attempts failed, falling back to invalidation', {
          transactionCode: transactionCode,
          maxRetries
        })
        
        // Fallback to invalidation if all retries fail
        queryClient.invalidateQueries({
          queryKey: queryKeys.kasir.transaksi.detail(transactionCode)
        })
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed']
        })
      }
      
      // Invalidate related queries (no need to wait for these)
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists()
      })
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.dashboard.stats()
      })
      
      logger.info('🎉 Enhanced cache invalidation completed - UI should update immediately')
      onSuccess?.(data)
    },
    onError: (error) => {
      logger.error('❌ Payment API call failed', {
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