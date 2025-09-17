'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { TransactionDetail, TransactionStatus, TransaksiItemResponse } from '../types'
import type { TransaksiResponse } from '../types'
import { calculateEnhancedStatus } from '../lib/utils/statusUtils'

interface UseTransactionDetailOptions {
  enabled?: boolean
  refetchInterval?: number
}

/**
 * Custom hook for fetching individual transaction details
 * Replaces mock data with real API integration via kasirApi
 */
export function useTransactionDetail(
  transactionId: string,
  options: UseTransactionDetailOptions = {},
) {
  const { enabled = true, refetchInterval } = options

  // Fetch transaction detail with React Query
  const {
    data: apiData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.kasir.transaksi.detail(transactionId),
    queryFn: () => {
      return kasirApi.transaksi.getByKode(transactionId)
    },
    enabled: enabled && !!transactionId,
    refetchInterval,
    staleTime: 0, // Always consider payment data stale for real-time updates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Always refetch on mount for fresh payment data
    retry: (failureCount, error: unknown) => {
      // Don't retry on client errors (4xx)
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        typeof (error as { status: number }).status === 'number' &&
        (error as { status: number }).status >= 400 &&
        (error as { status: number }).status < 500
      ) {
        return false
      }
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: string }).message === 'string' &&
        ((error as { message: string }).message.includes('tidak ditemukan') ||
          (error as { message: string }).message.includes('Not Found'))
      ) {
        return false
      }
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: string }).message === 'string' &&
        ((error as { message: string }).message.includes('unauthorized') ||
          (error as { message: string }).message.includes('403'))
      ) {
        return false
      }

      // Retry server errors and network issues up to 3 times
      const retryableErrors = [
        'fetch',
        'Network',
        'timeout',
        'Internal Server Error',
        '500',
        '502',
        '503',
        '504',
      ]

      const isRetryable = retryableErrors.some((errorType) => {
        const hasMessage =
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message: string }).message === 'string' &&
          (error as { message: string }).message.includes(errorType)
        const hasStatus =
          error &&
          typeof error === 'object' &&
          'status' in error &&
          typeof (error as { status: number }).status === 'number' &&
          (error as { status: number }).status.toString().includes(errorType)
        return hasMessage || hasStatus
      })

      return isRetryable && failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
  })

  // Create a separate query for the transformed data with enhanced synchronization
  const {
    data: transaction,
    isLoading: isTransforming,
    refetch: refetchTransformed,
  } = useQuery({
    queryKey: [...queryKeys.kasir.transaksi.detail(transactionId), 'transformed'],
    queryFn: async () => {
      const transformed = await transformApiToUI(apiData!)

      return transformed
    },
    enabled: !!apiData,
    staleTime: 0, // Always consider transformed data stale for real-time updates
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true, // Always refetch transformed data on mount
    retry: (failureCount) => {
      // Retry transformation failures up to 2 times
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // Max 2s delay
  })

  // Enhanced refresh function with retry mechanism
  const refreshTransaction = async (retryCount = 0, maxRetries = 3) => {
    try {
      await refetch()
    } catch {
      if (retryCount < maxRetries) {
        const delay = 1000 * Math.pow(2, retryCount) // Exponential backoff

        setTimeout(() => {
          refreshTransaction(retryCount + 1, maxRetries)
        }, delay)
      } else {
      }
    }
  }

  // Clear error state function for error recovery
  const clearError = () => {
    refetch()
  }

  // Enhanced data synchronization function
  const syncTransactionData = async () => {
    try {
      // Refetch both base and transformed data in sequence
      await refetch()
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay
      await refetchTransformed()
    } catch (syncError) {
      console.error('Transaction data sync failed', {
        transactionId,
        error: syncError instanceof Error ? syncError.message : 'Unknown error',
      })
      throw syncError
    }
  }

  return {
    transaction,
    isLoading: isLoading || isRefetching || isTransforming,
    error,
    refreshTransaction,
    clearError,
    // Enhanced functions for better cache management
    syncTransactionData,
    refetchTransformed,
    // Raw API data for debugging
    apiData,
    // Enhanced loading states for debugging
    isBaseLoading: isLoading,
    isTransformLoading: isTransforming,
    isRefreshing: isRefetching,
  }
}


