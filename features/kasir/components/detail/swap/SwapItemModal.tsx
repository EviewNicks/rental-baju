'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Shirt } from 'lucide-react'
import type { TransactionDetail } from '../../../types'
import { useSwapItem } from '../../../hooks/useSwapItem'
import { useReceiptPrint } from '../../../hooks/useReceiptPrint'
import { SwapItemSelectionStep } from './SwapItemSelectionStep'
import { SwapConfirmationStep } from './SwapConfirmationStep'

export interface SelectedNewItemData {
  product: {
    id: string
    name: string
    code: string
    category: string
    image?: string
    pricePerDay: number
  }
  size: {
    id: string
    size: string
    ageCategory: string
    availableQuantity: number
  }
}

interface SwapItemModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
  initialSelectedItem?: TransactionDetail['products'][0] | null
}

export function SwapItemModal({
  isOpen,
  onClose,
  transaction,
  initialSelectedItem,
}: SwapItemModalProps) {
  // Navigation step: 'select' (mockup 2) -> 'confirm' (mockup 1)
  const [step, setStep] = useState<'select' | 'confirm'>('select')

  // The item in the transaction being swapped
  const [selectedItem, setSelectedItem] = useState<TransactionDetail['products'][0] | null>(null)

  // The replacement product & size
  const [replacement, setReplacement] = useState<SelectedNewItemData | null>(null)

  // Print receipt checkbox (default false / opt-in to avoid blocking cashier flow)
  const [printReceiptOnSuccess, setPrintReceiptOnSuccess] = useState(false)

  // Hooks
  const { tukarItem, isSwapping } = useSwapItem(
    transaction.transactionCode,
    {
      onSuccess: () => {
        toast.success('Baju / ukuran berhasil ditukar!')
        // Non-blocking asynchronous PDF printing in background
        if (printReceiptOnSuccess) {
          toast.info('Menyiapkan struk revisi...')
          printReceipt(transaction.transactionCode).catch((e) => {
            console.error('Failed to auto-print receipt', e)
          })
        }
        setStep('select')
        setReplacement(null)
        onClose()
      },
      onError: (err) => {
        toast.error(err.message || 'Gagal memproses penukaran baju')
      },
    },
  )

  const { printReceipt } = useReceiptPrint()

  // Set default selected item when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setReplacement(null)
      if (initialSelectedItem) {
        setSelectedItem(initialSelectedItem)
      } else if (transaction.products && transaction.products.length > 0) {
        setSelectedItem(transaction.products[0])
      }
    }
  }, [isOpen, initialSelectedItem, transaction])

  const isBusy = isSwapping

  const handleClose = () => {
    if (isBusy) return
    setStep('select')
    setReplacement(null)
    onClose()
  }

  // Calculate financial difference
  const calculateFinancialDiff = () => {
    if (!selectedItem || !replacement) {
      return { priceDelta: 0, newSubtotal: 0, oldSubtotal: 0 }
    }

    const durationMultiplier = selectedItem.duration === 7 ? 1.5 : 1.0
    const oldSubtotal = selectedItem.subtotal || selectedItem.pricePerDay * selectedItem.quantity
    const newPricePerDuration = Math.round(replacement.product.pricePerDay * durationMultiplier)
    const newSubtotal = newPricePerDuration * selectedItem.quantity
    const priceDelta = newSubtotal - oldSubtotal

    return { priceDelta, newSubtotal, oldSubtotal }
  }

  const { priceDelta, newSubtotal, oldSubtotal } = calculateFinancialDiff()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && handleClose()}>
      <DialogContent
        showCloseButton={!isBusy}
        onPointerDownOutside={(e) => {
          if (isBusy) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isBusy) e.preventDefault()
        }}
        className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-6xl max-h-[92vh] h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 gap-0 border-amber-200/60 shadow-2xl rounded-2xl bg-white overflow-hidden"
      >
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-sm flex items-center justify-center">
                <Shirt className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  {step === 'select'
                    ? 'Tukar Baju / Ukuran'
                    : 'Konfirmasi Perubahan Nota & Penukaran'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {step === 'select'
                    ? 'Pilih baju pengganti atau ganti ukuran untuk item ini tanpa perlu membatalkan nota.'
                    : 'Tinjau rincian perubahan biaya dan penukaran sebelum menyimpan ke sistem.'}
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                {transaction.transactionCode}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {step === 'select' ? (
            <SwapItemSelectionStep
              transaction={transaction}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              replacement={replacement}
              onSelectReplacement={setReplacement}
              onNext={() => setStep('confirm')}
              onCancel={handleClose}
            />
          ) : (
            <SwapConfirmationStep
              transaction={transaction}
              selectedItem={selectedItem!}
              replacement={replacement}
              oldSubtotal={oldSubtotal}
              newSubtotal={newSubtotal}
              priceDelta={priceDelta}
              printReceipt={printReceiptOnSuccess}
              onTogglePrintReceipt={setPrintReceiptOnSuccess}
              onBack={() => setStep('select')}
              onConfirmSwap={async (financialAction, paymentMethod, notes) => {
                if (selectedItem && replacement) {
                  await tukarItem({
                    transaksiItemId: selectedItem.id,
                    newItem: {
                      produkId: replacement.product.id,
                      productSizeId: replacement.size.id,
                      size: replacement.size.size,
                      ageCategory: replacement.size.ageCategory,
                      hargaSewa: replacement.product.pricePerDay,
                    },
                    financialAdjustment: {
                      priceDelta,
                      action: financialAction,
                      paymentMethod,
                    },
                    catatan: notes,
                  })
                }
              }}
              isSubmitting={isSwapping}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
