'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'
import type { TransactionFilters } from '../types'
import type { TransactionStatus, TransaksiQueryParams, TransaksiListResponse } from '../types'
import {
  useCacheManager,
  generateTransactionCacheKey,
  generateInvalidationPattern,
} from './optimization'

interface UseTransactionsOptions {
  enabled?: boolean
  refetchInterval?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  // ✅ EGRESS OPTIMIZATION: Auto-refresh completely removed to reduce database load
  // Before: refetchInterval = 60000 (60s) → 2,400 requests/day (5 users)
  // After: Manual refresh only → ~240 requests/day (90% reduction)
  // Impact: Egress 1GB/day → <50MB/day
  const { enabled = true } = options
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [currentPage, setCurrentPage] = useState(1)

  // Initialize cache manager
  const cacheManager = useCacheManager({
    maxSize: 50 * 1024 * 1024, // 50MB
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    enablePersistence: true,
  })

  // Simplified debounce for search - direct implementation
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchValue = filters.search || ''

    // If empty, clear immediately
    if (!searchValue) {
      setDebouncedSearch('')
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setIsSearching(false)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [filters.search])

  // Simplified debounce for date filter - direct implementation
  const [debouncedDateFilter, setDebouncedDateFilter] = useState(filters.dateFilter || '')
  const [isDateFiltering, setIsDateFiltering] = useState(false)