/**
 * Transform API TransaksiResponse to UI TransactionDetail type
 * Uses existing transaction item data with product information
 * FIXED: Handle both 'fullItems' (from pickup response) and 'items' (from GET response)
 */
async function transformApiToUI(apiData: TransaksiResponse): Promise<TransactionDetail> {
  // Validation: Ensure apiData is valid
  if (!apiData) {
    throw new Error('Invalid API response: apiData is null or undefined')
  }

  if (!apiData.id || !apiData.kode) {
    throw new Error('Invalid API response: Missing required transaction fields (id, kode)')
  }

  // CRITICAL FIX: Prioritize 'fullItems' from pickup response, fallback to 'items' from GET response
  const rawItems = (apiData as any).fullItems || apiData.items || []

  // Validation: Ensure items is an array
  if (!Array.isArray(rawItems)) {
    console.warn('Transform warning: items field is not an array, using empty array', {
      transactionCode: apiData.kode,
      itemsType: typeof rawItems,
      hasFullItems: !!(apiData as any).fullItems,
      hasItems: !!apiData.items
    })
  }

  const items = Array.isArray(rawItems) ? rawItems : []

  // Enhanced logging for debugging pickup issues
  console.info('🔄 Transform Data Debug:', {
    transactionCode: apiData.kode,
    hasFullItems: !!(apiData as any).fullItems,
    hasItems: !!apiData.items,
    itemsCount: items.length,
    sourceField: (apiData as any).fullItems ? 'fullItems' : 'items',
    itemsWithPickup: items.filter(item => (item.jumlahDiambil || 0) > 0).length
  })

  // Validation: Ensure penyewa data is valid
  if (!apiData.penyewa) {
    throw new Error(`Invalid API response: Missing penyewa data for transaction ${apiData.kode}`)
  }

  if (!apiData.penyewa.nama || !apiData.penyewa.telepon) {
    console.warn('Transform warning: Missing penyewa required fields', {
      transactionCode: apiData.kode,
      hasNama: !!apiData.penyewa.nama,
      hasTelepon: !!apiData.penyewa.telepon
    })
  }

  // Calculate enhanced status based on pickup status with server-side optimization
  const hasPickup = items.some(item => (item.jumlahDiambil || 0) > 0)
  const calculatedStatus = calculateEnhancedStatus(apiData.status, items, apiData.tglSelesai, hasPickup)

  const transformed: TransactionDetail = {
    id: apiData.id,
    transactionCode: apiData.kode,
    customerName: apiData.penyewa.nama || 'N/A',
    customerPhone: apiData.penyewa.telepon || 'N/A',
    customerAddress: apiData.penyewa.alamat || '',
    items: items.map((item) => item.produk.name),
    startDate: apiData.tglMulai,
    endDate: apiData.tglSelesai || undefined,
    returnDate: apiData.tglKembali || undefined,
    totalAmount: apiData.totalHarga,
    amountPaid: apiData.jumlahBayar,
    remainingAmount: apiData.sisaBayar,
    status: calculatedStatus,
    paymentMethod: apiData.metodeBayar,
    notes: apiData.catatan || '',
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,

    // Enhanced customer information
    customer: {
      id: apiData.penyewa.id,
      name: apiData.penyewa.nama,
      phone: apiData.penyewa.telepon,
      email: '', // Not available in current API response
      address: apiData.penyewa.alamat,
      identityNumber: '', // Not available in current API response
      createdAt: '', // Not available in current API response
      totalTransactions: 0, // Would need separate API call
    },

    // Product information from transaction items - no need for additional API calls
    products: items.map((item) => {
      return {
        id: item.id, // TransaksiItem.id - needed for pickup operations
        product: {
          id: item.produk.id,
          name: item.produk.name,
          category: item.produk.category || '', // Now available from API response
          size: item.produk.size || '', // Now available from API response
          color: item.produk.color || '', // Now available from API response
          pricePerDay: item.hargaSewa,
          image: item.produk.imageUrl || '/products/placeholder.png',
          available: false, // Item is currently rented
          description: '', // Not included in transaction item data
        },
        quantity: item.jumlah,
        jumlahDiambil: item.jumlahDiambil || 0, // Pickup status from API response
        pricePerDay: item.hargaSewa,
        duration: item.durasi,
        subtotal: item.subtotal,
        // Enhanced: Include pickup information for ProductDetailCard
        pickupInfo: {
          jumlahDiambil: item.jumlahDiambil || 0, // How many items have been picked up
          remainingQuantity: Math.max(0, item.jumlah - (item.jumlahDiambil || 0)), // How many items are left to pick up
        },
        // CRITICAL FIX: Add missing return status fields
        statusKembali: item.statusKembali,
        // Handle optional return fields that may not exist in TypeScript interface
        ...('totalReturnPenalty' in item && item.totalReturnPenalty !== undefined ? {
          totalReturnPenalty: item.totalReturnPenalty as number
        } : {}),
        ...('conditionBreakdown' in item && item.conditionBreakdown ? {
          conditionBreakdown: item.conditionBreakdown as Array<{
            id: string
            kondisiAkhir: string
            jumlahKembali: number
            penaltyAmount: number
            modalAwalUsed?: number | null
            createdAt?: string
            createdBy?: string
          }>
        } : {}),
      }
    }),

    // Transform activity timeline
    timeline: (apiData.aktivitas || []).map((activity) => ({
      id: activity.id,
      timestamp: activity.createdAt,
      action: mapActivityTypeToAction(activity.tipe),
      description: activity.deskripsi,
      performedBy: activity.createdBy,
      details: activity.data,
    })),

    // Transform payments
    payments: (apiData.pembayaran || []).map((payment) => ({
      id: payment.id,
      amount: payment.jumlah,
      method: mapPaymentMethod(payment.metode),
      timestamp: payment.createdAt,
      type: 'rental' as const,
      reference: payment.referensi,
    })),

    // Penalties - not available in current API, would need enhancement
    penalties: [],
  }

  return transformed
}

