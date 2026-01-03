'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, RefreshCw, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/features/kasir/components/ui/status-badge'
import { CustomerInfoCard } from './CustomerInfoCard'
import { KasirInfoCard } from './KasirInfoCard'
import { ProductDetailCard } from './ProductDetailCard'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ActivityTimeline } from './ActivityTimeline'
import { ActionButtonsPanel } from './ActionButtonPanel'
import { TransactionProgressSummary } from '../ui/return-progress-indicator'
import { useTransactionDetail } from '../../hooks/useTransactionDetail'
import { useReceiptPrint } from '../../hooks/useReceiptPrint'
import { formatDate } from '../../lib/utils/client'
import { detectTransactionError } from '../../lib/utils/errorDetector'
import { 
  calculateTransactionProgress, 
  type TransaksiItemWithReturns 
} from '../../lib/utils/partialReturnHelpers'
// TASK 23: Import sarung transformation utilities
import { 
  processTransactionItemsWithSeparateSarung,
  type SarungDisplayItem 
} from '../../lib/utils/sarungTransformation'

interface TransactionDetailPageProps {
  transactionId: string
}

export function TransactionDetailPage({ transactionId }: TransactionDetailPageProps) {
  const { transaction, isLoading, error, refreshTransaction, clearError, updateCustomerInTransaction } =
    useTransactionDetail(transactionId)
  const { printReceipt, isPrinting } = useReceiptPrint()

  // Handler for print receipt button
  const handlePrintReceipt = () => {
    if (transaction?.transactionCode) {
      printReceipt(transaction.transactionCode)
    }
  }

  if (isLoading) {
    return <TransactionDetailSkeleton />
  }

  if (error) {
    // Use centralized error detection utility (eliminates ~70 lines duplicate code)
    const errorDetails = detectTransactionError(error)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div data-testid="error-boundary" className="text-center max-w-lg mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorDetails.title}</h1>
          <p className="text-gray-600 mb-4">{errorDetails.description}</p>

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

  // ✅ TASK 7: Calculate transaction progress for display (Requirements: 4.1, 4.4, 4.5)
  const transactionProgress = calculateTransactionProgress({
    id: transaction.id,
    kode: transaction.transactionCode,
    tglMulai: transaction.startDate,
    tglSelesai: transaction.endDate,
    status: transaction.status,
    totalHarga: transaction.totalAmount || 0,
    jumlahBayar: 0,
    sisaBayar: 0,
    createdAt: transaction.createdAt || new Date().toISOString(),
    updatedAt: transaction.updatedAt || new Date().toISOString(),
    penyewa: {
      id: transaction.customer?.id || '',
      nama: transaction.customer?.name || '',
      telepon: transaction.customer?.phone || '',
      alamat: transaction.customer?.address || '',
    },
    kasir: transaction.kasir ? {
      id: transaction.kasir.id,
      nama: transaction.kasir.nama,
      isActive: transaction.kasir.isActive || true,
    } : undefined,
    metodeBayar: 'tunai' as const,
    createdBy: transaction.kasir?.id || '',
    items: transaction.products?.map(product => ({
      id: product.id,
      jumlahDiambil: product.jumlahDiambil || 0,
      conditionBreakdown: product.conditionBreakdown,
    })) as TransaksiItemWithReturns[] || []
  })

  // ✅ TASK 7: Show progress summary only if items have been picked up
  const shouldShowProgressSummary = transaction.products?.some(p => (p.jumlahDiambil || 0) > 0)

  return (
    <div
      data-testid="transaction-detail-page"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
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
              <Button
                data-testid="print-receipt-button"
                variant="outline"
                size="sm"
                onClick={handlePrintReceipt}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Cetak Struk
                  </>
                )}
              </Button>
              <Button
                data-testid="refresh-button"
                variant="outline"
                size="sm"
                onClick={() => refreshTransaction()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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

            {/* Customer and Kasir Info */}
            <KasirInfoCard data-testid="kasir-info-card" kasir={transaction.kasir || null} />
            <CustomerInfoCard 
              data-testid="customer-info-card" 
              customer={transaction.customer} 
              onCustomerUpdated={updateCustomerInTransaction}
            />

            {/* ✅ TASK 7: Return Progress Summary (Requirements: 4.1, 4.4, 4.5) */}
            {shouldShowProgressSummary && (
              <TransactionProgressSummary
                progress={transactionProgress}
                totalItems={transaction.products?.length || 0}
                data-testid="transaction-progress-summary"
              />
            )}

            {/* Products */}
            <div data-testid="product-detail-card" className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Produk yang Disewa</h2>
              {(() => {
                // TASK 23: Process transaction items to include separate sarung cards
                console.log('🔍 TASK 23 DEBUG - Raw transaction.products:', transaction.products)
                const allDisplayItems = processTransactionItemsWithSeparateSarung(transaction.products)
                console.log('🔍 TASK 23 DEBUG - Processed display items:', allDisplayItems)
                
                return allDisplayItems.map((item, index) => {
                  // Transform item data to match ProductDetailCard interface
                  const transformedItem = {
                    product: {
                      id: item.product?.id || '',
                      name: item.product?.name || '',
                      category: item.product?.category || '',
                      size: item.product?.size || '',
                      color: item.product?.color || '',
                      image: (item.product as { imageUrl?: string })?.imageUrl || item.product?.image || '', // Fix: use imageUrl from API
                      description: item.product?.description
                    },
                    quantity: item.quantity || 0,
                    jumlahDiambil: item.jumlahDiambil,
                    pricePerDay: item.pricePerDay || 0,
                    duration: item.duration || 0,
                    subtotal: item.subtotal || 0,
                    statusKembali: item.statusKembali,
                    totalReturnPenalty: item.totalReturnPenalty,
                    conditionBreakdown: item.conditionBreakdown,
                    kondisiAwal: item.kondisiAwal,
                    // TASK 23: Add sarung gratis identification
                    isSarungGratis: (item as SarungDisplayItem).isSarungGratis,
                    pairedWithJas: (item as SarungDisplayItem).pairedWithJas,
                    pairedWithJasId: (item as SarungDisplayItem).pairedWithJasId,
                    // Keep linkedSarung for backward compatibility (will be ignored in display)
                    linkedSarung: 'linkedSarung' in item ? item.linkedSarung : undefined
                  }
                  
                  return (
                    <ProductDetailCard key={`${item.product?.id}-${index}`} item={transformedItem} />
                  )
                })
              })()}
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline
              data-testid="activity-timeline"
              timeline={transaction.timeline}
              transactionCode={transaction.transactionCode}
            />
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
    <div
      data-testid="loading-skeleton"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
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
