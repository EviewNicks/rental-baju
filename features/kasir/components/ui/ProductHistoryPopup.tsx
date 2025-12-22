'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Package, AlertCircle, Loader2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TransactionHistoryItem } from '../../types/availability'

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
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch transaction history data
  const fetchHistory = async () => {
    if (!productSizeId || !isOpen) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/kasir/transaksi/product-history?productSizeId=${encodeURIComponent(productSizeId)}&statuses=active,diambil&limit=20&sortBy=date_proximity`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transaction history')
      }

      setHistoryData(result.data || [])
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error('Failed to fetch transaction history:', err)
      setError(err instanceof Error ? err.message : 'Network error occurred')
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
    }
  }, [isOpen, productSizeId])

  // Handle retry with exponential backoff
  const handleRetry = () => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 4000)
    
    setTimeout(() => {
      fetchHistory()
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

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4 max-w-md">
                <div className="p-3 bg-red-50 rounded-full w-fit mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Gagal Memuat Data</h3>
                  <p className="text-sm text-gray-600 mb-4">{error}</p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                    disabled={retryCount >= 3}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    {retryCount >= 3 ? 'Maksimal percobaan tercapai' : `Coba Lagi ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
                  </Button>
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