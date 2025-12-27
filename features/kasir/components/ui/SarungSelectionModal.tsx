'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from './product-card'
import { getSarungProducts } from '../../lib/utils/jasSarungUtils'
import { 
  createSarungPairingError, 
  validateSarungSelection,
  SarungPairingErrorType,
  shouldRetrySarungPairingError,
  SARUNG_PAIRING_RETRY_CONFIGS
} from '../../lib/errors/sarungPairingErrors'
import {
  validateQuantityInput,
  validateProductData,
  validateSarungModalSubmission,
  validateProductSizeSelection,
  globalRateLimiter
} from '../../lib/validation/sarungValidation'
import { toast } from '@/lib/notifications'
import type { Product, ProductSize } from '../../types'

interface SarungSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  jasProduct: Product
  jasQuantity: number
  availableProducts: Product[]
  onConfirmSelection: (selectedSarung?: {
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  }) => void
  onOpenHistory?: (productSizeId: string, productName: string, size: string, ageCategory: string) => void
}

export function SarungSelectionModal({
  isOpen,
  onClose,
  jasProduct,
  jasQuantity,
  availableProducts,
  onConfirmSelection,
  onOpenHistory,
}: SarungSelectionModalProps) {
  const [selectedSarung, setSelectedSarung] = useState<{
    product: Product
    quantity: number
    productSizeId?: string
    selectedSize?: ProductSize
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectionCount, setSelectionCount] = useState(0) // Track selections for rate limiting
  
  const [sarungProducts, setSarungProducts] = useState<Product[]>([])

  // Task 12: Generate session ID for rate limiting
  const sessionId = `sarung-modal-${jasProduct.id}-${Date.now()}`
  // Task 11: Enhanced load sarung products with comprehensive error handling and retry logic
  // Task 12: Added input validation and security measures
  const loadSarungProducts = useCallback(async () => {
    const maxRetries = 3
    let currentAttempt = 0
    
    const attemptLoad = async (): Promise<Product[]> => {
      currentAttempt++
      
      try {
        setIsLoading(true)
        setLastError(null)
        setValidationErrors([])
        
        // Task 12: Validate jas product before loading sarung
        const jasValidation = validateProductData(jasProduct)
        if (!jasValidation.isValid) {
          throw new Error(`Invalid jas product: ${jasValidation.errors.join(', ')}`)
        }
        
        // Simulate potential loading delay/timeout with configurable timeout
        const timeoutDuration = currentAttempt === 1 ? 5000 : 10000 // Longer timeout on retries
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Modal loading timeout')), timeoutDuration)
        })
        
        const loadPromise = new Promise<Product[]>((resolve) => {
          // Filter sarung products from available products
          const filtered = getSarungProducts(availableProducts)
          
          // Task 11: Real-time stock validation
          // Task 12: Enhanced validation with security checks
          const validatedProducts = filtered.filter(product => {
            // Validate product data
            const productValidation = validateProductData(product)
            if (!productValidation.isValid) {
              console.warn(`Product ${product.name} failed validation:`, productValidation.errors)
              return false
            }
            
            // Check if product has sufficient stock
            if (product.availableQuantity === undefined || product.availableQuantity <= 0) {
              console.warn(`Sarung ${product.name} has no available stock`)
              return false
            }
            
            // Check if product category is valid
            if (product.category.toLowerCase() !== 'sarung') {
              console.warn(`Product ${product.name} is not a valid sarung category`)
              return false
            }
            
            return true
          })
          
          // Simulate async operation with variable delay based on attempt
          const delay = currentAttempt === 1 ? 100 : 500
          setTimeout(() => resolve(validatedProducts), delay)
        })
        
        const products = await Promise.race([loadPromise, timeoutPromise])
        setRetryCount(currentAttempt - 1) // Reset retry count on success
        return products
        
      } catch (err) {
        console.error(`Error loading sarung products (attempt ${currentAttempt}):`, err)
        
        const errorType = err instanceof Error && err.message.includes('timeout')
          ? SarungPairingErrorType.MODAL_TIMEOUT
          : SarungPairingErrorType.MODAL_LOAD_FAILED
        
        const pairingError = createSarungPairingError(errorType, {
          jasProductId: jasProduct.id,
          error: err instanceof Error ? err.message : 'Unknown error',
          attempt: currentAttempt,
          maxAttempts: maxRetries
        })
        
        // Check if we should retry
        if (currentAttempt < maxRetries && shouldRetrySarungPairingError(pairingError, currentAttempt)) {
          const retryConfig = SARUNG_PAIRING_RETRY_CONFIGS[errorType]
          if (retryConfig) {
            const delay = Math.min(
              retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, currentAttempt - 1),
              retryConfig.maxDelay
            )
            
            setLastError(`Percobaan ${currentAttempt} gagal, mencoba lagi dalam ${delay}ms...`)
            setRetryCount(currentAttempt)
            
            // Wait for backoff delay then retry
            await new Promise(resolve => setTimeout(resolve, delay))
            return attemptLoad()
          }
        }
        
        // Final failure - show error and return empty array
        setLastError(pairingError.userMessage)
        toast.error('Gagal Memuat Sarung', pairingError.userMessage)
        
        return []
      } finally {
        setIsLoading(false)
      }
    }
    
    const products = await attemptLoad()
    setSarungProducts(products)
    
  }, [jasProduct, availableProducts])

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSarung(null)
      setRetryCount(0)
      setLastError(null)
      setValidationErrors([])
      setSelectionCount(0)
    } else {
      // Load sarung products when modal opens
      loadSarungProducts()
    }
  }, [isOpen, loadSarungProducts])

  // Task 11: Enhanced sarung selection with comprehensive validation and real-time stock checking
  // Task 12: Added comprehensive input validation and security measures
  const handleSarungSelection = (
    product: Product,
    quantity: number,
    productSizeId?: string
  ) => {
    try {
      // Task 12: Rate limiting check
      if (!globalRateLimiter.canSubmit(sessionId)) {
        const remaining = globalRateLimiter.getRemainingSubmissions(sessionId)
        toast.error('Terlalu Banyak Percobaan', `Silakan tunggu sebelum mencoba lagi. Sisa: ${remaining}`)
        return
      }

      // Task 12: Comprehensive input validation
      const quantityValidation = validateQuantityInput(
        quantity,
        product.availableQuantity || 0,
        jasQuantity
      )
      
      if (!quantityValidation.isValid) {
        setValidationErrors(quantityValidation.errors)
        toast.error('Validasi Gagal', quantityValidation.errors[0])
        return
      }

      // Task 12: Product data validation
      const productValidation = validateProductData(product)
      if (!productValidation.isValid) {
        setValidationErrors(productValidation.errors)
        toast.error('Data Produk Tidak Valid', productValidation.errors[0])
        return
      }

      // Task 12: Size selection validation if applicable
      if (productSizeId) {
        const selectedSize = product.sizes?.find(size => size.id === productSizeId)
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
            sarungProductId: product.id
          }
        )
        
        setValidationErrors([pairingError.userMessage])
        toast.error('Stok Tidak Cukup', pairingError.userMessage)
        return
      }
      
      // Validate the selection using existing validation
      const validationError = validateSarungSelection(
        {
          id: jasProduct.id,
          name: jasProduct.name,
          category: jasProduct.category
        },
        {
          id: product.id,
          name: product.name,
          category: product.category,
          availableQuantity: product.availableQuantity
        },
        jasQuantity,
        quantity
      )
      
      if (validationError) {
        setValidationErrors([validationError.userMessage])
        toast.error('Validasi Gagal', validationError.userMessage)
        return
      }
      
      // Find the selected size info if productSizeId is provided
      const selectedSize = productSizeId
        ? product.sizes?.find(size => size.id === productSizeId)
        : undefined

      setSelectedSarung({
        product,
        quantity,
        productSizeId,
        selectedSize,
      })
      
      // Clear any previous errors and record successful selection
      setLastError(null)
      setValidationErrors([])
      setSelectionCount(prev => prev + 1)
      globalRateLimiter.recordSubmission(sessionId)
      
      toast.success('Berhasil', `Sarung ${product.name} dipilih`)
      
    } catch (err) {
      console.error('Error in sarung selection:', err)
      const pairingError = createSarungPairingError(
        SarungPairingErrorType.PAIRING_VALIDATION_FAILED,
        {
          jasProductId: jasProduct.id,
          sarungProductId: product.id,
          reason: err instanceof Error ? err.message : 'Unknown validation error'
        }
      )
      
      setLastError(pairingError.userMessage)
      setValidationErrors([pairingError.userMessage])
      toast.error('Gagal Memilih Sarung', pairingError.userMessage)
    }
  }

  // Task 11: Enhanced confirmation with error handling
  // Task 12: Added comprehensive validation before submission
  const handleConfirmWithSarung = () => {
    if (!selectedSarung) return

    try {
      setIsLoading(true)
      
      // Task 12: Rate limiting check for submission
      if (!globalRateLimiter.canSubmit(sessionId)) {
        toast.error('Terlalu Banyak Percobaan', 'Silakan tunggu sebelum mencoba lagi')
        setIsLoading(false)
        return
      }

      // Task 12: Comprehensive validation before submission
      const submissionValidation = validateSarungModalSubmission(
        jasProduct,
        selectedSarung,
        jasQuantity,
        selectionCount
      )
      
      if (!submissionValidation.isValid) {
        setValidationErrors(submissionValidation.errors)
        toast.error('Validasi Gagal', submissionValidation.errors[0])
        setIsLoading(false)
        return
      }

      // Show warnings if any
      if (submissionValidation.warnings && submissionValidation.warnings.length > 0) {
        submissionValidation.warnings.forEach(warning => {
          toast.warning('Peringatan', warning)
        })
      }
      
      // Final validation before confirmation (existing validation)
      const finalValidation = validateSarungSelection(
        {
          id: jasProduct.id,
          name: jasProduct.name,
          category: jasProduct.category
        },
        {
          id: selectedSarung.product.id,
          name: selectedSarung.product.name,
          category: selectedSarung.product.category,
          availableQuantity: selectedSarung.product.availableQuantity
        },
        jasQuantity,
        selectedSarung.quantity
      )
      
      if (finalValidation) {
        setValidationErrors([finalValidation.userMessage])
        toast.error('Validasi Akhir Gagal', finalValidation.userMessage)
        setIsLoading(false)
        return
      }
      
      // Record successful submission
      globalRateLimiter.recordSubmission(sessionId)
      
      onConfirmSelection(selectedSarung)
      
    } catch (err) {
      console.error('Error confirming sarung selection:', err)
      setValidationErrors(['Terjadi kesalahan saat mengkonfirmasi pilihan sarung'])
      toast.error('Gagal Konfirmasi', 'Terjadi kesalahan saat mengkonfirmasi pilihan sarung')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmWithoutSarung = () => {
    try {
      setIsLoading(true)
      
      // Task 12: Rate limiting check
      if (!globalRateLimiter.canSubmit(sessionId)) {
        toast.error('Terlalu Banyak Percobaan', 'Silakan tunggu sebelum mencoba lagi')
        setIsLoading(false)
        return
      }

      // Task 12: Basic validation for jas product
      const jasValidation = validateProductData(jasProduct)
      if (!jasValidation.isValid) {
        setValidationErrors(jasValidation.errors)
        toast.error('Data Jas Tidak Valid', jasValidation.errors[0])
        setIsLoading(false)
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
      setIsLoading(false)
    }
  }

  // Task 11: Enhanced retry function
  const handleRetry = () => {
    setRetryCount(0)
    setLastError(null)
    setValidationErrors([])
    loadSarungProducts()
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden z-50"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Pilih Sarung untuk {jasProduct.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Pilih sarung yang akan dipasangkan dengan jas (gratis) atau lanjutkan tanpa sarung
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Jas Product Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800">Jas Terpilih</Badge>
              <span className="font-medium text-gray-900">{jasProduct.name}</span>
              <Badge variant="outline">{jasQuantity}x</Badge>
            </div>
          </div>

          {/* Sarung Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Pilih Sarung (Opsional)</h3>
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
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
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
                  {lastError && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {sarungProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`relative ${
                      selectedSarung?.product.id === product.id
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : ''
                    }`}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleSarungSelection}
                      selectedQuantity={
                        selectedSarung?.product.id === product.id
                          ? selectedSarung.quantity
                          : 0
                      }
                      onOpenHistory={onOpenHistory}
                      className="h-full"
                    />
                    {selectedSarung?.product.id === product.id && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-blue-500 text-white">Terpilih</Badge>
                      </div>
                    )}
                    {/* Task 11: Stock warning indicator */}
                    {product.availableQuantity !== undefined && product.availableQuantity <= 2 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-orange-500 text-white text-xs">
                          Stok: {product.availableQuantity}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Sarung Info */}
          {selectedSarung && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">Sarung Terpilih</Badge>
                <span className="font-medium text-gray-900">{selectedSarung.product.name}</span>
                <Badge variant="outline">{selectedSarung.quantity}x</Badge>
                <Badge className="bg-yellow-400 text-gray-900">GRATIS</Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleConfirmWithoutSarung}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Tanpa Sarung
            </Button>
            <Button
              onClick={handleConfirmWithSarung}
              disabled={!selectedSarung || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isLoading ? 'Memproses...' : 'Konfirmasi dengan Sarung'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}