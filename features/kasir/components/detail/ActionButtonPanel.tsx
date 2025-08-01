'use client'

import { useState } from 'react'
import {
  CheckCircle,
  MessageCircle,
  DollarSign,
  Download,
  RefreshCw,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './PaymentModal'
import { PickupModal } from './PickupModal'
import { useLogger } from '@/lib/client-logger'
import type { TransactionDetail } from '../../types/transaction-detail'

interface ActionButtonsPanelProps {
  transaction: TransactionDetail
}

export function ActionButtonsPanel({ transaction }: ActionButtonsPanelProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false)
  const logger = useLogger('ActionButtonsPanel')

  const handleAction = async (action: string) => {
    logger.info(`🎯 Action initiated: ${action}`, {
      transactionCode: transaction.transactionCode,
      transactionId: transaction.id,
      action,
      timestamp: new Date().toISOString()
    })

    setIsProcessing(action)
    try {
      // Handle different actions
      switch (action) {
        case 'return':
          logger.info('📦 Processing return', { 
            transactionCode: transaction.transactionCode,
            action: 'return'
          })
          // TODO: Implement return functionality
          break
        case 'reminder':
          logger.info('📢 Sending reminder', { 
            transactionCode: transaction.transactionCode,
            action: 'reminder'
          })
          // TODO: Implement reminder functionality
          break
        case 'payment':
          logger.info('💰 Opening payment modal', { 
            transactionCode: transaction.transactionCode,
            action: 'payment',
            currentAmount: transaction.amountPaid,
            totalAmount: transaction.totalAmount
          })
          setIsPaymentModalOpen(true)
          break
        case 'pickup':
          logger.info('📋 Opening pickup modal', { 
            transactionCode: transaction.transactionCode,
            action: 'pickup',
            productsCount: transaction.products?.length || 0
          })
          setIsPickupModalOpen(true)
          break
        case 'receipt':
          logger.info('🧾 Printing receipt', { 
            transactionCode: transaction.transactionCode,
            action: 'receipt'
          })
          // TODO: Implement receipt printing
          break
      }
    } catch (error) {
      logger.error('❌ Action failed', {
        transactionCode: transaction.transactionCode,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(null)
    }
  }

  const canReturn = transaction.status === 'active'
  const canPickup = transaction.status === 'active'
  const canSendReminder = transaction.status === 'terlambat'
  const needsPayment =
    transaction.amountPaid < transaction.totalAmount ||
    (transaction.penalties && transaction.penalties.some((p) => p.status === 'pending'))

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
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isProcessing === 'return' ? 'Memproses...' : 'Proses Pengembalian'}
          </Button>
        )}

        {/* Send Reminder */}
        {canSendReminder && (
          <Button
            onClick={() => handleAction('reminder')}
            disabled={isProcessing === 'reminder'}
            variant="outline"
            className="w-full border-yellow-400 text-yellow-600 hover:bg-yellow-50"
          >
            {isProcessing === 'reminder' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            {isProcessing === 'reminder' ? 'Mengirim...' : 'Kirim Pengingat'}
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

        {/* Print Receipt */}
        <Button
          onClick={() => handleAction('receipt')}
          disabled={isProcessing === 'receipt'}
          variant="outline"
          className="w-full"
        >
          {isProcessing === 'receipt' ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isProcessing === 'receipt' ? 'Mencetak...' : 'Cetak Struk'}
        </Button>
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
          logger.debug('💰 Payment modal closed', {
            transactionCode: transaction.transactionCode
          })
          setIsPaymentModalOpen(false)
          setIsProcessing(null)
        }}
        transaction={transaction}
      />

      {/* Pickup Modal */}
      <PickupModal
        isOpen={isPickupModalOpen}
        onClose={() => {
          logger.debug('📋 Pickup modal closed', {
            transactionCode: transaction.transactionCode
          })
          setIsPickupModalOpen(false)
          setIsProcessing(null)
        }}
        transaction={transaction}
      />
    </div>
  )
}
