'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, DollarSign, RefreshCw, AlertTriangle, Package, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './PaymentModal'
import { PickupModal } from './PickupModal'
import { CancelModal } from './CancelModal'
import { LostItemResolutionModal } from './LostItemResolutionModal'
import type { TransactionDetail } from '../../types'
import { isPickupAvailable, calculateTransactionPickupStatus } from '../../lib/utils/client'
import { queryKeys } from '@/lib/react-query'
import { logger } from '@/services/logger'

interface ActionButtonsPanelProps {
  transaction: TransactionDetail
}

export function ActionButtonsPanel({ transaction }: ActionButtonsPanelProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isLostItemModalOpen, setIsLostItemModalOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Create logger instance for this component
  const componentLogger = logger.child('ActionButtonPanel')

  const handleAction = async (action: string) => {
    setIsProcessing(action)
    try {
      // Handle different actions
      switch (action) {
        case 'return':
          console.info('📦 Processing return', {
            transactionCode: transaction.transactionCode,
            action: 'return',
          })
          // Navigate to return process page
          router.push(`/dashboard/transaction/${transaction.transactionCode}/return`)
          break
        case 'reminder':
          console.info('📢 Sending reminder', {
            transactionCode: transaction.transactionCode,
            action: 'reminder',
          })
          // TODO: Implement reminder functionality
          break
        case 'payment':
          console.info('💰 Opening payment modal', {
            transactionCode: transaction.transactionCode,
            action: 'payment',
            currentAmount: transaction.amountPaid,
            totalAmount: transaction.totalAmount,
          })
          setIsPaymentModalOpen(true)
          break
        case 'pickup':
          console.info('📋 Opening pickup modal', {
            transactionCode: transaction.transactionCode,
            action: 'pickup',
            productsCount: transaction.products?.length || 0,
            pickupStatus: {
              totalItems: pickupStatus.totalItems,
              totalPickedUp: pickupStatus.totalPickedUp,
              totalRemaining: pickupStatus.totalRemaining,
              hasRemainingItems: pickupStatus.hasRemainingItems,
            },
          })
          setIsPickupModalOpen(true)
          break
        case 'receipt':
          console.info('🧾 Printing receipt', {
            transactionCode: transaction.transactionCode,
            action: 'receipt',
          })
          // TODO: Implement receipt printing
          break
      }
    } catch (error) {
      console.error('❌ Action failed', {
        transactionCode: transaction.transactionCode,
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsProcessing(null)
    }
  }

  // Calculate pickup status for enhanced logic
  const pickupStatus = calculateTransactionPickupStatus(transaction)

  // ✅ TASK 7.1: Detect unresolved lost items
  // FIX: Use conditionBreakdown (not multiConditionSummary.conditionBreakdown) which has resolutionStatus
  const hasUnresolvedLostItems = transaction.products?.some((p) => {
    // Debug logging
    componentLogger.debug('hasUnresolvedLostItems', 'Checking product for lost items', {
      productId: p.id,
      productName: p.product.name,
      hasConditionBreakdown: !!p.conditionBreakdown,
      conditionBreakdownLength: p.conditionBreakdown?.length || 0,
      conditionBreakdown: p.conditionBreakdown,
    })

    return p.conditionBreakdown?.some((c) => {
      const isHilang = c.kondisiAkhir.toLowerCase().includes('hilang')
      const isUnresolved = !c.resolutionStatus

      componentLogger.debug('hasUnresolvedLostItems', 'Checking condition', {
        conditionId: c.id,
        kondisiAkhir: c.kondisiAkhir,
        isHilang,
        resolutionStatus: c.resolutionStatus,
        isUnresolved,
        willTriggerButton: isHilang && isUnresolved,
      })

      return isHilang && isUnresolved
    })
  })

  // Collect lost items for modal
  // FIX: Use conditionBreakdown (not multiConditionSummary.conditionBreakdown) which has resolutionStatus
  const lostItems = transaction.products
    ?.flatMap((p) =>
      p.conditionBreakdown
        ?.filter((c) => c.kondisiAkhir.toLowerCase().includes('hilang') && !c.resolutionStatus)
        .map((c) => ({
          returnRecordId: c.id || '',
          itemId: p.id,
          productName: p.product.name,
          sizeInfo: p.sizeInfo || 'N/A',
          depositAmount: Number(c.penaltyAmount || 0),
        })) || [],
    )
    .filter((item) => item.returnRecordId) || []

  // Debug logging for lost items
  componentLogger.debug('lostItems', 'Lost items collection', {
    hasUnresolvedLostItems,
    lostItemsCount: lostItems.length,
    lostItems: lostItems.map((item) => ({
      returnRecordId: item.returnRecordId,
      productName: item.productName,
      depositAmount: item.depositAmount,
    })),
  })

  // Enhanced button visibility logic - FIXED: Allow actions for 'active', 'terlambat', and 'diambil' status
  const canReturn =
    (transaction.status === 'active' || transaction.status === 'terlambat' || transaction.status === 'diambil') &&
    transaction.products?.some((p) => p.jumlahDiambil && p.jumlahDiambil > 0)
  
  // ✅ TASK 10: Fix partial pickup button visibility
  // Include 'diambil' status to support partial pickups across multiple visits
  // isPickupAvailable() already checks for remaining items, so we just need to allow the status
  const canPickup = (
    transaction.status === 'active' || 
    transaction.status === 'terlambat' ||
    transaction.status === 'diambil'  // Allow pickup even if status is 'diambil' (for partial pickups)
  ) && isPickupAvailable(transaction)
  const needsPayment =
    transaction.amountPaid < transaction.totalAmount ||
    (transaction.penalties && transaction.penalties.some((p) => p.status === 'pending'))
  const canCancel =
    (transaction.status === 'active' || transaction.status === 'terlambat') &&
    transaction.products?.every((p) => (p.jumlahDiambil || 0) === 0)

  // ✅ FIX: Lost item resolution button visibility
  // Show button for 'pending_resolution' (new status) and 'selesai' (backward compatibility)
  // Hide for 'cancelled' status
  const canResolveLostItems = 
    hasUnresolvedLostItems && 
    transaction.status !== 'cancelled'

  // COMPREHENSIVE LOGGING for debugging button visibility
  componentLogger.debug('render', 'Button visibility calculation', {
    transactionCode: transaction.transactionCode,
    status: transaction.status,
    canReturn,
    canPickup,
    canCancel,
    needsPayment,
    productsCount: transaction.products?.length || 0,
    productsWithPickup: transaction.products?.map(p => ({
      id: p.id,
      productName: p.product.name,
      quantity: p.quantity,
      jumlahDiambil: p.jumlahDiambil,
      hasPickup: (p.jumlahDiambil || 0) > 0
    })),
    totalAmount: transaction.totalAmount,
    amountPaid: transaction.amountPaid,
    penalties: transaction.penalties?.map(p => ({ status: p.status }))
  })

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Aksi Transaksi</h3>

      <div className="space-y-3">
        {/* Pickup Item */}
        {canPickup && (
          <Button
            onClick={() => handleAction('pickup')}
            disabled={isProcessing === 'pickup'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing === 'pickup' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            {isProcessing === 'pickup' ? 'Memproses...' : 'Proses Pengambilan'}
          </Button>
        )}

        {/* Return Item */}
        {canReturn && (
          <Button
            onClick={() => handleAction('return')}
            disabled={isProcessing === 'return'}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing === 'return' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {isProcessing === 'return' ? 'Membuka...' : 'Proses Pengembalian'}
          </Button>
        )}

        {/* ✅ TASK 7.3: Resolve Lost Items Button */}
        {canResolveLostItems && (
          <Button
            onClick={() => setIsLostItemModalOpen(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Resolve Barang Hilang
          </Button>
        )}

        {/* Process Payment */}
        {needsPayment && (
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            variant="outline"
            className="w-full border-blue-400 text-blue-600 hover:bg-blue-50"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Proses Pembayaran
          </Button>
        )}

        {/* Cancel Transaction */}
        {canCancel && (
          <Button
            onClick={() => setIsCancelModalOpen(true)}
            variant="outline"
            className="w-full border-red-400 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Batalkan Transaksi
          </Button>
        )}
      </div>

      {/* Status Info */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {transaction.status === 'active' && (
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle className="h-4 w-4" />
              Transaksi sedang berjalan
            </div>
          )}
          {transaction.status === 'terlambat' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Transaksi terlambat
            </div>
          )}
          {transaction.status === 'diambil' && (
            <div className="flex items-center gap-2 text-green-600">
              <Package className="h-4 w-4" />
              Barang telah diambil
            </div>
          )}
          {transaction.status === 'pending_resolution' && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Menunggu resolusi barang hilang
            </div>
          )}
          {transaction.status === 'selesai' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Transaksi selesai
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setIsProcessing(null)
        }}
        transaction={transaction}
      />

      {/* Pickup Modal */}
      <PickupModal
        isOpen={isPickupModalOpen}
        onClose={() => {
          componentLogger.info('onClose', 'Pickup modal closing - triggering data refresh')

          setIsPickupModalOpen(false)
          setIsProcessing(null)

          // Force refresh transaction data to ensure updated jumlahDiambil values
          queryClient.invalidateQueries({
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode),
          })

          componentLogger.debug('onClose', 'Query invalidation triggered', {
            transactionCode: transaction.transactionCode,
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode)
          })
        }}
        transaction={transaction}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          componentLogger.info('onClose', 'Cancel modal closing - triggering data refresh')

          setIsCancelModalOpen(false)
          setIsProcessing(null)

          // Force refresh transaction data after cancellation
          queryClient.invalidateQueries({
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode),
          })

          componentLogger.debug('onClose', 'Query invalidation triggered for cancel', {
            transactionCode: transaction.transactionCode,
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode)
          })
        }}
        transaction={transaction}
      />

      {/* ✅ TASK 7.4: Lost Item Resolution Modal */}
      <LostItemResolutionModal
        isOpen={isLostItemModalOpen}
        onClose={() => {
          componentLogger.info('onClose', 'Lost item modal closing - triggering data refresh')

          setIsLostItemModalOpen(false)
          setIsProcessing(null)

          // Force refresh transaction data after resolution
          queryClient.invalidateQueries({
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode),
          })

          componentLogger.debug('onClose', 'Query invalidation triggered for lost item resolution', {
            transactionCode: transaction.transactionCode,
            queryKey: queryKeys.kasir.transaksi.detail(transaction.transactionCode)
          })
        }}
        transaction={transaction}
        lostItems={lostItems}
      />
    </div>
  )
}