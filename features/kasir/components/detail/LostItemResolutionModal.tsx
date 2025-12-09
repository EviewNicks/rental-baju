'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Package, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { TransactionDetail } from '../../types'

interface LostItem {
  returnRecordId: string
  itemId: string
  productName: string
  sizeInfo: string
  depositAmount: number
}

interface LostItemResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
  lostItems: LostItem[]
}

type ResolutionType = 'customer_replaced' | 'deposit_kept'

export function LostItemResolutionModal({
  isOpen,
  onClose,
  transaction,
  lostItems,
}: LostItemResolutionModalProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType>('customer_replaced')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (lostItems.length === 0) {
      toast.error('Tidak ada barang hilang untuk diselesaikan')
      return
    }

    setIsSubmitting(true)

    try {
      // Process each lost item
      for (const item of lostItems) {
        const response = await fetch(
          `/api/kasir/transaksi/${transaction.id}/resolve-lost-item`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              returnRecordId: item.returnRecordId,
              resolutionType,
              notes: notes.trim() || undefined,
            }),
          },
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Gagal menyelesaikan barang hilang')
        }

        const result = await response.json()
        console.log('Resolution result:', result)
      }

      // Success
      toast.success(
        resolutionType === 'customer_replaced'
          ? 'Barang hilang berhasil diselesaikan. Dana jaminan dikembalikan.'
          : 'Barang hilang berhasil diselesaikan. Dana jaminan ditahan.',
      )

      // Reset form
      setResolutionType('customer_replaced')
      setNotes('')

      // Close modal and refresh
      onClose()
    } catch (error) {
      console.error('Resolution error:', error)
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Confirm if form is dirty
    if (notes.trim()) {
      if (!confirm('Batalkan perubahan?')) {
        return
      }
    }

    // Reset and close
    setResolutionType('customer_replaced')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Resolve Barang Hilang
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lost Items List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Barang Hilang</h3>
            <div className="space-y-2">
              {lostItems.map((item) => (
                <div
                  key={item.returnRecordId}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">{item.sizeInfo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Dana Jaminan</p>
                      <p className="font-semibold text-orange-600">
                        Rp {item.depositAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Pilih Penyelesaian</h3>
            <RadioGroup value={resolutionType} onValueChange={(v) => setResolutionType(v as ResolutionType)}>
              <div className="space-y-3">
                {/* Option 1: Customer Replaced */}
                <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="customer_replaced" id="customer_replaced" className="mt-1" />
                  <Label htmlFor="customer_replaced" className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Customer Beli Sendiri</p>
                      <p className="text-sm text-gray-600">
                        Customer membeli barang pengganti. Dana jaminan akan dikembalikan dan stok
                        dipulihkan.
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Option 2: Deposit Kept */}
                <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="deposit_kept" id="deposit_kept" className="mt-1" />
                  <Label htmlFor="deposit_kept" className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Ganti dengan Dana Jaminan</p>
                      <p className="text-sm text-gray-600">
                        Dana jaminan digunakan untuk membeli pengganti. Barang ditandai sebagai
                        hilang permanen.
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
              Catatan (Opsional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Tindakan ini tidak dapat dibatalkan. Pastikan pilihan Anda sudah benar sebelum
              melanjutkan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
