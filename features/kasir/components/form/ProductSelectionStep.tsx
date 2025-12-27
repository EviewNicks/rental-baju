'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '../ui/product-card'
import { KasirFilterBar } from '../ui/KasirFilterBar'
import { SarungSelectionModal } from '../ui/SarungSelectionModal'
import { SarungPairingIndicator } from '../ui/SarungPairingIndicator'
import type { Product, ProductSelection, KasirFilters } from '../../types'
import { useAvailableProducts } from '../../hooks/useProduk'
import { formatCurrency } from '../../lib/utils/client'
import { generateCartItemKey } from '../../lib/utils/keyGeneration'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  createAvailabilityError, 
  determineErrorType, 
  type AvailabilityError 
} from '../../lib/errors/availabilityErrors'
import { ProductHistoryPopup } from '../ui/ProductHistoryPopup'
import { isJasProduct, isLinkedSarung } from '../../lib/utils/jasSarungUtils'
import { 
  createSarungPairingError, 
  executeFallbackAction,
  SarungPairingErrorType,
  type SarungPairingError
} from '../../lib/errors/sarungPairingErrors'
import {
  validateQuantityInput,
  validateProductData,
  validateProductSizeSelection,
  globalRateLimiter
} from '../../lib/validation/sarungValidation'
import { toast } from '@/lib/notifications'

interface ProductSelectionStepProps {
  selectedProducts: ProductSelection[]
  onAddProduct: (product: Product, quantity: number, productSizeId?: string) => void
  onRemoveProduct: (productId: string, productSizeId?: string) => void
  onUpdateQuantity: (productId: string, quantity: number, productSizeId?: string) => void
  onNext: () => void
  canProceed: boolean
}

