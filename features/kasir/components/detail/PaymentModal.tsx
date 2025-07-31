'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, CreditCard } from 'lucide-react'
import { PaymentForm } from './PaymentForm'
import { usePaymentProcessing } from '../../hooks/usePaymentProcessing'
import { formatCurrency } from '../../lib/utils'
import type { TransactionDetail } from '../../types/transaction-detail'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
}

export function PaymentModal({ isOpen, onClose, transaction }: PaymentModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const remainingAmount = transaction.totalAmount - transaction.amountPaid

  const { processPayment, isProcessing, error, isSuccess, data, reset } = 
    usePaymentProcessing(transaction.id, {
      onSuccess: () => {
        setShowSuccess(true)
        // Auto close after showing success message
        setTimeout(() => {
          handleClose()
        }, 2000)
      },
      onError: (error) => {
        console.error('Payment failed:', error)
      }
    })

  const handleClose = () => {
    setShowSuccess(false)
    reset()
    onClose()
  }

  const handleSubmit = (formData: {
    jumlah: number
    metode: 'tunai' | 'transfer' | 'kartu'
    referensi?: string
    catatan?: string
  }) => {
    processPayment({
      jumlah: formData.jumlah,
      metode: formData.metode,
      referensi: formData.referensi || undefined,
      catatan: formData.catatan || undefined,
    })
  }

  // Success state
  if (showSuccess && isSuccess && data) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pembayaran sebesar <span className="font-medium">{formatCurrency(data.jumlah)}</span> telah berhasil diproses
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode:</span>
                  <span className="font-medium capitalize">{data.metode}</span>
                </div>
                {data.referensi && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Referensi:</span>
                    <span className="font-medium">{data.referensi}</span>
                  </div>
                )}
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium">
                    {new Date(data.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Payment form state
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Proses Pembayaran
          </DialogTitle>
          <DialogDescription>
            Transaksi: <span className="font-medium">{transaction.transactionCode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Transaction Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-3">Ringkasan Tagihan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Total Transaksi:</span>
                <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Sudah Dibayar:</span>
                <span className="font-medium">{formatCurrency(transaction.amountPaid)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-blue-900 font-medium">Sisa Tagihan:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <PaymentForm
            remainingAmount={remainingAmount}
            isProcessing={isProcessing}
            error={error}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}