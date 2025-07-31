'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi, KasirApiError } from '../api'
import type { CreatePembayaranRequest } from '../types/api'

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
          if (transaction.id === variables.transaksiId) {
            // Update the transaction with new payment
            queryClient.setQueryData(queryKey, {
              ...transaction,
              pembayaran: [...((transaction.pembayaran as unknown[]) || []), newPembayaran],
              jumlahBayar: (transaction.jumlahBayar as number) + newPembayaran.jumlah,
              sisaBayar: (transaction.totalHarga as number) - ((transaction.jumlahBayar as number) + newPembayaran.jumlah),
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
      data 
    }: { 
      id: string
      data: Partial<Omit<CreatePembayaranRequest, 'transaksiId'>>
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

// Combined hook for payment operations
export function usePembayaranOperations() {
  const createPembayaran = useCreatePembayaran()
  const updatePembayaran = useUpdatePembayaran()

  // Helper function to process payment with validation
  const processPayment = async (
    transaksiId: string,
    jumlah: number,
    metode: 'tunai' | 'transfer' | 'kartu',
    referensi?: string,
    catatan?: string
  ) => {
    if (jumlah <= 0) {
      throw new Error('Jumlah pembayaran harus lebih dari 0')
    }

    const paymentData: CreatePembayaranRequest = {
      transaksiId,
      jumlah,
      metode,
      referensi,
      catatan,
    }

    return createPembayaran.mutateAsync(paymentData)
  }

  // Helper function to calculate payment summary
  const calculatePaymentSummary = (
    totalAmount: number,
    existingPayments: Array<{ jumlah: number }> = []
  ) => {
    const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.jumlah, 0)
    const remainingAmount = totalAmount - totalPaid
    const isFullyPaid = remainingAmount <= 0
    
    return {
      totalAmount,
      totalPaid,
      remainingAmount: Math.max(0, remainingAmount),
      isFullyPaid,
      paymentPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
    }
  }

  // Validate payment amount against remaining balance
  const validatePaymentAmount = (
    amount: number,
    remainingBalance: number
  ): { isValid: boolean; message?: string } => {
    if (amount <= 0) {
      return { isValid: false, message: 'Jumlah pembayaran harus lebih dari 0' }
    }
    
    if (amount > remainingBalance) {
      return { 
        isValid: false, 
        message: `Jumlah pembayaran (${formatCurrency(amount)}) melebihi sisa tagihan (${formatCurrency(remainingBalance)})` 
      }
    }
    
    return { isValid: true }
  }

  // Format currency for Indonesian locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Generate payment reference for transfer method
  const generatePaymentReference = (method: string, timestamp = new Date()) => {
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = timestamp.toTimeString().slice(0, 5).replace(':', '')
    const methodPrefix = method === 'transfer' ? 'TRF' : method === 'kartu' ? 'CRD' : 'CSH'
    
    return `${methodPrefix}-${dateStr}-${timeStr}`
  }

  return {
    // Mutation functions
    processPayment,
    updatePayment: updatePembayaran.mutate,
    
    // Loading states
    isProcessing: createPembayaran.isPending,
    isUpdating: updatePembayaran.isPending,
    isLoading: createPembayaran.isPending || updatePembayaran.isPending,
    
    // Error states
    createError: createPembayaran.error,
    updateError: updatePembayaran.error,
    error: createPembayaran.error || updatePembayaran.error,
    
    // Helper functions
    calculatePaymentSummary,
    validatePaymentAmount,
    formatCurrency,
    generatePaymentReference,
    
    // Success flags
    isSuccess: createPembayaran.isSuccess || updatePembayaran.isSuccess,
    
    // Reset functions
    resetCreateState: createPembayaran.reset,
    resetUpdateState: updatePembayaran.reset,
  }
}

// Hook for payment method options
export function usePaymentMethods() {
  const methods = [
    {
      value: 'tunai' as const,
      label: 'Tunai',
      icon: '💵',
      description: 'Pembayaran langsung dengan uang tunai',
      requiresReference: false,
    },
    {
      value: 'transfer' as const,
      label: 'Transfer Bank',
      icon: '🏦',
      description: 'Transfer ke rekening bank',
      requiresReference: true,
    },
    {
      value: 'kartu' as const,
      label: 'Kartu Debit/Kredit',
      icon: '💳',
      description: 'Pembayaran dengan kartu',
      requiresReference: true,
    },
  ]

  const getMethodByValue = (value: string) => {
    return methods.find(method => method.value === value)
  }

  const getMethodIcon = (value: string) => {
    return getMethodByValue(value)?.icon || '💰'
  }

  const getMethodLabel = (value: string) => {
    return getMethodByValue(value)?.label || value
  }

  const requiresReference = (value: string) => {
    return getMethodByValue(value)?.requiresReference || false
  }

  return {
    methods,
    getMethodByValue,
    getMethodIcon,
    getMethodLabel,
    requiresReference,
  }
}