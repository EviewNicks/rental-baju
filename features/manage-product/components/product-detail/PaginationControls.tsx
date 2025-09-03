/**
 * PaginationControls Component - RPK-46 Product History
 * Simple navigation controls for paginated product history
 * Follows accessibility best practices with ARIA labels
 */

'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  className?: string
  'data-testid'?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className = '',
  'data-testid': dataTestId,
}: PaginationControlsProps) {
  // Early return if no pagination needed
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, action: 'prev' | 'next') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (action === 'prev') {
        handlePrevious()
      } else {
        handleNext()
      }
    }
  }

  const isPreviousDisabled = currentPage <= 1 || isLoading
  const isNextDisabled = currentPage >= totalPages || isLoading

  return (
    <nav
      className={`flex items-center justify-between pt-4 border-t border-gray-200 ${className}`}
      data-testid={dataTestId}
      aria-label="Pagination Navigation"
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        onKeyDown={(e) => handleKeyDown(e, 'prev')}
        disabled={isPreviousDisabled}
        className="flex items-center gap-2 min-w-[100px]"
        aria-label={`Go to previous page, page ${Math.max(1, currentPage - 1)}`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Sebelumnya</span>
        <span className="sm:hidden">Prev</span>
      </Button>

      {/* Page Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium" aria-live="polite">
          Halaman {currentPage} dari {totalPages}
        </span>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="ml-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        onKeyDown={(e) => handleKeyDown(e, 'next')}
        disabled={isNextDisabled}
        className="flex items-center gap-2 min-w-[100px]"
        aria-label={`Go to next page, page ${Math.min(totalPages, currentPage + 1)}`}
      >
        <span className="hidden sm:inline">Selanjutnya</span>
        <span className="sm:hidden">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

/**
 * Simplified pagination controls for mobile view
 */
export function SimplePaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: Omit<PaginationControlsProps, 'className' | 'data-testid'>) {
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage <= 1 || isLoading}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      {/* Page Info */}
      <span className="text-sm text-gray-600">
        {currentPage}/{totalPages}
      </span>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages || isLoading}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Skeleton loading state for pagination controls
 */
export function PaginationControlsSkeleton() {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      {/* Previous button skeleton */}
      <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
      
      {/* Page indicator skeleton */}
      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
      
      {/* Next button skeleton */}
      <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
}