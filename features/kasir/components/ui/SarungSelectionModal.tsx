'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { Product, ProductSize, SarungDistribution, ProductSelection } from '../../types'

interface SarungSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  jasProduct: Product
  jasQuantity: number
  jasProductSizeId?: string // ✅ ADDED: jasProductSizeId prop
  onConfirmSelection: (selectedSarung?: {
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  } | Array<{
    product: Product
    quantity: number
    productSizeId?: string
    linkedSarung?: ProductSelection['linkedSarung']
  }>) => void
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
    remainingJas: jasQuantity
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

  // Task 12: Generate session ID for rate limiting
  const sessionId = `sarung-modal-${jasProduct.id}-${Date.now()}`

  // **SOLUTION: Separate API call for sarung products**
  // This solves the data filtering conflict by fetching sarung products independently
  const {
    data: sarungProductsResponse,
    isLoading,
    error: apiError,
    refetch: refetchSarungProducts,
  } = useAvailableProducts({
    search: '', // No search filter
    categoryId: getSarungCategoryId(), // Filter specifically for sarung category
    status: undefined, // No status filter
    sortBy: 'name',
    sortOrder: 'asc',
    available: true, // Only available products
    page: 1,
    limit: 100, // Get all sarung products
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
      s => s.product.id === productId && 
           (productSizeId ? s.productSizeId === productSizeId : !s.productSizeId)
    )
    return selection?.quantity || 0
  }

  const updateSarungDistribution = (product: Product, quantity: number, productSizeId?: string) => {
    const selectedSize = productSizeId 
      ? product.sizes?.find(size => size.id === productSizeId)
      : undefined

    setSarungDistribution(prev => {
      const existingIndex = prev.sarungSelections.findIndex(
        s => s.product.id === product.id && 
             (productSizeId ? s.productSizeId === productSizeId : !s.productSizeId)
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
          selectedSize
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
        remainingJas: jasQuantity - totalDistributed
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
        remainingJas: jasQuantity
      })
      setRetryCount(0)
      setLastError(null)
      setValidationErrors([])
    } else {
      // Reset distribution state when modal opens
      setSarungDistribution({
        sarungSelections: [],
        totalDistributed: 0,
        remainingJas: jasQuantity
      })
    }
  }, [isOpen, jasQuantity])

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
        setValidationErrors([`Maksimal ${maxAllowed} sarung dapat dipilih (sisa jas: ${sarungDistribution.remainingJas + currentSelected})`])
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
        quantity
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
      sarungDistribution.sarungSelections.forEach(selection => {
        const linkedSarungData: ProductSelection['linkedSarung'] = {
          productId: selection.product.id,
          productSizeId: selection.productSizeId || '',
          quantity: selection.quantity,
          selectedSize: selection.selectedSize!,
          // ✅ TASK 3: Include product reference for sarung code display
          product: selection.product
        }
        
        cartAdditions.push({
          product: jasProduct,
          quantity: selection.quantity,
          productSizeId: jasProductSizeId, // ✅ FIXED: Use jasProductSizeId prop
          linkedSarung: linkedSarungData
        })
      })

      // Add remaining jas without sarung (if any)
      if (sarungDistribution.remainingJas > 0) {
        cartAdditions.push({
          product: jasProduct,
          quantity: sarungDistribution.remainingJas,
          productSizeId: jasProductSizeId // ✅ FIXED: Use jasProductSizeId prop
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
            <div key={`${selection.product.id}-${selection.productSizeId || 'no-size'}-${index}`} 
                 className="flex justify-between items-center text-sm">
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
            <span>{sarungDistribution.remainingJas}x {jasProduct.name}</span>
            <span>→ tanpa sarung</span>
          </div>
        )}
        
        {/* Total summary */}
        <div className="border-t border-blue-200 mt-3 pt-2 font-medium text-blue-900 text-sm">
          Total: {jasQuantity}x {jasProduct.name} 
          <span className="text-xs text-blue-700 ml-2">
            ({sarungDistribution.totalDistributed} dengan sarung, {sarungDistribution.remainingJas} tanpa sarung)
          </span>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="min-w-[60vw] w-[95vw]  max-h-[95vh]  overflow-hidden z-50 "
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
          <DialogTitle>Pilih Sarung untuk {jasProduct.name}</DialogTitle>
          
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading || isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          

          {/* Sarung Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {retryCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Coba Lagi
                </Button>
              )}
            </div>

            {/* Task 11: Error display with retry information */}
            {/* Task 12: Enhanced error display with validation errors */}
            {(lastError || validationErrors.length > 0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-1 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    {validationErrors.length > 0 ? 'Kesalahan Validasi' : 'Kesalahan Sistem'}
                  </span>
                </div>

                {/* Display validation errors */}
                {validationErrors.length > 0 && (
                  <div className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-orange-800">
                        • {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* Display system errors */}
                {lastError && !validationErrors.length && (
                  <span className="text-sm text-orange-800">{lastError}</span>
                )}

                {retryCount > 0 && (
                  <div className="mt-2 text-xs text-orange-600">
                    Percobaan ke-{retryCount + 1} dari 3
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">
                  {retryCount > 0 ? `Mencoba lagi... (${retryCount + 1}/3)` : 'Memuat sarung...'}
                </p>
              </div>
            ) : sarungProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 space-y-2">
                  <p>Tidak ada sarung yang tersedia saat ini</p>
                  <p className="text-xs text-gray-400">
                    Debug: API Response - Total products:{' '}
                    {sarungProductsResponse?.data?.length || 0}
                  </p>
                  {sarungProductsResponse?.data && sarungProductsResponse.data.length > 0 && (
                    <details className="text-left text-xs text-gray-400 mt-2">
                      <summary className="cursor-pointer">Show API products (debug)</summary>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {sarungProductsResponse.data.slice(0, 10).map((p) => (
                          <div key={p.id}>
                            {p.name} - Category: {p.category.name} (Type: {p.category.type})
                          </div>
                        ))}
                        {sarungProductsResponse.data.length > 10 && (
                          <div>... and {sarungProductsResponse.data.length - 10} more</div>
                        )}
                      </div>
                    </details>
                  )}
                  {(lastError || apiError) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Muat Ulang
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {sarungProducts.map((product) => {
                  const selectedQuantity = getSelectedSarungQuantity(product.id)
                  
                  return (
                    <div
                      key={product.id}
                      className={`relative transform transition-all duration-200 hover:scale-105 ${
                        selectedQuantity > 0
                          ? 'ring-4 ring-blue-500 ring-offset-4 shadow-xl'
                          : 'hover:shadow-lg'
                      }`}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleSarungSelection}
                        selectedQuantity={selectedQuantity}
                        onOpenHistory={onOpenHistory}
                        className="h-full min-h-[450px] w-full"
                        context="sarung-modal"
                        buttonTextOverride="Pilih"
                        showCustomBadge={{
                          text: "GRATIS",
                          className: "bg-green-500 text-white text-xs px-2 py-1 shadow-md"
                        }}
                      />
                      {selectedQuantity > 0 && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <Badge className="bg-blue-500 text-white shadow-lg text-sm px-3 py-1">
                            ✓ {selectedQuantity}x
                          </Badge>
                        </div>
                      )}
                      {/* Task 11: Stock warning indicator */}
                      {product.availableQuantity !== undefined && product.availableQuantity <= 2 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-orange-500 text-white text-sm px-2 py-1 shadow-lg">
                            Stok: {product.availableQuantity}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Task 18: Distribution Preview */}
          <DistributionPreview />

          {/* Legacy Selected Sarung Info - kept for backward compatibility */}
          {selectedSarung && sarungDistribution.sarungSelections.length === 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-2 border-2 border-green-200 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-green-500 text-white shadow-md">✓ Sarung Terpilih</Badge>
                <span className="font-semibold text-gray-900 text-lg">
                  {selectedSarung.product.name}
                </span>
                <Badge variant="outline" className="border-gray-400 text-gray-700 font-medium">
                  {selectedSarung.quantity}x
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-100">
            <Button
              onClick={handleConfirmWithoutSarung}
              variant="outline"
              disabled={isLoading || isSubmitting}
              className="flex-1 h-12 text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              Tanpa Sarung
            </Button>
            <Button
              onClick={handleConfirmWithSarung}
              disabled={sarungDistribution.sarungSelections.length === 0 || isLoading || isSubmitting}
              className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Konfirmasi Distribusi
                  {sarungDistribution.totalDistributed > 0 && (
                    <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded">
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