export function ProductSelectionStep({
  selectedProducts,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
  onNext,
  canProceed,
}: ProductSelectionStepProps) {
  const [filters, setFilters] = useState<KasirFilters>({
    search: '',
    categoryId: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc',
    minPrice: undefined,
    maxPrice: undefined,
  })
  const [showCart, setShowCart] = useState(false)
  // Pagination state - FIXED: Use pageSize from filters state for consistency
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  // Enhanced error handling for availability checks
  const [availabilityErrors, setAvailabilityErrors] = useState<Map<string, AvailabilityError>>(new Map())
  const [validationErrors, setValidationErrors] = useState<Map<string, string[]>>(new Map())
  
  // History popup state management
  const [historyPopup, setHistoryPopup] = useState<{
    isOpen: boolean
    productSizeId: string
    productName: string
    size: string
    ageCategory: string
  }>({
    isOpen: false,
    productSizeId: '',
    productName: '',
    size: '',
    ageCategory: '',
  })

  // Sarung selection modal state management
  const [sarungModal, setSarungModal] = useState<{
    isOpen: boolean
    jasProduct: Product | null
    jasQuantity: number
    jasProductSizeId?: string
    retryCount: number
    lastError?: SarungPairingError
  }>({
    isOpen: false,
    jasProduct: null,
    jasQuantity: 0,
    jasProductSizeId: undefined,
    retryCount: 0,
    lastError: undefined,
  })

  // Helper function to safely render error details
  const renderErrorDetails = (error: AvailabilityError) => {
    if (!error.details?.productId) return null
    
    const productId = error.details.productId as string
    return (
      <p className="text-xs text-orange-600 mt-1">
        Produk ID: {productId}
      </p>
    )
  }

  // History popup handlers
  const openHistoryPopup = (productSizeId: string, productName: string, size: string, ageCategory: string) => {
    setHistoryPopup({
      isOpen: true,
      productSizeId,
      productName,
      size,
      ageCategory,
    })
  }

  const closeHistoryPopup = () => {
    setHistoryPopup({
      isOpen: false,
      productSizeId: '',
      productName: '',
      size: '',
      ageCategory: '',
    })
  }

  // Sarung modal handlers with enhanced error handling
  const openSarungModal = (jasProduct: Product, jasQuantity: number, jasProductSizeId?: string) => {
    setSarungModal({
      isOpen: true,
      jasProduct,
      jasQuantity,
      jasProductSizeId,
      retryCount: 0,
      lastError: undefined,
    })
  }

  const closeSarungModal = () => {
    setSarungModal({
      isOpen: false,
      jasProduct: null,
      jasQuantity: 0,
      jasProductSizeId: undefined,
      retryCount: 0,
      lastError: undefined,
    })
  }

  // Task 11: Enhanced sarung selection with comprehensive error handling
  const handleSarungSelection = () => {
    if (!sarungModal.jasProduct) return

    try {
      // Add the jas product with pairing data
      onAddProduct(sarungModal.jasProduct, sarungModal.jasQuantity, sarungModal.jasProductSizeId)
      
      // Close the modal on success
      closeSarungModal()
      
      // Show success message
      toast.success('Berhasil', 'Jas berhasil ditambahkan ke keranjang')
      
    } catch (err) {
      console.error('Error processing sarung selection:', err)
      
      // Create pairing error
      const pairingError = createSarungPairingError(
        SarungPairingErrorType.PAIRING_VALIDATION_FAILED,
        {
          jasProductId: sarungModal.jasProduct.id,
          reason: err instanceof Error ? err.message : 'Unknown error during pairing'
        }
      )
      
      // Execute fallback action
      executeFallbackAction(pairingError, {
        jasProduct: {
          id: sarungModal.jasProduct.id,
          name: sarungModal.jasProduct.name,
          category: sarungModal.jasProduct.category
        },
        jasQuantity: sarungModal.jasQuantity,
        jasProductSizeId: sarungModal.jasProductSizeId,
        onAddJasOnly: (fallbackProduct, quantity, productSizeId) => {
          try {
            // Use original product for addition
            onAddProduct(sarungModal.jasProduct!, quantity, productSizeId)
            toast.warning('Peringatan', 'Jas ditambahkan tanpa sarung karena terjadi kesalahan')
            closeSarungModal()
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr)
            toast.error('Gagal', 'Tidak dapat menambahkan jas ke keranjang')
            closeSarungModal()
          }
        },
        onRetryModal: () => {
          // Update retry count and error
          setSarungModal(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1,
            lastError: pairingError
          }))
          toast.info('Info', 'Silakan coba pilih sarung lagi')
        },
        onRefreshData: () => {
          // Refresh products data
          refetch()
          toast.info('Info', 'Data produk diperbarui, silakan coba lagi')
        },
        onContactAdmin: (error) => {
          toast.error('Kesalahan Serius', 'Silakan hubungi admin untuk bantuan')
          console.error('Admin contact required:', error)
          closeSarungModal()
        }
      })
    }
  }

  // Dynamic page size calculation based on current data
  const availablePageSizes = [12, 24, 48]
  const getOptimalPageSize = (totalItems: number) => {
    return availablePageSizes.find((size) => size >= totalItems) || 12
  }

  // Debug logging for props
  useEffect(() => {}, [selectedProducts, canProceed])

  // Fetch products from API with enhanced filters
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
  } = useAvailableProducts({
    search: filters.search,
    categoryId: filters.categoryId,
    status: filters.status as 'AVAILABLE' | 'RENTED' | undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    available: true, // Default to available for kasir workflow
    page: currentPage,
    limit: pageSize,
  })

  // Transform API data to match component interface
  const products = useMemo(() => {
    if (!productsResponse?.data) {
      return []
    }

    return productsResponse.data.map((apiProduct): Product => {
      // Simplified mapping - API now handles all size logic with Enhanced ProductSize
      const size = apiProduct.size || 'Unknown'
      const color = apiProduct.color?.name || 'Unknown'

      return {
        id: apiProduct.id,
        code: apiProduct.code, // ✅ FIXED: Map product code from API
        name: apiProduct.name,
        category: apiProduct.category.name.toLowerCase(),
        categoryType: apiProduct.category.type,
        size, // Enhanced with fallback logic
        color, // Enhanced with fallback logic
        pricePerDay: apiProduct.currentPrice,
        image: apiProduct.imageUrl || '/placeholder.svg',
        available: true, // Availability is now handled in ProductCard with quantity-aware logic
        description: apiProduct.description,
        availableQuantity: apiProduct.availableQuantity,

        // RPK-51: Map size-aware fields from API response
        sizes: apiProduct.sizes || [],
        supportsSizeSelection: (apiProduct.sizes?.length ?? 0) > 0,
      }
    })
  }, [productsResponse])

  const getSelectedQuantity = (productId: string, productSizeId?: string) => {
    const selected = selectedProducts.find(
      (item) =>
        item.product.id === productId &&
        (productSizeId ? item.productSizeId === productSizeId : !item.productSizeId),
    )
    return selected?.quantity || 0
  }

  const getTotalItems = () => {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return selectedProducts.reduce((total, item) => {
      // Fixed 4-day package pricing - no duration multiplication
      const itemPrice = item.product.pricePerDay * item.quantity
      
      // Check if this is a linked sarung (should be free)
      const isItemLinkedSarung = isLinkedSarung(
        item.product.id,
        item.productSizeId,
        selectedProducts
      )
      
      // Exclude linked sarung prices from total
      return total + (isItemLinkedSarung ? 0 : itemPrice)
    }, 0)
  }

  const handleAddProduct = (product: Product, quantity: number, productSizeId?: string) => {
    try {
      // Task 12: Generate session ID for rate limiting
      const sessionId = `product-selection-${Date.now()}`
      
      // Task 12: Rate limiting check
      if (!globalRateLimiter.canSubmit(sessionId)) {
        const remaining = globalRateLimiter.getRemainingSubmissions(sessionId)
        toast.error('Terlalu Banyak Percobaan', `Silakan tunggu sebelum mencoba lagi. Sisa: ${remaining}`)
        return
      }

      // Task 12: Input validation
      const productValidation = validateProductData(product)
      if (!productValidation.isValid) {
        const errorKey = `${product.id}-validation`
        const newErrors = new Map(validationErrors)
        newErrors.set(errorKey, productValidation.errors)
        setValidationErrors(newErrors)
        toast.error('Data Produk Tidak Valid', productValidation.errors[0])
        return
      }

      // Task 12: Quantity validation
      const quantityValidation = validateQuantityInput(
        quantity,
        product.availableQuantity || 0,
        quantity // For non-jas products, jas quantity equals selected quantity
      )
      
      if (!quantityValidation.isValid) {
        const errorKey = `${product.id}-quantity`
        const newErrors = new Map(validationErrors)
        newErrors.set(errorKey, quantityValidation.errors)
        setValidationErrors(newErrors)
        toast.error('Jumlah Tidak Valid', quantityValidation.errors[0])
        return
      }

      // Task 12: Size validation if applicable
      if (productSizeId) {
        const selectedSize = product.sizes?.find(size => size.id === productSizeId)
        const sizeValidation = validateProductSizeSelection(product, productSizeId, selectedSize)
        
        if (!sizeValidation.isValid) {
          const errorKey = `${product.id}-size`
          const newErrors = new Map(validationErrors)
          newErrors.set(errorKey, sizeValidation.errors)
          setValidationErrors(newErrors)
          toast.error('Ukuran Tidak Valid', sizeValidation.errors[0])
          return
        }
      }

      // Clear any previous validation errors for this product
      const errorKey = `${product.id}-${productSizeId || 'no-size'}`
      if (validationErrors.has(errorKey)) {
        const newErrors = new Map(validationErrors)
        newErrors.delete(errorKey)
        setValidationErrors(newErrors)
      }

      // Clear any previous availability errors for this product
      if (availabilityErrors.has(errorKey)) {
        const newErrors = new Map(availabilityErrors)
        newErrors.delete(errorKey)
        setAvailabilityErrors(newErrors)
      }

      // Task 11: Enhanced jas product detection with error handling
      if (isJasProduct(product)) {
        try {
          // Validate jas product before opening modal
          if (!product.availableQuantity || product.availableQuantity < quantity) {
            const pairingError = createSarungPairingError(
              SarungPairingErrorType.SARUNG_INSUFFICIENT_STOCK,
              {
                available: product.availableQuantity || 0,
                requested: quantity,
                sarungName: product.name,
                jasProductId: product.id
              }
            )
            
            toast.error('Stok Tidak Cukup', pairingError.userMessage)
            return
          }
          
          // Record successful selection attempt
          globalRateLimiter.recordSubmission(sessionId)
          
          openSarungModal(product, quantity, productSizeId)
          return // Don't add to cart yet, wait for sarung selection
          
        } catch (modalErr) {
          console.error('Error opening sarung modal:', modalErr)
          
          const pairingError = createSarungPairingError(
            SarungPairingErrorType.MODAL_LOAD_FAILED,
            {
              jasProductId: product.id,
              error: modalErr instanceof Error ? modalErr.message : 'Modal failed to open'
            }
          )
          
          // Execute fallback: add jas without sarung
          executeFallbackAction(pairingError, {
            jasProduct: {
              id: product.id,
              name: product.name,
              category: product.category
            },
            jasQuantity: quantity,
            jasProductSizeId: productSizeId,
            onAddJasOnly: (fallbackProduct, fallbackQuantity, fallbackProductSizeId) => {
              // Proceed with normal product addition using original product
              handleNormalProductAddition(product, fallbackQuantity, fallbackProductSizeId)
            },
            onRetryModal: () => {
              toast.info('Info', 'Silakan coba lagi untuk memilih sarung')
            },
            onRefreshData: () => {
              refetch()
            },
            onContactAdmin: () => {
              toast.error('Kesalahan Serius', 'Silakan hubungi admin')
            }
          })
          
          return
        }
      }

      // Handle normal product addition (non-jas products)
      // Record successful selection
      globalRateLimiter.recordSubmission(sessionId)
      
      handleNormalProductAddition(product, quantity, productSizeId)
      
    } catch (err) {
      // Handle availability errors when adding products
      console.error('Error adding product:', {
        productId: product.id,
        productSizeId,
        quantity,
        error: err,
        timestamp: new Date().toISOString()
      })

      const errorType = determineErrorType(err)
      const availabilityError = createAvailabilityError(errorType, {
        productId: product.id,
        productSizeId,
        requestedQuantity: quantity,
        availableQuantity: product.availableQuantity,
        message: err instanceof Error ? err.message : 'Unknown error'
      })

      // Store error for this specific product/size combination
      const errorKey = `${product.id}-${productSizeId || 'no-size'}`
      const newErrors = new Map(availabilityErrors)
      newErrors.set(errorKey, availabilityError)
      setAvailabilityErrors(newErrors)
      
      // Show user-friendly error message
      toast.error('Gagal Menambahkan Produk', availabilityError.userMessage)
    }
  }

  // Task 11: Separate function for normal product addition with error handling
  const handleNormalProductAddition = (product: Product, quantity: number, productSizeId?: string) => {
    try {
      // Enhanced duplicate detection: Check if product with same size is already in cart
      const existingProductIndex = selectedProducts.findIndex(
        (item) =>
          item.product.id === product.id &&
          (productSizeId ? item.productSizeId === productSizeId : !item.productSizeId),
      )

      if (existingProductIndex >= 0) {
        // Update quantity of existing size-specific item
        const existingProduct = selectedProducts[existingProductIndex]
        onUpdateQuantity(product.id, existingProduct.quantity + quantity, productSizeId)
        toast.success('Berhasil', `Jumlah ${product.name} diperbarui`)
      } else {
        // Add new product (with optional productSizeId)
        onAddProduct(product, quantity, productSizeId)
        toast.success('Berhasil', `${product.name} ditambahkan ke keranjang`)
      }
    } catch (err) {
      console.error('Error in normal product addition:', err)
      throw err // Re-throw to be handled by parent function
    }
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number, productSizeId?: string) => {
    if (newQuantity <= 0) {
      // Check if this is a jas product with linked sarung
      const jasItem = selectedProducts.find(
        (item) =>
          item.product.id === productId &&
          (productSizeId ? item.productSizeId === productSizeId : !item.productSizeId)
      )
      
      // If removing a jas with linked sarung, also remove the sarung
      if (jasItem?.linkedSarung) {
        // Remove the linked sarung first
        onRemoveProduct(jasItem.linkedSarung.productId, jasItem.linkedSarung.productSizeId)
      }
      
      // Remove the main product
      onRemoveProduct(productId, productSizeId)
    } else {
      onUpdateQuantity(productId, newQuantity, productSizeId)
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Enhanced page size handler with dynamic optimization
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)

    // Calculate optimal page size based on current data
    const optimalPageSize = getOptimalPageSize(totalItems)

    // Only change page size if it's different from current optimal
    if (newSize !== optimalPageSize) {
      setCurrentPage(1) // Reset to first page for consistency
    }
  }

  const totalPages = productsResponse?.pagination?.totalPages || 1
  const totalItems = productsResponse?.pagination?.total || 0
  const currentPageItems = productsResponse?.data?.length || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="product-selection-layout">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6" data-testid="product-selection-main-content">
        {/* Enhanced Filters for Kasir Workflow */}
        <KasirFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={isLoading}
          productCount={totalItems}
        />

        {/* Availability Errors Display - Task 7.2: Integrate error handling */}
        {/* Task 12: Enhanced error display with validation errors */}
        {(availabilityErrors.size > 0 || validationErrors.size > 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium text-orange-900">
                {validationErrors.size > 0 ? 'Peringatan Validasi & Ketersediaan' : 'Peringatan Ketersediaan'}
              </h3>
            </div>
            <div className="space-y-2">
              {/* Display validation errors */}
              {Array.from(validationErrors.entries()).map(([key, errors]) => (
                <div key={`validation-${key}`} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm font-medium text-orange-900 mb-1">Kesalahan Validasi:</div>
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-orange-800">• {error}</p>
                  ))}
                  <Button
                    onClick={() => {
                      const newErrors = new Map(validationErrors)
                      newErrors.delete(key)
                      setValidationErrors(newErrors)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 p-0 h-auto mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Tutup
                  </Button>
                </div>
              ))}
              
              {/* Display availability errors */}
              {Array.from(availabilityErrors.entries()).map(([key, error]) => (
                <div key={`availability-${key}`} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm font-medium text-orange-900 mb-1">Ketersediaan Produk:</div>
                  <p className="text-sm text-orange-800">{error.userMessage}</p>
                  {renderErrorDetails(error)}
                  <Button
                    onClick={() => {
                      const newErrors = new Map(availabilityErrors)
                      newErrors.delete(key)
                      setAvailabilityErrors(newErrors)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 p-0 h-auto mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Tutup
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
          data-testid="products-grid-section"
        >
          <div
            className="flex items-center justify-between mb-6"
            data-testid="products-grid-header"
          >
            <h2 className="text-lg font-semibold text-gray-900" data-testid="products-count-header">
              Produk Tersedia ({isLoading ? '...' : `${currentPageItems} dari ${totalItems}`})
            </h2>
            <div className="flex items-center gap-2">
              {/* Page Size Selector */}
              <select
                title="sizes"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                data-testid="page-size-selector"
              >
                {availablePageSizes.map((size) => (
                  <option key={size} value={size} disabled={size > totalItems}>
                    {size}{' '}
                    {size > totalItems ? `${size} (tidak cukup data)` : `${size} per halaman`}
                  </option>
                ))}
                {/* Show all option for cases where totalItems exceeds largest size */}
                {totalItems > Math.max(...availablePageSizes) && (
                  <option key="show-all" value={Math.max(...availablePageSizes)} disabled={false}>
                    Show All ({totalItems} items)
                  </option>
                )}
              </select>
              <Button
                variant="outline"
                onClick={() => setShowCart(!showCart)}
                className="lg:hidden"
                data-testid="mobile-cart-toggle-button"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Keranjang ({getTotalItems()})
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-12"
              data-testid="products-loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Memuat produk...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12" data-testid="products-error-state">
              <Package className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <div className="text-lg text-red-600 mb-2">Gagal memuat produk</div>
              <div className="text-sm text-gray-600 mb-4">
                Terjadi kesalahan saat mengambil data produk
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                data-testid="products-retry-button"
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Products Content */}
          {!isLoading && !error && (
            <>
              {products.length > 0 ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  data-testid="products-grid"
                >
                  {products.map((product) => (
                    <div
                      key={`${product.id}-product-card`}
                      data-testid={`product-card-${product.id}`}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddProduct}
                        selectedQuantity={getSelectedQuantity(product.id)}
                        onOpenHistory={openHistoryPopup}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="products-empty-state">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-lg text-gray-500 mb-2">
                    Tidak ada produk yang sesuai dengan filter
                  </div>
                  <div className="text-sm text-gray-400">
                    Coba ubah filter atau kata kunci pencarian
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && totalPages > 1 && (
            <div
              className="mt-6 flex items-center justify-between"
              data-testid="pagination-controls"
            >
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages} ({totalItems} total produk)
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  data-testid="pagination-prev-button"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          'w-8 h-8 p-0',
                          currentPage === pageNum &&
                            'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
                        )}
                        data-testid={`pagination-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  data-testid="pagination-next-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={cn('lg:block', showCart ? 'block' : 'hidden')} data-testid="cart-sidebar">
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 sticky top-32"
          data-testid="cart-container"
        >
          <div className="flex items-center justify-between mb-4" data-testid="cart-header">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Keranjang</h3>
            </div>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
              data-testid="cart-item-count"
            >
              {getTotalItems()} item
            </Badge>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8" data-testid="cart-empty-state">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Keranjang masih kosong</p>
              <p className="text-gray-400 text-xs mt-1">Pilih produk untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="cart-content">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto" data-testid="cart-items-list">
                {selectedProducts.map((item) => (
                  <div
                    key={generateCartItemKey(item.product.id, item.productSizeId)}
                    className="bg-gray-50 rounded-lg p-3"
                    data-testid={`cart-item-${item.product.id}-${item.productSizeId || 'no-size'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Image
                        src={
                          item.product.image?.startsWith('/') ||
                          item.product.image?.startsWith('http')
                            ? item.product.image || '/products/image.png'
                            : `/${item.product.image || 'products/image.png'}`
                        }
                        alt={item.product.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Show pairing indicator for jas products with linked sarung */}
                        {item.linkedSarung ? (
                          <div className="space-y-2">
                            <SarungPairingIndicator
                              jasName={item.product.name}
                              sarungName={`Sarung (ID: ${item.linkedSarung.productId.slice(-6)})`}
                              sarungOriginalPrice={0} // Will be calculated from product data
                              variant="cart"
                              className="mb-2"
                            />
                          </div>
                        ) : (
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                        )}
                        <p className="text-xs text-gray-600">
                          {item.product.size} •{' '}
                          {item.productSizeId && item.selectedSize && (
                            <span className="ml-1 font-medium text-yellow-700">
                              • Size: {item.selectedSize.size} ({item.selectedSize.ageCategory})
                            </span>
                          )}
                          {/* Fallback: Show size info if selectedSize is missing but productSizeId exists */}
                          {item.productSizeId && !item.selectedSize && item.product.sizes && (
                            <span className="ml-1 font-medium text-orange-600">
                              • Size Variant Selected
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(item.product.pricePerDay)}/4 hari
                          {item.linkedSarung && (
                            <span className="ml-2 text-green-600 font-medium">+ Sarung GRATIS</span>
                          )}
                        </p>

                        {/* Quantity Controls */}
                        <div
                          className="flex items-center gap-2 mt-2"
                          data-testid={`cart-item-controls-${item.product.id}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.productSizeId,
                              )
                            }
                            className="h-6 w-6 p-0"
                            data-testid={`cart-item-decrease-${item.product.id}-${item.productSizeId || 'no-size'}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            className="text-sm font-medium w-8 text-center"
                            data-testid={`cart-item-quantity-${item.product.id}-${item.productSizeId || 'no-size'}`}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.productSizeId,
                              )
                            }
                            className="h-6 w-6 p-0"
                            data-testid={`cart-item-increase-${item.product.id}-${item.productSizeId || 'no-size'}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveProduct(item.product.id, item.productSizeId)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
                            data-testid={`cart-item-remove-${item.product.id}-${item.productSizeId || 'no-size'}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2" data-testid="cart-summary">
                <div className="flex justify-between text-sm" data-testid="cart-total-items">
                  <span className="text-gray-600">Total Item:</span>
                  <span className="font-medium">{getTotalItems()}</span>
                </div>
                <div className="flex justify-between text-sm" data-testid="cart-duration">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-medium">4 hari</span>
                </div>
                <div
                  className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2"
                  data-testid="cart-total-price"
                >
                  <span>Total:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                data-testid="step-1-next-button"
              >
                Lanjut ke Data Penyewa
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Product History Popup - Moved to ProductSelectionStep for better display */}
      <ProductHistoryPopup
        productSizeId={historyPopup.productSizeId}
        productName={historyPopup.productName}
        size={historyPopup.size}
        ageCategory={historyPopup.ageCategory}
        isOpen={historyPopup.isOpen}
        onClose={closeHistoryPopup}
      />

      {/* Sarung Selection Modal */}
      {sarungModal.jasProduct && (
        <SarungSelectionModal
          isOpen={sarungModal.isOpen}
          onClose={closeSarungModal}
          jasProduct={sarungModal.jasProduct}
          jasQuantity={sarungModal.jasQuantity}
          availableProducts={products}
          onConfirmSelection={handleSarungSelection}
          onOpenHistory={openHistoryPopup}
        />
      )}
    </div>
  )
}