/**
 * Map API activity types to UI action types
 */
function mapActivityTypeToAction(
  activityType: string,
): 'created' | 'paid' | 'picked_up' | 'returned' | 'overdue' | 'reminder_sent' | 'penalty_added' {
  const mapping: Record<
    string,
    'created' | 'paid' | 'picked_up' | 'returned' | 'overdue' | 'reminder_sent' | 'penalty_added'
  > = {
    dibuat: 'created',
    dibayar: 'paid',
    diambil: 'picked_up',
    selesai: 'returned',              // UPDATED: Map selesai to returned activity
    dikembalikan: 'returned',         // LEGACY: Keep for backward compatibility
    penalty_added: 'penalty_added',  // NEW: Penalty activity mapping
    penalty_diterapkan: 'penalty_added', // NEW: Penalty alias mapping
    terlambat: 'overdue',
    dibatalkan: 'penalty_added', // Map cancelled to penalty for now
  }

  return mapping[activityType] || 'created' // Default to 'created' for unknown types
}

/**
 * Map API payment method to UI payment method types
 */
function mapPaymentMethod(apiMethod: string): 'cash' | 'qris' | 'transfer' {
  const mapping: Record<string, 'cash' | 'qris' | 'transfer'> = {
    tunai: 'cash',
    transfer: 'transfer',
    kartu: 'qris', // Map kartu to qris for UI consistency
  }

  return mapping[apiMethod] || 'cash'
}
