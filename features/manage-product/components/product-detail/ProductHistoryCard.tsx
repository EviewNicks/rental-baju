/**
 * ProductHistoryCard Component - RPK-46 Product History
 * Main component replacing SystemInfoCard with product rental history timeline
 * Maintains same props interface for seamless replacement
 */

'use client'

import React from 'react'
import { History, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProductHistory, useProductHistoryPagination } from '../../hooks/useProductHistory'
import { TimelineItem, TimelineItemSkeleton } from './TimelineItem'
import { PaginationControls } from './PaginationControls'
import { formatCurrency } from '@/features/kasir/lib/utils/client'
import type { Product } from '../../types'
import type { ProductHistoryItem } from '../../types/productHistory'

interface ProductHistoryCardProps {
  product: Product
  className?: string
  'data-testid'?: string
}

export function ProductHistoryCard({ 
  product, 
  className,
  'data-testid': dataTestId 
}: ProductHistoryCardProps) {
  // Pagination state
  const { page, setPage } = useProductHistoryPagination(1, 10)

  // Fetch product history data
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProductHistory(product.id, {
    page,
    limit: 10,
    sortBy: 'date',
    sortOrder: 'desc',
  })

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Handle retry action
  const handleRetry = () => {
    refetch()
  }

  // Calculate summary statistics if data available
  const renderSummary = () => {
    if (!historyData?.data?.length) return null

    const totalRevenue = historyData.data.reduce((sum: number, item: ProductHistoryItem) => sum + item.totalRevenue, 0)
    const totalTransactions = historyData.data.length
    const avgDuration = Math.round(
      historyData.data.reduce((sum: number, item: ProductHistoryItem) => sum + item.duration, 0) / totalTransactions
    )

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(totalRevenue)}
            </div>
          </div>

          {/* Total Transactions */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <History className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Transaksi</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {totalTransactions} kali
            </div>
          </div>

          {/* Average Duration */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Rata-rata</span>
            </div>
            <div className="text-lg font-bold text-purple-700">
              {avgDuration} hari
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading && !historyData) {
    return (
      <Card className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`} data-testid={dataTestId}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary skeleton */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Timeline skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <TimelineItemSkeleton key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`} data-testid={dataTestId}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Gagal memuat riwayat sewa
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!historyData?.data?.length) {
    return (
      <Card className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`} data-testid={dataTestId}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Belum ada riwayat sewa
            </h3>
            <p className="text-xs text-gray-600">
              Produk ini belum pernah disewakan
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main render with data
  return (
    <Card className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`} data-testid={dataTestId}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          Riwayat Sewa
          {isFetching && (
            <div title="Memperbarui data...">
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        {renderSummary()}

        {/* Timeline */}
        <div className="space-y-6">
          {historyData.data.map((historyItem: ProductHistoryItem, index: number) => (
            <TimelineItem
              key={historyItem.id}
              item={historyItem}
              isLast={index === historyData.data.length - 1}
              data-testid={`timeline-item-${index}`}
            />
          ))}
        </div>

        {/* Pagination */}
        {historyData.pagination && historyData.pagination.totalPages > 1 && (
          <PaginationControls
            currentPage={historyData.pagination.page}
            totalPages={historyData.pagination.totalPages}
            onPageChange={handlePageChange}
            isLoading={isFetching}
            data-testid="history-pagination"
          />
        )}
      </CardContent>
    </Card>
  )
}