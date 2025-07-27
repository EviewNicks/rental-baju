'use client'

import Link from 'next/link'
import { ArrowLeft, Download, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/features/kasir/components/ui/status-badge'
import { CustomerInfoCard } from './CustomerInfoCard'
import { ProductDetailCard } from './ProductDetailCard'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ActivityTimeline } from './ActivityTimeline'
import { ActionButtonsPanel } from './ActionButtonPanel'
import { useTransactionDetail } from '../../hooks/useTransactionDetail'
import { formatDate } from '../../lib/utils'

interface TransactionDetailPageProps {
  transactionId: string
}

export function TransactionDetailPage({ transactionId }: TransactionDetailPageProps) {
  const { transaction, isLoading, error, refreshTransaction, clearError } = useTransactionDetail(transactionId)

  if (isLoading) {
    return <TransactionDetailSkeleton />
  }

  if (error) {
    // Enhanced error detection
    const isNotFound = error.message?.includes('tidak ditemukan') || error.message?.includes('Not Found')
    const isNetworkError = error.message?.includes('fetch') || error.message?.includes('Network')
    const isServerError = error.message?.includes('Internal Server Error') || error.message?.includes('500')
    const isPermissionError = error.message?.includes('unauthorized') || error.message?.includes('403')
    
    const getErrorDetails = () => {
      if (isNotFound) {
        return {
          title: 'Transaksi Tidak Ditemukan',
          description: `Transaksi dengan kode ${transactionId} tidak dapat ditemukan.`,
          suggestions: [
            'Periksa kembali kode transaksi',
            'Cari transaksi di daftar transaksi',
            'Pastikan transaksi belum dihapus'
          ],
          canRetry: false
        }
      } else if (isNetworkError) {
        return {
          title: 'Masalah Koneksi',
          description: 'Koneksi internet bermasalah. Periksa koneksi dan coba lagi.',
          suggestions: [
            'Periksa koneksi internet',
            'Coba refresh halaman',
            'Tunggu beberapa saat lalu coba lagi'
          ],
          canRetry: true
        }
      } else if (isServerError) {
        return {
          title: 'Server Bermasalah',
          description: 'Terjadi gangguan pada server. Tim kami sedang menangani masalah ini.',
          suggestions: [
            'Tunggu beberapa menit lalu coba lagi',
            'Hubungi support jika masalah berlanjut',
            'Coba akses fitur lain terlebih dahulu'
          ],
          canRetry: true
        }
      } else if (isPermissionError) {
        return {
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk mengakses transaksi ini.',
          suggestions: [
            'Login ulang dengan akun yang benar',
            'Hubungi admin untuk mendapatkan akses',
            'Periksa role dan permissions akun Anda'
          ],
          canRetry: false
        }
      } else {
        return {
          title: 'Terjadi Kesalahan',
          description: 'Gagal memuat detail transaksi. Silakan coba lagi.',
          suggestions: [
            'Refresh halaman',
            'Coba lagi dalam beberapa saat',
            'Hubungi support jika masalah berlanjut'
          ],
          canRetry: true
        }
      }
    }

    const errorDetails = getErrorDetails()

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div data-testid="error-boundary" className="text-center max-w-lg mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorDetails.title}
          </h1>
          <p className="text-gray-600 mb-4">
            {errorDetails.description}
          </p>
          
          {/* Recovery suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Saran untuk mengatasi masalah:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {errorDetails.canRetry && (
              <Button data-testid="retry-button" onClick={clearError} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            )}
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div data-testid="error-boundary" className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">
            Transaksi dengan kode {transactionId} tidak dapat ditemukan.
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="transaction-detail-page" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button data-testid="back-button" variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Detail Transaksi</h1>
                <p className="text-sm text-gray-600">{transaction.transactionCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge data-testid="status-badge" status={transaction.status} />
              <Button data-testid="refresh-button" variant="outline" size="sm" onClick={refreshTransaction}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Cetak
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Transaksi</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Kode Transaksi</div>
                  <div className="font-semibold text-gray-900">{transaction.transactionCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tanggal Sewa</div>
                  <div className="font-semibold text-gray-900">
                    {formatDate(transaction.startDate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tanggal Kembali</div>
                  <div className="font-semibold text-gray-900">
                    {transaction.endDate ? formatDate(transaction.endDate) : 'Belum ditentukan'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <StatusBadge data-testid="status-badge" status={transaction.status} />
                </div>
              </div>
              {transaction.notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-gray-600">Catatan:</div>
                  <div className="text-sm text-gray-900">{transaction.notes}</div>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <CustomerInfoCard data-testid="customer-info-card" customer={transaction.customer} />

            {/* Products */}
            <div data-testid="product-detail-card" className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Produk yang Disewa</h2>
              {transaction.products.map((item, index) => (
                <ProductDetailCard key={index} item={item} />
              ))}
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline data-testid="activity-timeline" timeline={transaction.timeline} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <PaymentSummaryCard
              data-testid="payment-summary-card"
              transaction={transaction}
              payments={transaction.payments}
              penalties={transaction.penalties}
            />

            {/* Action Buttons */}
            <ActionButtonsPanel transaction={transaction} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TransactionDetailSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
              >
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
              >
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
