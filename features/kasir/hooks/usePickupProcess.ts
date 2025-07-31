'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { KasirApiError } from '../api'

/**
 * Pickup request interface matching API contract
 */
export interface PickupItemRequest {
  id: string // TransaksiItem.id
  jumlahDiambil: number // Quantity to pick up
}

export interface PickupRequest {
  items: PickupItemRequest[]
}

export interface PickupResponse {
  success: boolean
  message: string
  data: {
    transaction: {
      id: string
      kode: string
      // ... full transaction data as per API response
    }
  }
}

/**
 * Process pickup API call
 */
async function processPickup(
  transactionCode: string,
  data: PickupRequest
): Promise<PickupResponse> {
  const response = await fetch(`/api/kasir/transaksi/${transactionCode}/ambil`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    const error = result.error || {
      code: 'PICKUP_ERROR',
      message: result.message || 'Gagal memproses pickup',
    }
    
    throw new KasirApiError(
      error.code,
      error.message,
      error.details
    )
  }

  return result
}

/**
 * Custom hook for processing pickup operations
 * Follows TanStack Query patterns with proper error handling
 */
export function usePickupProcess(transactionCode: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PickupRequest) => processPickup(transactionCode, data),
    
    onMutate: async () => {
      // Cancel any outgoing refetches for transaction detail
      await queryClient.cancelQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode)
      })

      // Snapshot the current transaction data for rollback
      const previousTransaction = queryClient.getQueryData(
        queryKeys.kasir.transaksi.detail(transactionCode)
      )

      // Optimistically update the pickup quantities
      // This would require more complex logic to update the cached data
      // For now, we'll rely on refetch after success

      // Return context for error rollback
      return { previousTransaction }
    },

    onError: (error, _, context) => {
      // Roll back to previous state if needed
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          queryKeys.kasir.transaksi.detail(transactionCode),
          context.previousTransaction
        )
      }

      console.error('Pickup failed:', error)
    },

    onSuccess: (data) => {
      // Invalidate and refetch transaction detail to get updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode)
      })

      // Also invalidate transaction list in case it's displayed elsewhere
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists()
      })

      console.log('Pickup successful:', data.message)
    },

    onSettled: () => {
      // Always refetch transaction detail after pickup attempt
      queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode)
      })
    },

    // Retry configuration for pickup operations
    retry: (failureCount, error) => {
      // Don't retry validation errors or client errors
      if (error instanceof KasirApiError) {
        const retryableCodes = ['NETWORK_ERROR', 'INTERNAL_SERVER_ERROR']
        return retryableCodes.includes(error.code) && failureCount < 2
      }
      return false
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}

/**
 * Helper hook for pickup validation
 * Validates pickup request before submission
 */
export function usePickupValidation() {
  return {
    validatePickupItems: (
      items: PickupItemRequest[],
      transactionItems: Array<{
        id: string
        jumlah: number
        jumlahDiambil: number
        produk: { name: string }
      }>
    ) => {
      const errors: string[] = []

      if (!items.length) {
        errors.push('Minimal satu item harus dipilih untuk pickup')
        return { valid: false, errors }
      }

      for (const pickupItem of items) {
        const transactionItem = transactionItems.find(ti => ti.id === pickupItem.id)
        
        if (!transactionItem) {
          errors.push(`Item dengan ID ${pickupItem.id} tidak ditemukan`)
          continue
        }

        const remainingQuantity = transactionItem.jumlah - transactionItem.jumlahDiambil
        
        if (pickupItem.jumlahDiambil <= 0) {
          errors.push(`Jumlah pickup untuk ${transactionItem.produk.name} harus lebih dari 0`)
        }
        
        if (pickupItem.jumlahDiambil > remainingQuantity) {
          errors.push(
            `Jumlah pickup untuk ${transactionItem.produk.name} (${pickupItem.jumlahDiambil}) ` +
            `melebihi sisa yang belum diambil (${remainingQuantity})`
          )
        }
      }

      return {
        valid: errors.length === 0,
        errors
      }
    }
  }
}

/**
 * Error handling utility for pickup operations
 */
export function getPickupErrorMessage(error: unknown): string {
  if (error instanceof KasirApiError) {
    switch (error.code) {
      case 'TRANSACTION_NOT_FOUND':
        return 'Transaksi tidak ditemukan'
      case 'VALIDATION_ERROR':
        return 'Data pickup tidak valid'
      case 'PICKUP_PROCESSING_FAILED':
        return 'Gagal memproses pickup. Silakan coba lagi.'
      case 'NETWORK_ERROR':
        return 'Koneksi bermasalah. Silakan cek koneksi internet Anda.'
      default:
        return error.message || 'Terjadi kesalahan saat memproses pickup'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Terjadi kesalahan tidak terduga'
}