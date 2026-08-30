'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, ShoppingCart, RefreshCw, AlertTriangle, Search, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ProductCard } from './product-card'
import { sarungPairingService } from '../../services/pairingService'
import { getSarungCategoryId } from '../../lib/utils/jasSarungUtils'
import {
  createSarungPairingError,
  SarungPairingErrorType,
} from '../../lib/errors/sarungPairingErrors'
import {
  validateQuantityInput,
  validateProductData,
  validateProductSizeSelection,
  globalRateLimiter,
} from '../../lib/validation/sarungValidation'
import { toast } from '@/lib/notifications'
import { useAvailableProducts } from '../../hooks/useProduk'
import { useDebounce } from '../../hooks/optimization/useDebounce'
import type { Product, ProductSize, SarungDistribution, ProductSelection } from '../../types'

interface SarungSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  jasProduct: Product
  jasQuantity: number
  jasProductSizeId?: string // ✅ ADDED: jasProductSizeId prop
  onConfirmSelection: (
    selectedSarung?:
      | {
          product: Product
          quantity: number
          productSizeId?: string
          selectedSize?: ProductSize
        }
      | Array<{
          product: Product
          quantity: number
          productSizeId?: string
          linkedSarung?: ProductSelection['linkedSarung']
        }>,
  ) => void
  onOpenHistory?: (
    productSizeId: string,
    productName: string,
    size: string,
    ageCategory: string,
  ) => void
}

