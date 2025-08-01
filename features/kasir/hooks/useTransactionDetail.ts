'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { TransactionDetail } from '../types/transaction-detail'
import type { TransaksiResponse } from '../types/api'
import { logger } from '@/lib/client-logger'

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

  logger.debug(
    'useTransactionDetail hook initialized',
    {
      transactionId,
      enabled,
      refetchInterval,
    },
    'useTransactionDetail',
  )

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
      logger.info('Fetching transaction detail from API', { transactionId }, 'useTransactionDetail')
      return kasirApi.transaksi.getByKode(transactionId)
    },
    enabled: enabled && !!transactionId,
    refetchInterval,
    staleTime: 0, // 🔥 FIX: Always consider payment data stale for real-time updates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // 🔥 FIX: Always refetch on mount for fresh payment data
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
  const { data: transaction, isLoading: isTransforming, refetch: refetchTransformed } = useQuery({
    queryKey: [...queryKeys.kasir.transaksi.detail(transactionId), 'transformed'],
    queryFn: async () => {
      logger.debug(
        'Transforming API data to UI format',
        {
          hasApiData: !!apiData,
          transactionId,
          apiDataKeys: apiData ? Object.keys(apiData) : null,
        },
        'useTransactionDetail',
      )

      const transformed = await transformApiToUI(apiData!)

      logger.info(
        'Transaction data transformation completed',
        {
          transactionId,
          transformedKeys: Object.keys(transformed),
          paymentsCount: transformed.payments?.length || 0,
          productsCount: transformed.products?.length || 0,
          timelineCount: transformed.timeline?.length || 0,
        },
        'useTransactionDetail',
      )

      return transformed
    },
    enabled: !!apiData,
    staleTime: 0, // 🔥 FIX: Always consider transformed data stale for real-time updates
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true, // 🔥 FIX: Always refetch transformed data on mount
    retry: (failureCount, error: unknown) => {
      // Retry transformation failures up to 2 times
      logger.debug('🔄 Transformation retry', {
        transactionId,
        failureCount,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // Max 2s delay
  })

  // 🔥 FIX: Enhanced refresh function with retry mechanism
  const refreshTransaction = async (retryCount = 0, maxRetries = 3) => {
    logger.debug('🔄 Manual transaction refresh requested', {
      transactionId,
      retryCount,
      maxRetries
    })
    
    try {
      await refetch()
      logger.info('✅ Manual transaction refresh successful', { transactionId })
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = 1000 * Math.pow(2, retryCount) // Exponential backoff
        logger.warn(`⚠️ Transaction refresh failed, retrying in ${delay}ms`, {
          transactionId,
          retryCount: retryCount + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        setTimeout(() => {
          refreshTransaction(retryCount + 1, maxRetries)
        }, delay)
      } else {
        logger.error('💥 Transaction refresh failed after all retries', {
          transactionId,
          maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Clear error state function for error recovery
  const clearError = () => {
    logger.debug('🧹 Clearing transaction error state', { transactionId })
    refetch()
  }

  // 🔥 FIX: Enhanced data synchronization function
  const syncTransactionData = async () => {
    logger.debug('🔄 Syncing transaction data (base + transformed)', { transactionId })
    
    try {
      // Refetch both base and transformed data in sequence
      await refetch()
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
      await refetchTransformed()
      
      logger.info('✅ Transaction data sync completed', { transactionId })
    } catch (error) {
      logger.error('❌ Transaction data sync failed', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  return {
    transaction,
    isLoading: isLoading || isRefetching || isTransforming,
    error,
    refreshTransaction,
    clearError,
    // 🔥 FIX: New enhanced functions for better cache management
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
 */
async function transformApiToUI(apiData: TransaksiResponse): Promise<TransactionDetail> {
  logger.debug(
    'Starting API to UI transformation',
    {
      apiData: {
        id: apiData.id,
        kode: apiData.kode,
        status: apiData.status,
        itemsCount: apiData.items?.length || 0,
        pembayaranCount: apiData.pembayaran?.length || 0,
        aktivitasCount: apiData.aktivitas?.length || 0,
      },
    },
    'transformApiToUI',
  )

  // Use items from transaction data - API returns items array, not fullItems
  const items = apiData.items || []

  logger.debug(
    'Processing transaction items',
    {
      itemsCount: items.length,
      items: items.map((item) => ({
        id: item.id,
        produktId: item.produk.id,
        produktName: item.produk.name,
        jumlah: item.jumlah,
        jumlahDiambil: item.jumlahDiambil,
        hargaSewa: item.hargaSewa,
        subtotal: item.subtotal,
      })),
    },
    'transformApiToUI',
  )

  const transformed: TransactionDetail = {
    id: apiData.id,
    transactionCode: apiData.kode,
    customerName: apiData.penyewa.nama,
    customerPhone: apiData.penyewa.telepon,
    customerAddress: apiData.penyewa.alamat,
    items: items.map((item) => item.produk.name),
    startDate: apiData.tglMulai,
    endDate: apiData.tglSelesai || undefined,
    returnDate: apiData.tglKembali || undefined,
    totalAmount: apiData.totalHarga,
    amountPaid: apiData.jumlahBayar,
    remainingAmount: apiData.sisaBayar,
    status: apiData.status,
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
          category: '', // Not included in transaction item data
          size: '', // Not included in transaction item data
          color: '', // Not included in transaction item data
          pricePerDay: item.hargaSewa,
          image: item.produk.imageUrl || '/products/placeholder.png',
          available: false, // Item is currently rented
          description: '', // Not included in transaction item data
        },
        quantity: item.jumlah,
        pricePerDay: item.hargaSewa,
        duration: item.durasi,
        subtotal: item.subtotal,
        // Enhanced: Include pickup information for ProductDetailCard
        pickupInfo: {
          jumlahDiambil: item.jumlahDiambil || 0, // How many items have been picked up
          remainingQuantity: Math.max(0, item.jumlah - (item.jumlahDiambil || 0)), // How many items are left to pick up
        },
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

  logger.debug(
    'Transformation completed',
    {
      transformedId: transformed.id,
      transformedCode: transformed.transactionCode,
      paymentsCount: transformed.payments.length,
      productsCount: transformed.products.length,
      timelineCount: transformed.timeline.length,
    },
    'transformApiToUI',
  )

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
    dikembalikan: 'returned',
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
