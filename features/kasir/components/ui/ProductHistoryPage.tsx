/**
 * ProductHistoryPage Component
 * Full-page version of ProductHistoryPopup for displaying transaction history in a new tab
 * Reuses all logic from ProductHistoryPopup but with full-page layout instead of modal
 */
'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Package, AlertCircle, Loader2, History, RefreshCw } from 'lucide-react'
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
  type AvailabilityError,
} from '../../lib/errors/availabilityErrors'

interface ProductHistoryPageProps {
  productSizeId: string
  productName: string
  size: string
  ageCategory: string
}

interface ApiResponse {
  success: boolean
  data: Array<{
    transactionCode: string
    quantity: number
    startDate: string
    endDate: string
    status: 'active' | 'diambil'
    displayText: string
  }>
  cached: boolean
  cachedAt?: string
  metadata?: {
    productSizeId: string
    statuses: string[]
    totalResults: number
    cacheExpiresAt: string
    serviceUsed?: string
  }
  error?: string
  userMessage?: string
  errorType?: string
  retryable?: boolean
  suggestions?: string[]
  helpText?: string
  timestamp?: string
}

export function ProductHistoryPage({
  productSizeId,
  productName,
  size,
  ageCategory,
}: ProductHistoryPageProps) {
  const [historyData, setHistoryData] = useState<TransactionHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AvailabilityError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

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
        <p className="text-xs text-blue-700">💡 {error.details.helpText}</p>
      </div>
    )
  }

  // Fetch transaction history data with enhanced error handling
  const fetchHistory = async () => {
    if (!productSizeId) return

    setIsLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(
        `/api/kasir/transaksi/product-history?productSizeId=${encodeURIComponent(productSizeId)}&statuses=active,diambil&limit=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Koneksi bermasalah',
          userMessage: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.',
          errorType: 'API_ERROR',
          retryable: true,
        }))

        const errorType = errorData.errorType || determineErrorType({ status: response.status })
        const userMessage = errorData.userMessage || errorData.error || response.statusText

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw createAvailabilityError(errorType as any, {
          statusCode: response.status,
          message: userMessage,
          retryable: errorData.retryable,
          suggestions: errorData.suggestions,
          helpText: errorData.helpText,
        })
      }

      const result: ApiResponse = await response.json()

      if (result.cached) {
        setIsCached(true)
        setCachedAt(result.cachedAt || null)
        console.log('[ProductHistoryPage] Using cached data:', {
          cachedAt: result.cachedAt,
          cacheExpiresAt: result.metadata?.cacheExpiresAt,
        })
      } else {
        setIsCached(false)
        setCachedAt(null)
      }

      if (!result.success) {
        const errorType =
          result.errorType || determineErrorType(new Error(result.error || 'Failed to fetch'))
        const userMessage = result.userMessage || result.error || 'Gagal memuat riwayat transaksi'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw createAvailabilityError(errorType as any, {
          message: userMessage,
          retryable: result.retryable,
          suggestions: result.suggestions,
          helpText: result.helpText,
        })
      }

      const parsedData = (result.data || []).map((item) => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
      }))

      setHistoryData(parsedData)
      setRetryCount(0)
      setIsRetrying(false)

      if (result.metadata) {
        console.log('[ProductHistoryPage] API metadata:', {
          serviceUsed: result.metadata.serviceUsed,
          totalResults: result.metadata.totalResults,
          productSizeId: result.metadata.productSizeId,
        })
      }
    } catch (err) {
      console.error('Failed to fetch transaction history:', {
        error: err,
        productSizeId,
        retryCount,
        timestamp: new Date().toISOString(),
      })

      if (err instanceof Error && err.name === 'AbortError') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timeoutError = createAvailabilityError('NETWORK_TIMEOUT' as any, {
          message: 'Request timeout after 10 seconds',
        })
        setError(timeoutError)
      } else if (err && typeof err === 'object' && 'type' in err) {
        setError(err as AvailabilityError)
      } else {
        const errorType = determineErrorType(err)
        const availabilityError = createAvailabilityError(errorType, {
          message: err instanceof Error ? err.message : 'Unknown error',
        })
        setError(availabilityError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSizeId])

  // Enhanced retry with exponential backoff
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

    const delay = calculateRetryDelay(newRetryCount, config)

    setTimeout(async () => {
      await fetchHistory()
      setIsRetrying(false)
    }, delay)
  }

  // Get status badge variant
  const getStatusBadge = (status: 'active' | 'diambil') => {
    switch (status) {
      case 'active':
        return {
          variant: 'outline' as const,
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          label: 'Aktif',
        }
      case 'diambil':
        return {
          variant: 'outline' as const,
          color: 'text-green-700 bg-green-50 border-green-200',
          label: 'Diambil',
        }
      default:
        return {
          variant: 'outline' as const,
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          label: status,
        }
    }
  }

  // Handle close - try to close window, fallback to history back
  const handleClose = () => {
    // Try to close the window (works if opened via window.open)
    window.close()

    // Fallback: if window.close() doesn't work, go back in history
    setTimeout(() => {
      if (!window.closed) {
        window.history.back()
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Riwayat Product Transaksi</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {productName} • {ageCategory} • {size}
                </p>
              </div>
            </div>
            <Button onClick={handleClose} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-lg text-gray-600">Memuat riwayat transaksi...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6 max-w-lg bg-white rounded-xl shadow-lg p-8">
              <div
                className={cn(
                  'p-4 rounded-full w-fit mx-auto',
                  error.retryable ? 'bg-orange-50' : 'bg-red-50',
                )}
              >
                <AlertCircle
                  className={cn('h-12 w-12', error.retryable ? 'text-orange-600' : 'text-red-600')}
                />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  {error.retryable ? 'Gagal Memuat Data' : 'Terjadi Kesalahan'}
                </h3>
                <p className="text-base text-gray-600 mb-4">{error.userMessage}</p>

                {process.env.NODE_ENV === 'development' && error.technicalMessage && (
                  <p className="text-xs text-gray-400 mb-4 font-mono">
                    Debug: {error.technicalMessage}
                  </p>
                )}

                {renderSuggestions(error)}
                {renderHelpText(error)}

                {error.retryable && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="lg"
                      disabled={!shouldRetry(error, retryCount + 1) || isRetrying}
                      className={cn(
                        'text-blue-600 border-blue-200 hover:bg-blue-50',
                        isRetrying && 'opacity-50',
                      )}
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Mencoba lagi...
                        </>
                      ) : shouldRetry(error, retryCount + 1) ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Coba Lagi{' '}
                          {retryCount > 0
                            ? `(${retryCount}/${RETRY_CONFIGS[error.type]?.maxAttempts || 3})`
                            : ''}
                        </>
                      ) : (
                        'Maksimal percobaan tercapai'
                      )}
                    </Button>

                    {retryCount > 0 && shouldRetry(error, retryCount + 1) && (
                      <p className="text-sm text-gray-500">
                        Percobaan ke-{retryCount} dari {RETRY_CONFIGS[error.type]?.maxAttempts || 3}
                      </p>
                    )}
                  </div>
                )}

                {!error.retryable && (
                  <div className="space-y-3">
                    <Button onClick={handleClose} variant="outline" size="lg">
                      Kembali
                    </Button>
                    <p className="text-sm text-gray-500">
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
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6 max-w-lg bg-white rounded-xl shadow-lg p-8">
              <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto">
                <Package className="h-12 w-12 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Tidak Ada Transaksi Aktif
                </h3>
                <p className="text-base text-gray-600 mb-4">
                  {productName} ({size} - {ageCategory}) tidak memiliki transaksi dengan status{' '}
                  <span className="font-medium text-blue-600">Aktif</span> atau{' '}
                  <span className="font-medium text-green-600">Diambil</span>
                </p>
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">💡 Informasi:</p>
                  <ul className="text-left space-y-2">
                    <li>• Produk ini tersedia untuk disewa</li>
                    <li>• Tidak ada penyewaan yang sedang berlangsung</li>
                    <li>• Riwayat transaksi selesai tidak ditampilkan di sini</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction List */}
        {!isLoading && !error && historyData.length > 0 && (
          <div className="space-y-6">
            {/* Header with count and refresh */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-medium text-gray-900">
                    Ditemukan {historyData.length} transaksi aktif
                  </h2>
                  {isCached && cachedAt && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      Data tersimpan (cache) sejak {new Date(cachedAt).toLocaleTimeString('id-ID')}
                    </p>
                  )}
                </div>

                {/* Refresh Button */}
                <Button
                  onClick={() => fetchHistory()}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Transaction Cards */}
            <div className="grid gap-4">
              {historyData.map((transaction, index) => {
                const statusBadge = getStatusBadge(transaction.status)

                return (
                  <div
                    key={`${transaction.transactionCode}-${index}`}
                    className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-medium text-gray-900">
                          {transaction.transactionCode}
                        </span>
                        <Badge
                          variant={statusBadge.variant}
                          className={cn('text-sm px-3 py-1', statusBadge.color)}
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <span className="text-base font-medium text-gray-700">
                        {transaction.quantity} item
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-gray-500 font-mono bg-gray-50 rounded p-3">
                      {transaction.displayText}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
