'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle,
  Shirt,
  Printer,
  Loader2,
  DollarSign,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '../../../lib/utils/client'
import { extractSizeInfo } from '../../../lib/utils/kondisiAwalParser'
import type { TransactionDetail } from '../../../types'
import type { SelectedNewItemData } from './SwapItemModal'

interface SwapConfirmationStepProps {
  transaction: TransactionDetail
  selectedItem: TransactionDetail['products'][0]
  replacement: SelectedNewItemData | null
  oldSubtotal: number
  newSubtotal: number
  priceDelta: number
  printReceipt: boolean
  onTogglePrintReceipt: (val: boolean) => void
  onBack: () => void
  onConfirmSwap: (
    action: 'none' | 'pay_now' | 'add_to_remaining' | 'refund_cash' | 'reduce_remaining',
    paymentMethod?: 'tunai' | 'qris' | 'transfer' | 'kartu_debit',
    notes?: string,
  ) => Promise<void>
  isSubmitting: boolean
}

export function SwapConfirmationStep({
  transaction,
  selectedItem,
  replacement,
  oldSubtotal,
  newSubtotal,
  priceDelta,
  printReceipt,
  onTogglePrintReceipt,
  onBack,
  onConfirmSwap,
  isSubmitting,
}: SwapConfirmationStepProps) {
  // Financial action & payment method state
  const [paymentOption, setPaymentOption] = useState<'pay_now' | 'add_to_remaining'>(
    'pay_now',
  )
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [refundOption, setRefundOption] = useState<'refund_cash' | 'reduce_remaining'>(
    'refund_cash',
  )
  const [notes, setNotes] = useState('')

  const oldSizeInfo = extractSizeInfo(selectedItem)

  const handleConfirm = useCallback(async () => {
    if (priceDelta > 0) {
      if (paymentOption === 'pay_now') {
        await onConfirmSwap('pay_now', paymentMethod, notes)
      } else {
        await onConfirmSwap('add_to_remaining', undefined, notes)
      }
    } else if (priceDelta < 0) {
      await onConfirmSwap(refundOption, undefined, notes)
    } else {
      await onConfirmSwap('none', undefined, notes)
    }
  }, [priceDelta, paymentOption, paymentMethod, refundOption, notes, onConfirmSwap])

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isSubmitting) {
          e.preventDefault()
          handleConfirm()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, handleConfirm])

  // Calculate new total transaction amount
  const newTotalAmount = transaction.totalAmount + priceDelta

  return (
    <div className="space-y-6">
      {/* Visual Item Comparison */}
      {replacement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Old Item Card */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Barang Lama
            </span>

            <div className="flex gap-3">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                {selectedItem.product.image ? (
                  <Image
                    src={selectedItem.product.image}
                    alt={selectedItem.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Shirt className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                  {selectedItem.product.name}
                </h5>
                <p className="text-xs text-gray-500">{selectedItem.product.category}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200 text-gray-800 font-semibold">
                    Ukuran: {oldSizeInfo.size || 'Standard'}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 mt-2">
                  Subtotal: {formatCurrency(oldSubtotal)}
                </p>
              </div>
            </div>
          </div>

          {/* New Item Card */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Barang Pengganti
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                Pengganti Baru
              </span>
            </div>

            <div className="flex gap-3">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 border border-amber-200">
                {replacement.product.image ? (
                  <Image
                    src={replacement.product.image}
                    alt={replacement.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-600">
                    <Shirt className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                  {replacement.product.name}
                </h5>
                <p className="text-xs text-gray-500">{replacement.product.category}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold">
                    Ukuran Baru: {replacement.size.size}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                    {replacement.size.ageCategory}
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-800 mt-2">
                  Subtotal Baru: {formatCurrency(newSubtotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Difference Highlight Box */}
      <div className="space-y-4">
          {priceDelta > 0 ? (
            /* Kurang Bayar (+Delta) */
            <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-amber-800">
                    Selisih Harga Sewa
                  </div>
                  <div className="text-xl font-bold text-amber-900">
                    +{formatCurrency(priceDelta)}{' '}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md ml-1">
                      Kurang Bayar
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>Total Nota Baru:</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatCurrency(newTotalAmount)}
                  </div>
                </div>
              </div>

              {/* Payment Action Options */}
              <div className="pt-3 border-t border-amber-200/80 space-y-2">
                <label className="block text-xs font-bold text-amber-950">
                  Pilihan Pembayaran Selisih:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('pay_now')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentOption === 'pay_now'
                        ? 'border-amber-600 bg-white ring-2 ring-amber-500/20'
                        : 'border-amber-200/60 bg-amber-50/40 hover:bg-white'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900">
                        Bayar Sekarang (+{formatCurrency(priceDelta)})
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        Pelanggan melunasi selisih saat ini juga
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('add_to_remaining')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentOption === 'add_to_remaining'
                        ? 'border-amber-600 bg-white ring-2 ring-amber-500/20'
                        : 'border-amber-200/60 bg-amber-50/40 hover:bg-white'
                    }`}
                  >
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900">
                        Bayar Nanti saat Ambil
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        Tambahkan selisih ke Sisa Bayar nota
                      </div>
                    </div>
                  </button>
                </div>

                {/* Payment Method Selector if 'pay_now' */}
                {paymentOption === 'pay_now' && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-amber-900 font-semibold">
                      Metode:
                    </span>
                    {(['tunai', 'qris', 'transfer'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          paymentMethod === method
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-200 text-gray-700 hover:bg-amber-100/50'
                        }`}
                      >
                        {method === 'tunai' && '💵 Tunai'}
                        {method === 'qris' && '📱 QRIS'}
                        {method === 'transfer' && '🏦 Transfer'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : priceDelta < 0 ? (
            /* Lebih Bayar (-Delta) */
            <div className="p-4 bg-green-50/80 border border-green-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-green-800">
                    Selisih Harga Sewa
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    -{formatCurrency(Math.abs(priceDelta))}{' '}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-green-200 text-green-900 rounded-md ml-1">
                      Lebih Bayar
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>Total Nota Baru:</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatCurrency(newTotalAmount)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-green-200 space-y-2">
                <label className="block text-xs font-bold text-green-950">
                  Pilihan Pengembalian Lebih Bayar:
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRefundOption('refund_cash')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      refundOption === 'refund_cash'
                        ? 'bg-green-600 text-white shadow-xs'
                        : 'bg-white border border-green-200 text-gray-700'
                    }`}
                  >
                    Kembalikan Tunai Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundOption('reduce_remaining')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      refundOption === 'reduce_remaining'
                        ? 'bg-green-600 text-white shadow-xs'
                        : 'bg-white border border-green-200 text-gray-700'
                    }`}
                  >
                    Potong dari Sisa Bayar Tagihan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Harga Sama (Delta === 0) */
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    Harga Sewa Sama (Rp 0)
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Tidak ada perubahan total biaya sewa pada nota transaksi ini.
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-600">
                <div>Total Nota:</div>
                <div className="font-bold text-gray-900 text-sm">
                  {formatCurrency(newTotalAmount)}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Optional Note */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">
          Catatan Perubahan (Opsional):
        </label>
        <Textarea
          placeholder="Contoh: Pelanggan minta tukar size karena saat dicoba di rumah kekecilan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-xs rounded-xl resize-none"
        />
      </div>

      {/* Auto-print revised receipt checkbox */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
        <input
          type="checkbox"
          id="print-receipt-checkbox"
          checked={printReceipt}
          onChange={(e) => onTogglePrintReceipt(e.target.checked)}
          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
        />
        <label
          htmlFor="print-receipt-checkbox"
          className="flex items-center gap-1.5 font-medium text-gray-800 cursor-pointer"
        >
          <Printer className="h-4 w-4 text-amber-600" />
          Cetak / unduh Struk Revisi setelah berhasil disimpan (opsional)
        </label>
      </div>

      {/* Sticky Action Buttons */}
      <div className="sticky -bottom-5 mt-6 bg-white/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 border-t border-gray-200 flex items-center justify-between z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-xl px-5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali Ubah Pilihan
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md px-6 h-10"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan Perubahan...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi & Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
