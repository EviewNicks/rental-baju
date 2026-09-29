/**
 * ProductHistoryCard Component - RPK-46 Product History
 * Main component replacing SystemInfoCard with product rental history timeline
 * Supports filtering by ProductSize with pagination
 */

'use client'

import React from 'react'
import { History, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  // Filter size state ('all' means all sizes)
  const [selectedSizeId, setSelectedSizeId] = React.useState<string>('all')

  // Pagination state
  const { page, setPage } = useProductHistoryPagination(1, 10)

  // Fetch product history data with optional productSizeId filter
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
    productSizeId: selectedSizeId !== 'all' ? selectedSizeId : undefined,
  })

  // Handle size filter change
  const handleSizeChange = (newSizeId: string) => {
    setSelectedSizeId(newSizeId)
    setPage(1) // Reset pagination to page 1 on filter change
  }

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Handle retry action
  const handleRetry = () => {
    refetch()
  }

  // Format label for age category
  const formatAgeCategory = (category: string) => {
    if (category === 'ADULT') return 'Dewasa'
    if (category === 'CHILD') return 'Anak'
    return 'Universal'
  }

  // Selected size label for empty state display
  const selectedSizeObj = product.sizes?.find((s) => s.id === selectedSizeId)
  const selectedSizeLabel = selectedSizeObj
    ? `Size ${selectedSizeObj.size} (${formatAgeCategory(selectedSizeObj.ageCategory)})`
    : 'ukuran ini'

  // Header Component with Title, Size Filter, and Pagination
  const renderHeader = () => (
    <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title Section */}
        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
          <span>Riwayat Sewa</span>
          {isFetching && (
            <div title="Memperbarui data...">
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </CardTitle>

        {/* Filter & Pagination Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Size Filter Dropdown */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Select value={selectedSizeId} onValueChange={handleSizeChange}>
                <SelectTrigger
                  size="sm"
                  className="h-8 text-xs font-medium min-w-[140px] max-w-[200px] bg-gray-50/80 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700"
                  aria-label="Filter berdasarkan ukuran produk"
                >
                  <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
                  <SelectValue placeholder="Pilih Ukuran" />
                </SelectTrigger>
                <SelectContent align="end" className="text-xs">
                  <SelectItem value="all" className="text-xs font-medium">
                    Semua Ukuran
                  </SelectItem>
                  {product.sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id} className="text-xs">
                      Size {size.size} ({formatAgeCategory(size.ageCategory)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pagination Controls - Top Right */}
          {historyData?.pagination && historyData.pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
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

              <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium min-w-[48px] text-center">
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
      </div>
    </CardHeader>
  )

  // Loading state (initial)
  if (isLoading && !historyData) {
    return (
      <Card
        className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
        data-testid={dataTestId}
      >
        {renderHeader()}
        <CardContent className="space-y-6 pt-6">
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
        {renderHeader()}
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
              Gagal memuat riwayat sewa
            </h3>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2 mx-auto"
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
    const isFiltered = selectedSizeId !== 'all'

    return (
      <Card
        className={`h-fit hover:shadow-xl transition-all duration-300 ${className}`}
        data-testid={dataTestId}
      >
        {renderHeader()}
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <History className="h-8 w-8 mx-auto mb-3 text-gray-400 dark:text-zinc-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              {isFiltered ? 'Tidak ada riwayat untuk ukuran ini' : 'Belum ada riwayat sewa'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-zinc-400 max-w-xs mx-auto mb-4">
              {isFiltered
                ? `Belum ada riwayat transaksi sewa yang tercatat untuk ${selectedSizeLabel}.`
                : 'Produk ini belum pernah disewakan.'}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSizeChange('all')}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tampilkan Semua Ukuran
              </Button>
            )}
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
      {renderHeader()}

      <CardContent className="space-y-6 pt-6">
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