export function SarungSelectionModal({
  isOpen,
  onClose,
  jasProduct,
  jasQuantity,
  jasProductSizeId, // ✅ ADDED: Accept jasProductSizeId prop
  onConfirmSelection,
  onOpenHistory,
}: SarungSelectionModalProps) {
  // Task 18: Enhanced modal state for quantity distribution
  const [sarungDistribution, setSarungDistribution] = useState<SarungDistribution>({
    sarungSelections: [],
    totalDistributed: 0,
    remainingJas: jasQuantity,
  })

  // Legacy state for backward compatibility with simple pairing
  const [selectedSarung, setSelectedSarung] = useState<{
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false) // For form submission loading
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('') // Search state
  const [currentPage, setCurrentPage] = useState(1) // Pagination state

  // ✅ OPTIMIZATION: Debounce search query (350ms) to prevent excessive API requests and UI flickering
  const { debouncedValue: debouncedSearchQuery, isPending: isDebouncing } = useDebounce(searchQuery, {
    delay: 350,
  })

  // Pagination constants
  const ITEMS_PER_PAGE = 15

  // Task 12: Generate session ID for rate limiting
  const sessionId = `sarung-modal-${jasProduct.id}-${Date.now()}`

  // **SOLUTION: Separate API call for sarung products**
  // This solves the data filtering conflict by fetching sarung products independently
  const {
    data: sarungProductsResponse,
    isLoading,
    isFetching,
    error: apiError,
    refetch: refetchSarungProducts,
  } = useAvailableProducts({
    search: debouncedSearchQuery, // ✅ Debounced server-side search for optimal performance
    categoryId: getSarungCategoryId(), // Filter specifically for sarung category
    status: undefined, // No status filter
    sortBy: 'name',
    sortOrder: 'asc',
    available: true, // Only available products
    page: currentPage, // ✅ Use current page state
    limit: ITEMS_PER_PAGE, // ✅ Use pagination limit (15 items)
  })

  // Transform and filter sarung products from API response
  const sarungProducts = useMemo(() => {
    if (!sarungProductsResponse?.data) {
      return []
    }

    // Transform API data to Product interface
    const transformedProducts = sarungProductsResponse.data.map((apiProduct): Product => {
      const size = apiProduct.size || 'Universal'
      const color = apiProduct.color?.name || 'Default'

      return {
        id: apiProduct.id,
        code: apiProduct.code,
        name: apiProduct.name,
        category: apiProduct.category.name.toLowerCase(),
        categoryType: apiProduct.category.type,
        size,
        color,
        pricePerDay: apiProduct.currentPrice,
        image: apiProduct.imageUrl || '/placeholder.svg',
        available: true,
        description: apiProduct.description,
        availableQuantity: apiProduct.availableQuantity,
        sizes: apiProduct.sizes || [],
        supportsSizeSelection: (apiProduct.sizes?.length ?? 0) > 0,
      }
    })

    // Filter only sarung products using the pairing service
    const filteredSarungProducts = sarungPairingService.getFreeItemsForPairing(transformedProducts)

    // Additional validation for sarung products
    const validatedProducts = filteredSarungProducts.filter((product) => {
      // Check if product has stock
      const hasStock = product.availableQuantity === undefined || product.availableQuantity > 0
      if (!hasStock) {
        console.warn(`Sarung ${product.name} has no stock: ${product.availableQuantity}`)
        return false
      }

      return true
    })

    console.log(
      `Sarung products loaded: ${validatedProducts.length} from ${transformedProducts.length} total products`,
    )

    return validatedProducts
  }, [sarungProductsResponse])

  // Get pagination data from API response
  const paginationData = sarungProductsResponse?.pagination
  const totalPages = paginationData?.totalPages || 1
  const totalItems = paginationData?.total || 0

  // No more client-side filtering - search is handled by server
  // Use sarungProducts directly from API response

  // Handle API errors
  useEffect(() => {
    if (apiError && isOpen) {
      const pairingError = createSarungPairingError(SarungPairingErrorType.MODAL_LOAD_FAILED, {
        jasProductId: jasProduct.id,
        error: apiError instanceof Error ? apiError.message : 'API call failed',
      })

      setLastError(pairingError.userMessage)
      toast.error('Gagal Memuat Sarung', pairingError.userMessage)
    }
  }, [apiError, isOpen, jasProduct.id])

  // Task 18: Helper functions for quantity distribution
  const getSelectedSarungQuantity = (productId: string, productSizeId?: string) => {
    const selection = sarungDistribution.sarungSelections.find(
      (s) =>
        s.product.id === productId &&
        (productSizeId ? s.productSizeId === productSizeId : !s.productSizeId),
    )
    return selection?.quantity || 0
  }

  const updateSarungDistribution = (product: Product, quantity: number, productSizeId?: string) => {
    const selectedSize = productSizeId
      ? product.sizes?.find((size) => size.id === productSizeId)
      : undefined

    setSarungDistribution((prev) => {
      const existingIndex = prev.sarungSelections.findIndex(
        (s) =>
          s.product.id === product.id &&
          (productSizeId ? s.productSizeId === productSizeId : !s.productSizeId),
      )

      const newSelections = [...prev.sarungSelections]

      if (quantity === 0) {
        // Remove selection if quantity is 0
        if (existingIndex >= 0) {
          newSelections.splice(existingIndex, 1)
        }
      } else {
        // Add or update selection
        const newSelection = {
          product,
          quantity,
          productSizeId,
          selectedSize,
        }

        if (existingIndex >= 0) {
          newSelections[existingIndex] = newSelection
        } else {
          newSelections.push(newSelection)
        }
      }

      const totalDistributed = newSelections.reduce((sum, s) => sum + s.quantity, 0)

      return {
        sarungSelections: newSelections,
        totalDistributed,
        remainingJas: jasQuantity - totalDistributed,
      }
    })
  }
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSarung(null)
      setSarungDistribution({
        sarungSelections: [],
        totalDistributed: 0,
        remainingJas: jasQuantity,
      })
      setRetryCount(0)
      setLastError(null)
      setValidationErrors([])
      setSearchQuery('') // Reset search query
      setCurrentPage(1) // ✅ Reset pagination
    } else {
      // Reset distribution state when modal opens
      setSarungDistribution({
        sarungSelections: [],
        totalDistributed: 0,
        remainingJas: jasQuantity,
      })
      setSearchQuery('') // Reset search query on open
      setCurrentPage(1) // ✅ Reset to first page
    }
  }, [isOpen, jasQuantity])

  // ✅ Reset to page 1 only when debounced search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery])

  // Task 11: Enhanced sarung selection with comprehensive validation and real-time stock checking
  // Task 12: Added comprehensive input validation and security measures
  // Task 18: Enhanced for quantity distribution
  const handleSarungSelection = (product: Product, quantity: number, productSizeId?: string) => {
    try {
      // Task 12: Rate limiting check
      if (!globalRateLimiter.canSubmit(sessionId)) {
        const remaining = globalRateLimiter.getRemainingSubmissions(sessionId)
        toast.error(
          'Terlalu Banyak Percobaan',
          `Silakan tunggu sebelum mencoba lagi. Sisa: ${remaining}`,
        )
        return
      }

      // Task 18: Enhanced quantity validation for distribution
      const currentSelected = getSelectedSarungQuantity(product.id, productSizeId)
      const quantityDifference = quantity - currentSelected
      const newTotalDistributed = sarungDistribution.totalDistributed + quantityDifference

      // Validate total distribution doesn't exceed jas quantity
      if (newTotalDistributed > jasQuantity) {
        const maxAllowed = jasQuantity - (sarungDistribution.totalDistributed - currentSelected)
        setValidationErrors([
          `Maksimal ${maxAllowed} sarung dapat dipilih (sisa jas: ${sarungDistribution.remainingJas + currentSelected})`,
        ])
        toast.error('Jumlah Melebihi Batas', `Maksimal ${maxAllowed} sarung dapat dipilih`)
        return
      }

      // Task 12: Comprehensive input validation
      const quantityValidation = validateQuantityInput(
        quantity,
        product.availableQuantity || 0,
        jasQuantity,
      )

      if (!quantityValidation.isValid) {
        setValidationErrors(quantityValidation.errors)
        toast.error('Validasi Gagal', quantityValidation.errors[0])
        return
      }

      // Task 12: Product data validation (pairing context)
      const productValidation = validateProductData(product, true)
      if (!productValidation.isValid) {
        setValidationErrors(productValidation.errors)
        toast.error('Data Produk Tidak Valid', productValidation.errors[0])
        return
      }

      // Task 12: Size selection validation if applicable
      if (productSizeId) {
        const selectedSize = product.sizes?.find((size) => size.id === productSizeId)
        const sizeValidation = validateProductSizeSelection(product, productSizeId, selectedSize)

        if (!sizeValidation.isValid) {
          setValidationErrors(sizeValidation.errors)
          toast.error('Ukuran Tidak Valid', sizeValidation.errors[0])
          return
        }
      }

      // Real-time stock validation
      if (product.availableQuantity !== undefined && product.availableQuantity < quantity) {
        const pairingError = createSarungPairingError(
          SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK,
          {
            available: product.availableQuantity,
            requested: quantity,
            sarungName: product.name,
            sarungProductId: product.id,
          },
        )

        setValidationErrors([pairingError.userMessage])
        toast.error('Stok Tidak Cukup', pairingError.userMessage)
        return
      }

      // Validate the selection using the pairing service
      const validationResult = sarungPairingService.validatePairingSelection(
        jasProduct,
        product,
        jasQuantity,
        quantity,
      )

      if (!validationResult.isValid) {
        setValidationErrors([validationResult.error || 'Validasi gagal'])
        toast.error('Validasi Gagal', validationResult.error || 'Validasi gagal')
        return
      }

      // Task 18: Update distribution state instead of single selection
      updateSarungDistribution(product, quantity, productSizeId)

      // Clear any previous errors and record successful selection
      setLastError(null)
      setValidationErrors([])
      globalRateLimiter.recordSubmission(sessionId)

      if (quantity > 0) {
        toast.success('Berhasil', `${quantity}x Sarung ${product.name} dipilih`)
      } else {
        toast.info('Info', `Sarung ${product.name} dihapus dari pilihan`)
      }
    } catch (err) {
      console.error('Error in sarung selection:', err)
      const pairingError = createSarungPairingError(
        SarungPairingErrorType.PAIRING_VALIDATION_FAILED,
        {
          jasProductId: jasProduct.id,
          sarungProductId: product.id,
          reason: err instanceof Error ? err.message : 'Unknown validation error',
        },
      )

      setLastError(pairingError.userMessage)
      setValidationErrors([pairingError.userMessage])
      toast.error('Gagal Memilih Sarung', pairingError.userMessage)
    }
  }

  // Task 11: Enhanced confirmation with error handling
  // Task 12: Added comprehensive validation before submission
  // Task 18: Enhanced for quantity distribution
  const handleConfirmWithSarung = () => {
    if (sarungDistribution.sarungSelections.length === 0) return

    try {
      setIsSubmitting(true)

      // Task 12: Rate limiting check for submission
      if (!globalRateLimiter.canSubmit(sessionId)) {
        toast.error('Terlalu Banyak Percobaan', 'Silakan tunggu sebelum mencoba lagi')
        setIsSubmitting(false)
        return
      }

      // Task 18: Create multiple cart additions for distribution
      const cartAdditions: Array<{
        product: Product
        quantity: number
        productSizeId?: string
        linkedSarung?: ProductSelection['linkedSarung']
      }> = []

      // Add jas with sarung for each sarung selection
      sarungDistribution.sarungSelections.forEach((selection) => {
        const linkedSarungData: ProductSelection['linkedSarung'] = {
          productId: selection.product.id,
          productSizeId: selection.productSizeId || '',
          quantity: selection.quantity,
          selectedSize: selection.selectedSize!,
          // ✅ TASK 3: Include product reference for sarung code display
          product: selection.product,
        }

        cartAdditions.push({
          product: jasProduct,
          quantity: selection.quantity,
          productSizeId: jasProductSizeId, // ✅ FIXED: Use jasProductSizeId prop
          linkedSarung: linkedSarungData,
        })
      })

      // Add remaining jas without sarung (if any)
      if (sarungDistribution.remainingJas > 0) {
        cartAdditions.push({
          product: jasProduct,
          quantity: sarungDistribution.remainingJas,
          productSizeId: jasProductSizeId, // ✅ FIXED: Use jasProductSizeId prop
          // No linkedSarung = tanpa sarung
        })
      }

      // Record successful submission
      globalRateLimiter.recordSubmission(sessionId)

      // Pass array of cart additions to parent
      onConfirmSelection(cartAdditions)
    } catch (err) {
      console.error('Error confirming sarung distribution:', err)
      setValidationErrors(['Terjadi kesalahan saat mengkonfirmasi distribusi sarung'])
      toast.error('Gagal Konfirmasi', 'Terjadi kesalahan saat mengkonfirmasi distribusi sarung')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmWithoutSarung = () => {
    try {
      setIsSubmitting(true)

      // Task 12: Rate limiting check
      if (!globalRateLimiter.canSubmit(sessionId)) {
        toast.error('Terlalu Banyak Percobaan', 'Silakan tunggu sebelum mencoba lagi')
        setIsSubmitting(false)
        return
      }

      // Task 12: Basic validation for jas product (pairing context)
      const jasValidation = validateProductData(jasProduct, true)
      if (!jasValidation.isValid) {
        setValidationErrors(jasValidation.errors)
        toast.error('Data Jas Tidak Valid', jasValidation.errors[0])
        setIsSubmitting(false)
        return
      }

      // Record submission
      globalRateLimiter.recordSubmission(sessionId)

      onConfirmSelection()
    } catch (err) {
      console.error('Error confirming without sarung:', err)
      setValidationErrors(['Terjadi kesalahan saat mengkonfirmasi tanpa sarung'])
      toast.error('Gagal Konfirmasi', 'Terjadi kesalahan saat mengkonfirmasi tanpa sarung')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Task 11: Enhanced retry function
  const handleRetry = () => {
    setRetryCount(0)
    setLastError(null)
    setValidationErrors([])
    refetchSarungProducts() // Use API refetch instead of custom loading
  }

  const handleClose = () => {
    if (!isLoading && !isSubmitting) {
      onClose()
    }
  }

  // Task 18: Distribution Preview Component
  const DistributionPreview = () => {
    if (sarungDistribution.sarungSelections.length === 0) return null

    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">Distribusi Sarung:</h4>

        {/* Selected sarung breakdown */}
        <div className="space-y-2 mb-3">
          {sarungDistribution.sarungSelections.map((selection, index) => (
            <div
              key={`${selection.product.id}-${selection.productSizeId || 'no-size'}-${index}`}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-blue-800">
                {selection.quantity}x {jasProduct.name}
              </span>
              <span className="text-green-700 font-medium">
                → dengan {selection.product.name}
                {selection.selectedSize && ` (${selection.selectedSize.size})`}
              </span>
            </div>
          ))}
        </div>

        {/* Remaining jas without sarung */}
        {sarungDistribution.remainingJas > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 border-t border-blue-200 pt-2">
            <span>
              {sarungDistribution.remainingJas}x {jasProduct.name}
            </span>
            <span>→ tanpa sarung</span>
          </div>
        )}

        {/* Total summary */}
        <div className="border-t border-blue-200 mt-3 pt-2 font-medium text-blue-900 text-sm">
          Total: {jasQuantity}x {jasProduct.name}
          <span className="text-xs text-blue-700 ml-2">
            ({sarungDistribution.totalDistributed} dengan sarung, {sarungDistribution.remainingJas}{' '}
            tanpa sarung)
          </span>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="min-w-[60vw] w-[95vw] max-h-[95vh] overflow-hidden z-50 flex flex-col"
        showCloseButton={false}
        aria-describedby="sarung-selection-desc"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Pilih Sarung</DialogTitle>
              <DialogDescription id="sarung-selection-desc" className="text-xs text-gray-500 mt-0.5">
                Pilih produk sarung pasangan untuk jas <span className="font-semibold text-gray-700">{jasProduct.name}</span> ({jasQuantity} pcs)
              </DialogDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading || isSubmitting}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {/* Search Bar & Pagination Row - ALWAYS MOUNTED to maintain focus and prevent layout shift */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari sarung (nama, kode, warna)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
                aria-label="Cari sarung berdasarkan nama, kode, atau warna"
              />
              {/* Spinner indicator when debouncing or fetching */}
              {isDebouncing || (isFetching && !isLoading) ? (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  aria-label="Hapus teks pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination className="w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1 && !isFetching) {
                          setCurrentPage(currentPage - 1)
                        }
                      }}
                      className={
                        currentPage === 1 || isFetching
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                      text="Prev"
                      aria-label="Halaman sebelumnya"
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {(() => {
                    const pages: (number | 'ellipsis')[] = []
                    const maxVisible = 3

                    if (totalPages <= maxVisible + 2) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push(1)
                      const start = Math.max(2, currentPage - 1)
                      const end = Math.min(totalPages - 1, currentPage + 1)

                      if (start > 2) pages.push('ellipsis')
                      for (let i = start; i <= end; i++) pages.push(i)
                      if (end < totalPages - 1) pages.push('ellipsis')

                      pages.push(totalPages)
                    }

                    return pages.map((page, idx) => (
                      <PaginationItem key={idx}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (!isFetching && page !== currentPage) {
                                setCurrentPage(page)
                              }
                            }}
                            isActive={currentPage === page}
                            className={
                              isFetching ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                            }
                            aria-label={`Halaman ${page}`}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages && !isFetching) {
                          setCurrentPage(currentPage + 1)
                        }
                      }}
                      className={
                        currentPage === totalPages || isFetching
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                      text="Next"
                      aria-label="Halaman berikutnya"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Results Info & Status Bar */}
          <div className="flex items-center justify-between min-h-[24px]">
            {retryCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isLoading || isFetching}
                className="text-blue-600 hover:text-blue-700 text-xs h-7"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Coba Lagi
              </Button>
            )}

            {/* Accessible Live status announcements */}
            <span
              role="status"
              aria-live="polite"
              className="text-xs text-gray-500 ml-auto flex items-center gap-1.5"
            >
              {isDebouncing || (isFetching && !isLoading) ? (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memperbarui data...
                </span>
              ) : totalItems > 0 ? (
                <span>
                  Menampilkan {sarungProducts.length} dari {totalItems} sarung
                  {debouncedSearchQuery && ` (pencarian: "${debouncedSearchQuery}")`}
                </span>
              ) : null}
            </span>
          </div>

          {/* Error display */}
          {(lastError || validationErrors.length > 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1.5" role="alert">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="text-sm font-medium text-orange-800">
                  {validationErrors.length > 0 ? 'Kesalahan Validasi' : 'Kesalahan Sistem'}
                </span>
              </div>

              {validationErrors.length > 0 && (
                <div className="space-y-1 text-xs text-orange-800 pl-6">
                  {validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}

              {lastError && !validationErrors.length && (
                <span className="text-xs text-orange-800 pl-6 block">{lastError}</span>
              )}

              {retryCount > 0 && (
                <div className="text-xs text-orange-600 pl-6">
                  Percobaan ke-{retryCount + 1} dari 3
                </div>
              )}
            </div>
          )}

          {/* Product Grid Content with Smooth Transitions */}
          {isLoading && sarungProducts.length === 0 ? (
            <div className="text-center py-12" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {retryCount > 0 ? `Mencoba lagi... (${retryCount + 1}/3)` : 'Memuat data sarung...'}
              </p>
            </div>
          ) : sarungProducts.length === 0 && debouncedSearchQuery ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="text-gray-500 space-y-3">
                <Search className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="text-base font-medium text-gray-700">
                  Tidak ada sarung untuk &quot;{debouncedSearchQuery}&quot;
                </p>
                <p className="text-xs text-gray-500">
                  Coba kata kunci lain atau{' '}
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-blue-600 hover:text-blue-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    hapus pencarian
                  </button>
                </p>
              </div>
            </div>
          ) : sarungProducts.length === 0 ? (
            <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="text-gray-500 space-y-2">
                <p className="text-sm font-medium">Tidak ada sarung yang tersedia saat ini</p>
                {(lastError || apiError) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Muat Ulang
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[58vh] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                isFetching ? 'opacity-70 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200'
              }`}
            >
              {sarungProducts.map((product) => {
                const selectedQuantity = getSelectedSarungQuantity(product.id)

                return (
                  <div
                    key={product.id}
                    className={`relative transform transition-all duration-200 rounded-xl ${
                      selectedQuantity > 0
                        ? 'ring-4 ring-blue-500 ring-offset-2 shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleSarungSelection}
                      selectedQuantity={selectedQuantity}
                      onOpenHistory={onOpenHistory}
                      className="h-full min-h-[440px] w-full"
                      context="sarung-modal"
                      buttonTextOverride="Pilih"
                      showCustomBadge={{
                        text: 'GRATIS',
                        className: 'bg-green-500 text-white text-xs px-2 py-1 shadow-sm font-semibold',
                      }}
                    />
                    {selectedQuantity > 0 && (
                      <div className="absolute -top-2 -left-2 z-10">
                        <Badge className="bg-blue-600 text-white shadow-md text-xs px-2.5 py-0.5">
                          ✓ {selectedQuantity}x
                        </Badge>
                      </div>
                    )}
                    {product.availableQuantity !== undefined && product.availableQuantity <= 2 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 shadow-md">
                          Stok: {product.availableQuantity}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Task 18: Distribution Preview */}
          <DistributionPreview />

          {/* Legacy Selected Sarung Info - kept for backward compatibility */}
          {selectedSarung && sarungDistribution.sarungSelections.length === 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-2.5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <Badge className="bg-green-500 text-white shadow-sm">✓ Sarung Terpilih</Badge>
                <span className="font-semibold text-gray-900">
                  {selectedSarung.product.name}
                </span>
                <Badge variant="outline" className="border-gray-400 text-gray-700 font-medium">
                  {selectedSarung.quantity}x
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleConfirmWithoutSarung}
              variant="outline"
              disabled={isLoading || isSubmitting}
              className="flex-1 h-11 text-sm border-gray-300 hover:bg-gray-50"
            >
              Tanpa Sarung
            </Button>
            <Button
              onClick={handleConfirmWithSarung}
              disabled={
                sarungDistribution.sarungSelections.length === 0 || isLoading || isSubmitting
              }
              className="flex-1 h-11 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 font-medium"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Konfirmasi Distribusi
                  {sarungDistribution.totalDistributed > 0 && (
                    <span className="ml-2 text-xs bg-blue-500 px-2 py-0.5 rounded">
                      {sarungDistribution.totalDistributed}/{jasQuantity}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
