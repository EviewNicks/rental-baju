'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Package, AlertCircle, Loader2, History, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TransactionHistoryItem } from '../../types/availability'
import { 
  createAvailabilityError, 
  determineErrorType, 
  shouldRetry, 
  calculateRetryDelay,
  RETRY_CONFIGS,
  type AvailabilityError 
} from '../../lib/errors/availabilityErrors'

interface ProductHistoryPopupProps {
  productSizeId: string
  productName: string
  size: string
  ageCategory: string
  isOpen: boolean
  onClose: () => void
}

interface ApiResponse {
  success: boolean
  data: TransactionHistoryItem[]
  cached: boolean
  cachedAt?: string
  metadata?: {
    productSizeId: string
    statuses: string[]
    totalResults: number
    cacheExpiresAt: string
  }
  error?: string
  userMessage?: string
  errorType?: string
  retryable?: boolean
  suggestions?: string[]
  helpText?: string
  timestamp?: string
}

export function ProductHistoryPopup({
  productSizeId,
  productName,
  size,
  ageCategory,
  isOpen,
  onClose,
}: ProductHistoryPopupProps) {
  const [historyData, setHistoryData] = useState<TransactionHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AvailabilityError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Helper function to safely render suggestions
  const renderSuggestions = (error: AvailabilityError) => {
    if (!error.details?.suggestions || !Array.isArray(error.details.suggestions)) return null
    
    return (
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Saran:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          {(error.details.suggestions as string[]).map((suggestion, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className="text-gray-400">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Helper function to safely render help text
  const renderHelpText = (error: AvailabilityError) => {
    if (!error.details?.helpText || typeof error.details.helpText !== 'string') return null
    
    return (
      <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 {error.details.helpText}
        </p>
      </div>
    )
  }

  // Fetch transaction history data with enhanced error handling
  const fetchHistory = async () => {
    if (!productSizeId || !isOpen) return

    setIsLoading(true)
    setError(null)

    try {
      // Add timeout to fetch request (Requirement 5.5: Handle API timeouts gracefully)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(
        `/api/kasir/transaksi/product-history?productSizeId=${encodeURIComponent(productSizeId)}&statuses=active,diambil&limit=20&sortBy=date_proximity`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle enhanced API error responses with user-friendly messages
        const errorData = await response.json().catch(() => ({ 
          error: 'Koneksi bermasalah',
          userMessage: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.',
          errorType: 'API_ERROR',
          retryable: true 
        }))
        
        // Use API-provided error type and user message if available
        const errorType = errorData.errorType || determineErrorType({ status: response.status })
        const userMessage = errorData.userMessage || errorData.error || response.statusText
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw createAvailabilityError(errorType as any, {
          statusCode: response.status,
          message: userMessage,
          retryable: errorData.retryable,
          suggestions: errorData.suggestions,
          helpText: errorData.helpText
        })
      }

      const result: ApiResponse = await response.json()

      if (!result.success) {
        // Use API-provided error information with enhanced user messages
        const errorType = result.errorType || determineErrorType(new Error(result.error || 'Failed to fetch'))
        const userMessage = result.userMessage || result.error || 'Gagal memuat riwayat transaksi'
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw createAvailabilityError(errorType as any, {
          message: userMessage,
          retryable: result.retryable,
          suggestions: result.suggestions,
          helpText: result.helpText
        })
      }

      setHistoryData(result.data || [])
      setRetryCount(0) // Reset retry count on success
      setIsRetrying(false)
    } catch (err) {
      console.error('Failed to fetch transaction history:', {
        error: err,
        productSizeId,
        retryCount,
        timestamp: new Date().toISOString()
      })

      // Handle abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timeoutError = createAvailabilityError('NETWORK_TIMEOUT' as any, {
          message: 'Request timeout after 10 seconds'
        })
        setError(timeoutError)
      } else if (err && typeof err === 'object' && 'type' in err) {
        // Already an AvailabilityError
        setError(err as AvailabilityError)
      } else {
        // Unknown error - determine type and create error
        const errorType = determineErrorType(err)
        const availabilityError = createAvailabilityError(errorType, {
          message: err instanceof Error ? err.message : 'Unknown error'
        })
        setError(availabilityError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    } else {
      // Reset state when popup closes
      setHistoryData([])
      setError(null)
      setRetryCount(0)
      setIsRetrying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productSizeId])

  // Enhanced retry with exponential backoff and proper error handling
  const handleRetry = async () => {
    if (!error || !shouldRetry(error, retryCount + 1)) {
      return
    }

    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    setIsRetrying(true)
    
    const config = RETRY_CONFIGS[error.type]
    if (!config) {
      setIsRetrying(false)
      return
    }

    // Calculate delay with exponential backoff
    const delay = calculateRetryDelay(newRetryCount, config)
    
    setTimeout(async () => {
      await fetchHistory()
      setIsRetrying(false)
    }, delay)
  }

  // Format date for display
  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const startDay = start.getDate()
    const endDay = end.getDate()
    const startMonth = start.toLocaleDateString('id-ID', { month: 'short' })
    const endMonth = end.toLocaleDateString('id-ID', { month: 'short' })
    
    if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth}`
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: 'active' | 'diambil') => {
    switch (status) {
      case 'active':
        return { variant: 'outline' as const, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Aktif' }
      case 'diambil':
        return { variant: 'outline' as const, color: 'text-green-700 bg-green-50 border-green-200', label: 'Diambil' }
      default:
        return { variant: 'outline' as const, color: 'text-gray-700 bg-gray-50 border-gray-200', label: status }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Riwayat Transaksi</h2>
              <p className="text-sm text-gray-600">
                {productName} • {ageCategory} • {size}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-600">Memuat riwayat transaksi...</p>
              </div>
            </div>
          )}

          {/* Enhanced Error State with specific error handling */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4 max-w-md">
                <div className={cn(
                  "p-3 rounded-full w-fit mx-auto",
                  error.retryable ? "bg-orange-50" : "bg-red-50"
                )}>
                  <AlertCircle className={cn(
                    "h-8 w-8",
                    error.retryable ? "text-orange-600" : "text-red-600"
                  )} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {error.retryable ? 'Gagal Memuat Data' : 'Terjadi Kesalahan'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{error.userMessage}</p>
                  
                  {/* Show technical details for debugging (only in development) */}
                  {process.env.NODE_ENV === 'development' && error.technicalMessage && (
                    <p className="text-xs text-gray-400 mb-4 font-mono">
                      Debug: {error.technicalMessage}
                    </p>
                  )}
                  
                  {/* Show suggestions if available */}
                  {renderSuggestions(error)}
                  
                  {/* Show help text if available */}
                  {renderHelpText(error)}
                  
                  {/* Retry button with enhanced logic */}
                  {error.retryable && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        size="sm"
                        disabled={!shouldRetry(error, retryCount + 1) || isRetrying}
                        className={cn(
                          "text-blue-600 border-blue-200 hover:bg-blue-50",
                          isRetrying && "opacity-50"
                        )}
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mencoba lagi...
                          </>
                        ) : shouldRetry(error, retryCount + 1) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Coba Lagi {retryCount > 0 ? `(${retryCount}/${RETRY_CONFIGS[error.type]?.maxAttempts || 3})` : ''}
                          </>
                        ) : (
                          'Maksimal percobaan tercapai'
                        )}
                      </Button>
                      
                      {/* Show retry info */}
                      {retryCount > 0 && shouldRetry(error, retryCount + 1) && (
                        <p className="text-xs text-gray-500">
                          Percobaan ke-{retryCount} dari {RETRY_CONFIGS[error.type]?.maxAttempts || 3}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Non-retryable errors - show helpful actions */}
                  {!error.retryable && (
                    <div className="space-y-2">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        Tutup
                      </Button>
                      <p className="text-xs text-gray-500">
                        Silakan refresh halaman atau hubungi admin jika masalah berlanjut
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && historyData.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="p-3 bg-gray-50 rounded-full w-fit mx-auto">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Belum Ada Transaksi</h3>
                  <p className="text-sm text-gray-600">
                    Produk ini belum pernah disewa atau semua transaksi sudah selesai
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction List */}
          {!isLoading && !error && historyData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Ditemukan {historyData.length} transaksi aktif
                </h3>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Cache 5 menit
                </Badge>
              </div>

              <div className="space-y-3">
                {historyData.map((transaction, index) => {
                  const statusBadge = getStatusBadge(transaction.status)
                  
                  return (
                    <div
                      key={`${transaction.transactionCode}-${index}`}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {transaction.transactionCode}
                          </span>
                          <Badge
                            variant={statusBadge.variant}
                            className={cn('text-xs', statusBadge.color)}
                          >
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {transaction.quantity} item
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDateRange(transaction.startDate, transaction.endDate)}
                        </span>
                      </div>
                      
                      {/* Display formatted text as per requirement */}
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {transaction.displayText}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Data diperbarui setiap 5 menit</span>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}