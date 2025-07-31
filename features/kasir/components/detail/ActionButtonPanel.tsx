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
import type { TransactionDetail } from '../../types/transaction-detail'

interface ActionButtonsPanelProps {
  transaction: TransactionDetail
}

export function ActionButtonsPanel({ transaction }: ActionButtonsPanelProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false)

  const handleAction = async (action: string) => {
    setIsProcessing(action)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Handle different actions
      switch (action) {
        case 'return':
          console.log('Processing return for transaction:', transaction.id)
          break
        case 'reminder':
          console.log('Sending reminder for transaction:', transaction.id)
          break
        case 'payment':
          setIsPaymentModalOpen(true)
          break
        case 'pickup':
          setIsPickupModalOpen(true)
          break
        case 'receipt':
          console.log('Printing receipt for transaction:', transaction.id)
          break
      }
    } catch (error) {
      console.error('Action failed:', error)
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
          setIsPaymentModalOpen(false)
          setIsProcessing(null)
        }}
        transaction={transaction}
      />

      {/* Pickup Modal */}
      <PickupModal
        isOpen={isPickupModalOpen}
        onClose={() => {
          setIsPickupModalOpen(false)
          setIsProcessing(null)
        }}
        transaction={transaction}
      />
    </div>
  )
}
