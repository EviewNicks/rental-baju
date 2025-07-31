'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { TransactionFilters } from '../types/transaction'
import type { TransactionStatus, TransaksiQueryParams } from '../types/api'

interface UseTransactionsOptions {
  enabled?: boolean
  refetchInterval?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { enabled = true, refetchInterval = 30000 } = options // Auto-refresh every 30 seconds
  const [filters, setFilters] = useState<TransactionFilters>({})

  // Build query parameters from filters
  const queryParams = useMemo((): TransaksiQueryParams => {
    const params: TransaksiQueryParams = {
      page: 1,
      limit: 100, // Load enough for dashboard display
    }

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status as TransactionStatus
    }

    if (filters.search) {
      params.search = filters.search
    }

    return params
  }, [filters])

  // Fetch transactions with React Query
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.kasir.transaksi.list(queryParams),
    queryFn: () => kasirApi.transaksi.getAll(queryParams),
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Transform API data to match component expectations
  const transactions = useMemo(() => {
    // API returns TransaksiListResponse structure
    if (!transactionData?.data) return []
    
    return transactionData.data.map((transaction) => ({
      id: transaction.id,
      transactionCode: transaction.kode,
      customerName: transaction.penyewa.nama,
      customerPhone: transaction.penyewa.telepon,
      customerAddress: transaction.penyewa.alamat,
      // Use the actual items array with product names from API
      items: transaction.items?.map((item) => item.produk?.name || 'Produk tidak diketahui') || ['Tidak ada item'],
      totalAmount: transaction.totalHarga,
      amountPaid: transaction.jumlahBayar,
      remainingAmount: transaction.sisaBayar,
      status: transaction.status,
      startDate: transaction.tglMulai,
      endDate: transaction.tglSelesai || undefined,
      returnDate: transaction.tglKembali || undefined,
      paymentMethod: transaction.metodeBayar,
      notes: transaction.catatan || '',
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }))
  }, [transactionData])

  // Calculate transaction counts from summary
  const counts = useMemo(() => {
    // API returns summary in TransaksiListResponse
    if (!transactionData?.summary) {
      return {
        active: 0,
        completed: 0,
        overdue: 0,
        total: 0,
      }
    }

    const { summary } = transactionData
    return {
      active: summary?.totalActive || 0,
      completed: summary?.totalSelesai || 0,
      overdue: summary?.totalTerlambat || 0,
      total: (summary?.totalActive || 0) + (summary?.totalSelesai || 0) + (summary?.totalTerlambat || 0) + (summary?.totalCancelled || 0),
    }
  }, [transactionData])

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  // Helper function to manually refresh data with error recovery
  const refreshTransactions = () => {
    // Clear any cached error state and refetch
    refetch()
  }

  // Clear error state function for error recovery
  const clearError = () => {
    // This will be used by error boundary components
    refetch()
  }

  return {
    transactions,
    filters,
    updateFilters,
    isLoading: isLoading || isRefetching,
    error,
    counts,
    refreshTransactions,
    clearError, // New function for error recovery
    // Additional metadata
    pagination: transactionData?.pagination,
    summary: transactionData?.summary,
  }
}
