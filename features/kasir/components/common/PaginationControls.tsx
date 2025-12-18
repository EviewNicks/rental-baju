'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  showPageInfo?: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showPageInfo = true,
}: PaginationControlsProps) {
  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  const handlePreviousPage = () => {
    if (hasPreviousPage && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null
  }

  return (
    <div 
      className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50"
      data-testid="pagination-controls"
    >
      {/* Page Information */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {showPageInfo && (
          <>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat...</span>
              </div>
            ) : (
              <span data-testid="pagination-info">
                Halaman {currentPage} dari {totalPages}
              </span>
            )}
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={!hasPreviousPage || isLoading}
          className="flex items-center gap-1"
          data-testid="pagination-previous-button"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasNextPage || isLoading}
          className="flex items-center gap-1"
          data-testid="pagination-next-button"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}