  useEffect(() => {
    const dateValue = filters.dateFilter || ''

    // If empty, clear immediately
    if (!dateValue) {
      setDebouncedDateFilter('')
      setIsDateFiltering(false)
      return
    }

    setIsDateFiltering(true)
    const timer = setTimeout(() => {
      setDebouncedDateFilter(dateValue)
      setIsDateFiltering(false)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [filters.dateFilter])

  // Build query parameters from filters with debounced search and date filter
  const queryParams = useMemo((): TransaksiQueryParams => {
    const params: TransaksiQueryParams = {
      page: currentPage,
      limit: 20, // Reduced from 100 to 20 for better performance
    }

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status as TransactionStatus
    }

    if (debouncedSearch) {
      params.search = debouncedSearch
    }

    // Add date filter parameter (Task 3.1)
    if (debouncedDateFilter) {
      params.tglMulai = debouncedDateFilter
    }

    return params
  }, [currentPage, filters.status, debouncedSearch, debouncedDateFilter])

  // Generate cache key for current query (including date filter)
  const cacheKey = useMemo(() => {
    return generateTransactionCacheKey({
      search: queryParams.search,
      status: queryParams.status,
      page: queryParams.page,
      limit: queryParams.limit,
      tglMulai: queryParams.tglMulai, // Include date filter in cache key
    })
  }, [queryParams])

  // Check if any filters are active (needed before useQuery for conditional staleTime)
  const hasActiveFilters = useMemo(() => {
    return (
      !!(filters.status && filters.status !== 'all') ||
      !!(filters.search && filters.search.trim()) ||
      !!(filters.dateFilter && filters.dateFilter.trim())
    )
  }, [filters.status, filters.search, filters.dateFilter])

  // Custom query function with simplified cache integration
  const queryFn = useCallback(async (): Promise<TransaksiListResponse> => {
    // Always fetch fresh data for date filter queries to ensure accuracy
    const apiData = await kasirApi.transaksi.getAll(queryParams)

    // Cache the result only for non-date queries to avoid stale data
    if (!queryParams.tglMulai && !queryParams.search) {
      await cacheManager.set(cacheKey, apiData)
    }

    return apiData
  }, [cacheManager, cacheKey, queryParams])

  // Fetch transactions with React Query and cache integration
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = useQuery<TransaksiListResponse>({
    queryKey: queryKeys.kasir.transaksi.list(queryParams),
    queryFn,
    enabled,
    refetchInterval: false, // ✅ EGRESS OPTIMIZATION: Disabled auto-refresh
    // ✅ CONDITIONAL STALE TIME: Fresh data for filtered queries, cache for default view
    // This fixes production issue where filters were not triggering API calls
    staleTime: hasActiveFilters
      ? 0 // Always fresh for filtered data (status/search/date active)
      : 10 * 60 * 1000, // Cache 10 minutes for default "all" view only
    gcTime: 15 * 60 * 1000, // ✅ PHASE 2: 15 minutes - cache disimpan 15 menit
    // Simplified configuration for better reliability
    refetchOnWindowFocus: false, // Prevent excessive refetches
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1, // Reduce retry attempts for faster failure handling
    retryDelay: 500, // 500ms retry delay
  })

  // Transform API data to match component expectations
  const transactions = useMemo(() => {
    // API returns TransaksiListResponse structure
    if (!transactionData?.data) {
      return []
    }

    return transactionData.data.map((transaction) => {
      const itemsData = transaction.items || []

      return {
        id: transaction.id,
        transactionCode: transaction.kode,
        customerName: transaction.penyewa.nama,
        customerPhone: transaction.penyewa.telepon,
        customerAddress: transaction.penyewa.alamat,
        // Use the actual items array with product names from API
        items: itemsData?.map((item) => item.produk?.name || 'Produk tidak diketahui') || [
          'Tidak ada item',
        ],
        totalAmount: transaction.totalHarga,
        amountPaid: transaction.jumlahBayar,
        remainingAmount: transaction.sisaBayar,
        status: transaction.status, // Backend now provides enhanced status directly
        startDate: transaction.tglMulai,
        endDate: transaction.tglSelesai || undefined,
        returnDate: transaction.tglKembali || undefined,
        paymentMethod: transaction.metodeBayar,
        notes: transaction.catatan || '',
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        // FIX: Include kasir information from API response
        kasir: transaction.kasir
          ? {
              id: transaction.kasir.id,
              nama: transaction.kasir.nama,
              isActive: transaction.kasir.isActive,
              createdAt: transaction.kasir.createdAt,
              updatedAt: transaction.kasir.updatedAt,
            }
          : undefined,
      }
    })
  }, [transactionData])

  // Calculate transaction counts from summary
  const counts = useMemo(() => {
    // API returns summary in TransaksiListResponse
    if (!transactionData?.summary) {
      return {
        active: 0,
        diambil: 0,
        completed: 0,
        overdue: 0,
        cancelled: 0,
        total: 0,
      }
    }

    const { summary } = transactionData

    return {
      active: summary?.totalActive || 0,
      diambil: summary?.totalDiambil || 0,
      completed: summary?.totalSelesai || 0,
      overdue: summary?.totalTerlambat || 0,
      cancelled: summary?.totalCancelled || 0,
      total:
        (summary?.totalActive || 0) +
        (summary?.totalDiambil || 0) +
        (summary?.totalSelesai || 0) +
        (summary?.totalTerlambat || 0) +
        (summary?.totalCancelled || 0),
    }
  }, [transactionData])

  // Stable updateFilters function to prevent circular dependencies
  const updateFilters = useCallback(
    (newFilters: Partial<TransactionFilters>, options?: { resetPage?: boolean }) => {
      setFilters((prev) => {
        // Only update if there are actual changes
        const hasChanges = Object.keys(newFilters).some(
          (key) =>
            prev[key as keyof TransactionFilters] !== newFilters[key as keyof TransactionFilters],
        )

        if (!hasChanges) {
          return prev // Return same reference if no changes
        }

        return { ...prev, ...newFilters }
      })
      // Simple logic: only reset page if explicitly requested (default true)
      const shouldResetPage = options?.resetPage !== false
      if (shouldResetPage) {
        setCurrentPage(1)
      }
    },
    [],
  ) // Empty dependency array - this function should be stable

  // Reset all filters function (Task 3.1)
  const resetAllFilters = useCallback(() => {
    setFilters({})
    setCurrentPage(1)
  }, [])

  // Function to change page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Helper function to manually refresh data with cache invalidation
  const refreshTransactions = useCallback(async () => {
    // Invalidate cache for current query
    await cacheManager.invalidate(generateInvalidationPattern('search'))
    // Clear any cached error state and refetch
    refetch()
  }, [cacheManager, refetch])

  // Clear error state function for error recovery
  const clearError = useCallback(() => {
    // This will be used by error boundary components
    refetch()
  }, [refetch])

  // Cache invalidation on data mutations (to be called after create/update/delete)
  const invalidateCache = useCallback(
    async (type: 'all' | 'search' | 'detail' = 'all') => {
      await cacheManager.invalidate(generateInvalidationPattern(type))
    },
    [cacheManager],
  )

  return {
    transactions,
    filters,
    updateFilters,
    resetAllFilters, // New: Reset all filters function
    hasActiveFilters, // New: Check if any filters are active
    isLoading: isLoading && !transactionData, // Only show loading if no data yet
    error,
    counts,
    refreshTransactions,
    clearError,
    invalidateCache, // New function for cache invalidation
    // Additional metadata
    pagination: transactionData?.pagination,
    summary: transactionData?.summary,
    // Pagination controls
    currentPage,
    setPage,
    // Cache and performance info
    cacheStats: cacheManager.getStats(),
    isSearching, // Separate search loading state
    isDateFiltering, // Separate date filter loading state
  }
}
