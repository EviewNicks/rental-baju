'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface TransactionPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function TransactionPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}: TransactionPaginationProps) {
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis')
        start = Math.max(start, currentPage - 1)
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  const handlePageClick = (page: number) => {
    if (page === currentPage || isLoading) return
    onPageChange(page)
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4"
      data-testid="transaction-pagination"
    >
      {/* Pagination Info */}
      <div className="text-sm text-gray-600" data-testid="pagination-info">
        Menampilkan <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> dari{' '}
        <span className="font-medium">{totalItems}</span> transaksi
      </div>

      {/* Pagination Controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1 && !isLoading) {
                  handlePageClick(currentPage - 1)
                }
              }}
              className={
                currentPage === 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
              text="Prev"
              data-testid="pagination-prev"
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageClick(page)
                  }}
                  isActive={currentPage === page}
                  className={isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  data-testid={`pagination-page-${page}`}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages && !isLoading) {
                  handlePageClick(currentPage + 1)
                }
              }}
              className={
                currentPage === totalPages || isLoading
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
              text="Next"
              data-testid="pagination-next"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
