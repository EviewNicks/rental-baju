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
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Loader2, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { CancelForm } from './CancelForm'
import { useCancelTransaction } from '../../hooks/useCancelTransaction'
import { formatCurrency } from '../../lib/utils/client'
import { 
  calculateRefundEligibility, 
  formatRefundInfo, 
  type RefundCalculation 
} from '../../lib/utils/refundCalculator'
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
  const [refundCalculation, setRefundCalculation] = useState<RefundCalculation | null>(null)

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

  // ✅ NEW: Calculate refund eligibility when modal opens
  useEffect(() => {
    if (isOpen && transaction.amountPaid > 0) {
      const calculation = calculateRefundEligibility(
        transaction.startDate, // tglMulai
        transaction.amountPaid
      )
      setRefundCalculation(calculation)
    }
  }, [isOpen, transaction.startDate, transaction.amountPaid])

  // ✅ EXISTING: Fetch kasir list when modal opens
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
    setRefundCalculation(null)
    reset()
    onClose()
  }

  const handleReasonSubmit = (submittedReason: string) => {
    setReason(submittedReason)
    setStep('confirm')
  }

  const handleConfirmCancel = () => {
    // ✅ EXISTING: Validate kasir selection for paid transactions
    const isPaidTransaction = transaction.amountPaid > 0
    
    if (isPaidTransaction && !kasirId) {
      toast.error('Pilih kasir terlebih dahulu untuk transaksi yang sudah dibayar')
      return
    }
    
    // ✅ NEW: Pass refund calculation to cancellation request
    const refundData = refundCalculation ? {
      refundAmount: refundCalculation.refundAmount,
      refundPercentage: refundCalculation.refundPercentage,
      isEligible: refundCalculation.isEligible,
      daysUntilPickup: refundCalculation.daysUntilPickup
    } : null
    
    // Pass kasirId and refund data to cancellation request
    cancelTransaction(reason, kasirId, refundData)
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
                {refundCalculation?.isEligible && (
                  <p className="text-green-700 mt-1">
                    Refund: {formatCurrency(refundCalculation.refundAmount)} ({refundCalculation.refundPercentage}%)
                  </p>
                )}
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

            <div className="bg-yellow-50 border text-xs border-yellow-200 rounded-lg p-2">
              <p className=" font-medium text-yellow-900 mb-1">Alasan Pembatalan:</p>
              <p className=" text-yellow-700">{reason}</p>
            </div>

            {/* ✅ NEW: Refund Information Display */}
            {transaction.amountPaid > 0 && refundCalculation && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Informasi Refund
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={formatRefundInfo(refundCalculation).eligibilityBadge.className}
                    >
                      {formatRefundInfo(refundCalculation).eligibilityBadge.text}
                    </Badge>
                  </div>
                  
                
                  
                  <div className="space-y-2 text-xs">

                     
                    <div className="flex justify-between">
                      <span className="text-blue-700">Jumlah Dibayar:</span>
                      <span className="font-medium  text-blue-900">
                        {formatCurrency(transaction.amountPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Jumlah Refund:</span>
                      <span className="font-medium text-blue-900">
                        {formatRefundInfo(refundCalculation).amountDisplay}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-blue-700 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Waktu Pembatalan:
                      </span>
                      <span className="font-medium text-blue-900">
                        {formatRefundInfo(refundCalculation).daysText}
                      </span>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs text-blue-600">
                        {formatRefundInfo(refundCalculation).reasonText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                {transaction.amountPaid > 0 && refundCalculation?.isEligible && (
                  <li>Refund {refundCalculation.refundPercentage}% akan diproses otomatis</li>
                )}
                {transaction.amountPaid > 0 && !refundCalculation?.isEligible && (
                  <li>Tidak ada refund karena pembatalan kurang dari 7 hari</li>
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
