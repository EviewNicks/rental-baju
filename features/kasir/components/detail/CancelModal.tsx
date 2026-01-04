'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CancelForm } from './CancelForm'
import { useCancelTransaction } from '../../hooks/useCancelTransaction'
import { formatCurrency } from '../../lib/utils/client'
import type { TransactionDetail } from '../../types'

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
}

type ModalStep = 'input' | 'confirm' | 'success' | 'error'

interface Kasir {
  id: string
  nama: string
  isActive: boolean
}

export function CancelModal({ isOpen, onClose, transaction }: CancelModalProps) {
  const [step, setStep] = useState<ModalStep>('input')
  const [reason, setReason] = useState('')
  const [kasirId, setKasirId] = useState<string>('')
  const [kasirList, setKasirList] = useState<Kasir[]>([])
  const [isLoadingKasir, setIsLoadingKasir] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { cancelTransaction, isProcessing, error, isSuccess, reset } = useCancelTransaction(
    transaction.transactionCode,
    {
      onSuccess: () => {
        setShowSuccess(true)
        setStep('success')
        // Auto close after showing success message
        setTimeout(() => {
          handleClose()
        }, 2000)
      },
      onError: () => {
        setStep('error')
      },
    },
  )

  // ✅ NEW: Fetch kasir list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchKasirList()
    }
  }, [isOpen])

  const fetchKasirList = async () => {
    setIsLoadingKasir(true)
    try {
      const response = await fetch('/api/kasir/kasir?limit=100&isActive=true')
      if (!response.ok) {
        throw new Error('Gagal mengambil daftar kasir')
      }
      const result = await response.json()
      
      // API returns: { success: true, data: { data: [...], pagination: {...}, summary: {...} } }
      const kasirData = result.data?.data || []
      
      // Filter only active kasirs
      const activeKasirs = kasirData.filter((kasir: Kasir) => kasir.isActive)
      
      setKasirList(activeKasirs)
    } catch (error) {
      console.error('Error fetching kasir list:', error)
      toast.error('Gagal mengambil daftar kasir')
    } finally {
      setIsLoadingKasir(false)
    }
  }

  const handleClose = () => {
    setShowSuccess(false)
    setStep('input')
    setReason('')
    setKasirId('')
    reset()
    onClose()
  }

  const handleReasonSubmit = (submittedReason: string) => {
    setReason(submittedReason)
    setStep('confirm')
  }

  const handleConfirmCancel = () => {
    // ✅ NEW: Validate kasir selection for paid transactions
    const isPaidTransaction = transaction.amountPaid > 0
    
    if (isPaidTransaction && !kasirId) {
      toast.error('Pilih kasir terlebih dahulu untuk transaksi yang sudah dibayar')
      return
    }
    
    // Pass kasirId to cancellation request
    cancelTransaction(reason, kasirId)
  }

  const handleBack = () => {
    setStep('input')
  }

  // Success state
  if (showSuccess && isSuccess && step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Transaksi Berhasil Dibatalkan
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Transaksi <span className="font-medium">{transaction.transactionCode}</span> telah
              dibatalkan
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm">
                <p className="text-green-900 font-medium">Transaksi berhasil dibatalkan</p>
                <p className="text-green-700 mt-1">
                  Alasan: {reason.length > 50 ? `${reason.substring(0, 50)}...` : reason}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state
  if (step === 'error' && error) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pembatalan Gagal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Terjadi kesalahan saat membatalkan transaksi
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error.message || 'Kesalahan tidak diketahui'}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Tutup
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1">
                Coba Lagi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Confirmation step
  if (step === 'confirm') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Konfirmasi Pembatalan
            </DialogTitle>
            <DialogDescription>
              Pastikan data pembatalan sudah benar sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kode Transaksi:</span>
                  <span className="font-medium text-gray-900">{transaction.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium text-gray-900">{transaction.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transaksi:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.amountPaid)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-900 mb-1">Alasan Pembatalan:</p>
              <p className="text-sm text-yellow-700">{reason}</p>
            </div>

            {/* ✅ NEW: Kasir Selection for Paid Transactions */}
            {transaction.amountPaid > 0 && (
              <div className="space-y-2">
                <Label htmlFor="kasir" className="text-sm font-semibold text-gray-900">
                  Pilih Kasir untuk Refund <span className="text-red-500">*</span>
                </Label>
                {isLoadingKasir ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">Memuat daftar kasir...</span>
                  </div>
                ) : (
                  <Select value={kasirId} onValueChange={setKasirId}>
                    <SelectTrigger id="kasir" className="w-full">
                      <SelectValue placeholder="Pilih kasir untuk expense tracking" />
                    </SelectTrigger>
                    <SelectContent>
                      {kasirList.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">Tidak ada kasir aktif</div>
                      ) : (
                        kasirList.map((kasir) => (
                          <SelectItem key={kasir.id} value={kasir.id}>
                            {kasir.nama}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  Kasir yang dipilih akan digunakan untuk mencatat pengeluaran refund
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan
              </p>
              <ul className="text-xs text-red-600 mt-2 space-y-1 ml-4 list-disc">
                <li>Status transaksi akan diubah menjadi DIBATALKAN</li>
                <li>Transaksi tidak akan dihitung dalam revenue</li>
                {transaction.amountPaid > 0 && (
                  <li>Refund akan diproses otomatis jika kasir dipilih</li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isProcessing}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isProcessing ? 'Memproses...' : 'Ya, Batalkan Transaksi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Input step (default)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan Transaksi</DialogTitle>
          <DialogDescription>
            Masukkan alasan pembatalan transaksi {transaction.transactionCode}
          </DialogDescription>
        </DialogHeader>

        <CancelForm
          onSubmit={handleReasonSubmit}
          onCancel={handleClose}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  )
}
