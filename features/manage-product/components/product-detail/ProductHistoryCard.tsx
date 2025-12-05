/**
 * ProductHistoryCard Component - RPK-46 Product History
 * Main component replacing SystemInfoCard with product rental history timeline
 * Maintains same props interface for seamless replacement
 */

'use client'

import React from 'react'
import { History, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProductHistory, useProductHistoryPagination } from '../../hooks/useProductHistory'
import { TimelineItem, TimelineItemSkeleton } from './TimelineItem'
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
  'data-testid': dataTestId,
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

  // Loading state
  if (isLoading && !historyData) {
    return (
      <Card
        className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
        data-testid={dataTestId}
      >
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
      <Card
        className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
        data-testid={dataTestId}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Gagal memuat riwayat sewa</h3>
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
      <Card
        className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
        data-testid={dataTestId}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Belum ada riwayat sewa</h3>
            <p className="text-xs text-gray-600">Produk ini belum pernah disewakan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main render with data
  return (
    <Card
      className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
      data-testid={dataTestId}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          {/* Title Section */}
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Riwayat Sewa
            {isFetching && (
              <div title="Memperbarui data...">
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              </div>
            )}
          </CardTitle>

          {/* Pagination Controls - Top Right */}
          {historyData.pagination && historyData.pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isFetching}
                className="h-8 w-8 p-0"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-xs text-gray-600 font-medium min-w-[60px] text-center">
                {page} / {historyData.pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= historyData.pagination.totalPages || isFetching}
                className="h-8 w-8 p-0"
                aria-label="Halaman selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
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
      </CardContent>
    </Card>
  )
}
